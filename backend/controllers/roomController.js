const { Server } = require("socket.io");
const Room = require('../models/room');
const Game = require('../models/Game');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

class RoomController {
  constructor(io, initializeGameForRoom, startGameForRoom) {
    this.io = io;
    this.initializeGameForRoom = initializeGameForRoom;
    this.startGameForRoom = startGameForRoom;
    // Map of socketId -> timer handle for deferred room cleanup
    this.disconnectTimers = new Map();
    // Map of roomId -> timer handle for matchmaking bots
    this.matchmakingTimers = new Map();
    this.registerEvents();
  }
  
  async generateUniqueRoomId() {
    let roomId;
    let isUnique = false;
  
    while (!isUnique) {
      roomId = Math.floor(100000 + Math.random() * 900000).toString();
      const existingRoom = await Room.findOne({ roomId: roomId });
      isUnique = !existingRoom;
    }
  
    return roomId;
  }

  async handleCreateCustomRoom(socket) {
    socket.on("create_custom_room", async (data, callback) => {
      const { playerName, playerLimit, gameMode, voiceChatEnabled } = data || {};
      const roomId = await this.generateUniqueRoomId();
      try {
        const newRoom = new Room({
          roomId,
          players: [socket.id],
          isCustom: true,
          empty: true,
          playersName: [playerName],
          playerLimit: playerLimit || 8,
          gameMode: gameMode || "8_players",
          voiceChatEnabled: !!voiceChatEnabled
        });
        await newRoom.save();

        socket.join(roomId);
        if (typeof callback === 'function') {
          callback({ roomId });
        }
        console.log(`Room created with ID: ${roomId}, by player: ${playerName}, limit: ${newRoom.playerLimit}, mode: ${newRoom.gameMode}, voiceChat: ${newRoom.voiceChatEnabled}`);
        
        socket.emit("custom_room_created", { roomId });
        this.io.to(roomId).emit("room_update", {
          players: [playerName],
          playerLimit: newRoom.playerLimit,
          gameMode: newRoom.gameMode,
          voiceChatEnabled: newRoom.voiceChatEnabled
        });
      } catch (err) {
        console.error('Error saving room to MongoDB:', err);
        socket.emit("room_creation_error", "Failed to create the room.");
      }
    });
  }

  async handleJoinCustomRoom(socket) {
    socket.on("join_custom_room", async (data, callback) => {
      const { roomId, playerName } = data || {};
      try {
        const room = await Room.findOne({ roomId: roomId });

        if (!room) {
          const errMsg = "Room not found. The room ID may be incorrect or the room was closed.";
          if (typeof callback === 'function') callback({ success: false, message: errMsg });
          else socket.emit("room_join_error", errMsg);
          return;
        }

        // Check if a game is already actively running for this room
        const activeGame = await Game.findOne({ roomId: roomId });
        if (activeGame) {
          const errMsg = "A game is already in progress in this room. Please wait for it to finish or ask the host to restart.";
          if (typeof callback === 'function') callback({ success: false, message: errMsg });
          else socket.emit("room_join_error", errMsg);
          return;
        }

        // Prevent a socket from joining the same room twice
        if (room.players.includes(socket.id)) {
          socket.join(roomId);
          if (typeof callback === 'function') {
            callback({ success: true, playerLimit: room.playerLimit, playersCount: room.players.length });
          }
          this.io.to(roomId).emit("room_update", {
            players: room.playersName,
            playerLimit: room.playerLimit,
            gameMode: room.gameMode,
            voiceChatEnabled: room.voiceChatEnabled
          });
          return;
        }

        // Allow joining if there is still space (playerLimit is the original capacity)
        if (room.players.length < room.playerLimit) {
          room.players.push(socket.id);
          room.playersName.push(playerName);
          room.empty = true; // Still waiting for more players or host to start
          await room.save();

          socket.join(roomId);
          if (typeof callback === 'function') {
            callback({ success: true, playerLimit: room.playerLimit, playersCount: room.players.length });
          }

          // Notify all players in the room of the updated player list
          this.io.to(roomId).emit("room_update", {
            players: room.playersName,
            playerLimit: room.playerLimit,
            gameMode: room.gameMode,
            voiceChatEnabled: room.voiceChatEnabled
          });

          // Auto-start only if we've hit the exact playerLimit
          if (room.players.length === room.playerLimit) {
            await this.startGameForRoom(roomId, room.players, room.playersName, room.gameMode);
          }
        } else {
          const errMsg = `Room is full (${room.players.length}/${room.playerLimit} players).`;
          if (typeof callback === 'function') callback({ success: false, message: errMsg });
          else socket.emit("room_join_error", errMsg);
        }
      } catch (err) {
        console.error("Error joining custom room:", err);
        const errMsg = "Failed to join the room due to a server error.";
        if (typeof callback === 'function') callback({ success: false, message: errMsg });
        else socket.emit("room_join_error", errMsg);
      }
    });
  }

  async handlePlayOnline(socket) {
    socket.on("play_online", async (data, callback) => {
      const { playerName } = data || {};
      let room;
      try {
        room = await Room.findOne({ empty: true, isCustom: false, playerLimit: 2 });
        if (!room) {
          const roomId = await this.generateUniqueRoomId();
          room = new Room({
            roomId,
            players: [socket.id],
            isCustom: false,
            empty: true,
            playersName: [playerName],
            playerLimit: 2,
            gameMode: "2_players"
          });
          await room.save();
        } else {
          room.players.push(socket.id);
          room.playersName.push(playerName);
          room.empty = false;
          await room.save();

          // Clear any matchmaking timer for this room since a real opponent joined!
          if (this.matchmakingTimers.has(room.roomId)) {
            clearTimeout(this.matchmakingTimers.get(room.roomId));
            this.matchmakingTimers.delete(room.roomId);
            console.log(`Cancelled matchmaking bot timer for room ${room.roomId} — real player joined.`);
          }
        }

        socket.join(room.roomId);
        if (room.players.length === 2) {
          await this.startGameForRoom(room.roomId, room.players, room.playersName, room.gameMode);
          if (typeof callback === 'function') {
            callback({ roomId: room.roomId });
          }
        } else {
          // If this is a new room with 1 player, set a matchmaking timer to auto-pair with a bot after 12 seconds
          const timeoutMs = 12000;
          const roomIdStr = room.roomId;
          const timer = setTimeout(async () => {
            this.matchmakingTimers.delete(roomIdStr);
            try {
              const freshRoom = await Room.findOne({ roomId: roomIdStr });
              if (freshRoom && freshRoom.players.length === 1 && freshRoom.empty) {
                console.log(`Matchmaking timeout expired for room ${roomIdStr}. Pairing with a virtual bot.`);
                const botSocketId = `bot_${roomIdStr}_0`;
                const botName = this.getRandomBotName();

                freshRoom.players.push(botSocketId);
                freshRoom.playersName.push(botName);
                freshRoom.empty = false;
                await freshRoom.save();

                await this.startGameForRoom(roomIdStr, freshRoom.players, freshRoom.playersName, freshRoom.gameMode);
                
                this.io.to(roomIdStr).emit("room_update", {
                  players: freshRoom.playersName,
                  playerLimit: freshRoom.playerLimit,
                  gameMode: freshRoom.gameMode,
                  voiceChatEnabled: freshRoom.voiceChatEnabled
                });
              }
            } catch (timerErr) {
              console.error(`Error in matchmaking bot trigger for room ${roomIdStr}:`, timerErr);
            }
          }, timeoutMs);

          this.matchmakingTimers.set(roomIdStr, timer);

          if (typeof callback === 'function') {
            callback({ waiting: true, waitingroom: room.roomId });
          }
        }
      } catch (err) {
        console.error("Error handling play online:", err);
        socket.emit("play_online_error", "Failed to find or create a room.");
      }
    });
  }

  async handleDisconnection(socket) {
    socket.on("gameOverclicked", async (roomId) => {
      try {
        await Room.deleteOne({ roomId: roomId });
        this.io.to(roomId).emit("room_closed", roomId);
      } catch (err) {
        console.error("Error removing room:", err);
      }
    });
  }

  async handleStartCustomGame(socket) {
    socket.on("start_custom_game", async (data, callback) => {
      const { roomId } = data || {};
      try {
        const room = await Room.findOne({ roomId: roomId });
        if (!room) {
          if (typeof callback === 'function') callback({ success: false, message: "Room not found." });
          return;
        }
        if (room.players[0] !== socket.id) {
          if (typeof callback === 'function') callback({ success: false, message: "Only the host can start the game." });
          return;
        }
        if (room.players.length < 2) {
          if (typeof callback === 'function') callback({ success: false, message: "At least 2 players are required to start the game." });
          return;
        }

        let actualLimit = room.players.length;
        let finalMode = room.gameMode;
        
        if (actualLimit === 2) {
          finalMode = "2_players";
        } else if (actualLimit === 3) {
          finalMode = "3_players";
        } else if (actualLimit === 4) {
          finalMode = "4_players";
        } else if (actualLimit === 5) {
          finalMode = "4_players";
        } else if (actualLimit === 6) {
          if (room.gameMode !== "6_players_3_teams") {
            finalMode = "6_players_2_teams";
          }
        } else if (actualLimit === 7) {
          finalMode = "8_players";
        } else if (actualLimit === 8) {
          finalMode = "8_players";
        }
        
        // DO NOT overwrite playerLimit — preserve the original capacity so
        // friends can still join after a game resets to lobby
        room.gameMode = finalMode;
        room.empty = false;
        await room.save();

        if (typeof callback === 'function') callback({ success: true });
        
        await this.startGameForRoom(roomId, room.players, room.playersName, room.gameMode);
      } catch (err) {
        console.error("Error starting custom game early:", err);
        if (typeof callback === 'function') callback({ success: false, message: "Failed to start game." });
      }
    });
  }

  async cleanUpSocketRoom(socket, immediate = false) {
    try {
      const room = await Room.findOne({ players: socket.id });
      if (!room) return;

      const roomId = room.roomId;
      console.log(`Player disconnected from room ${roomId} (socket ${socket.id}). Grace period started.`);

      // Cancel any existing cleanup timer for this socket
      if (this.disconnectTimers.has(socket.id)) {
        clearTimeout(this.disconnectTimers.get(socket.id));
        this.disconnectTimers.delete(socket.id);
      }

      // Cancel any matchmaking timer if it exists for this room
      if (this.matchmakingTimers.has(roomId)) {
        clearTimeout(this.matchmakingTimers.get(roomId));
        this.matchmakingTimers.delete(roomId);
        console.log(`Cancelled matchmaking bot timer for room ${roomId} — player left/disconnected.`);
      }

      const GRACE_PERIOD_MS = immediate ? 0 : 90 * 1000; // 90 seconds grace period

      const doCleanup = async () => {
        this.disconnectTimers.delete(socket.id);
        try {
          // Re-fetch room in case it was updated during the grace period
          const freshRoom = await Room.findOne({ players: socket.id });
          if (!freshRoom) return; // Player already rejoined with a new socket (handled in join)

          console.log(`Grace period expired for socket ${socket.id} in room ${roomId}. Cleaning up...`);

          const playerIndex = freshRoom.players.indexOf(socket.id);
          if (playerIndex > -1) {
            freshRoom.players.splice(playerIndex, 1);
            freshRoom.playersName.splice(playerIndex, 1);
          }

          const activeGame = await Game.findOne({ roomId: freshRoom.roomId });
          if (activeGame) {
            await Game.deleteOne({ roomId: freshRoom.roomId });
            console.log(`Deleted active game for room ${freshRoom.roomId} — player did not reconnect.`);
            this.io.to(freshRoom.roomId).emit("game_reset_to_lobby");
          }

          if (freshRoom.players.length === 0) {
            await Room.deleteOne({ roomId: freshRoom.roomId });
            console.log(`Deleted empty room ${freshRoom.roomId}`);
          } else {
            freshRoom.empty = true;
            await freshRoom.save();
            this.io.to(freshRoom.roomId).emit("room_update", {
              players: freshRoom.playersName,
              playerLimit: freshRoom.playerLimit,
              gameMode: freshRoom.gameMode,
              voiceChatEnabled: freshRoom.voiceChatEnabled
            });
          }
        } catch (err) {
          console.error("Error in deferred cleanup:", err);
        }
      };

      if (GRACE_PERIOD_MS === 0) {
        await doCleanup();
      } else {
        const timer = setTimeout(doCleanup, GRACE_PERIOD_MS);
        this.disconnectTimers.set(socket.id, timer);
        console.log(`Room ${roomId} will be cleaned up in ${GRACE_PERIOD_MS / 1000}s if player doesn't reconnect.`);
      }
    } catch (err) {
      console.error("Error in cleanUpSocketRoom:", err);
    }
  }

  handleRejoinRoom(socket) {
    socket.on("rejoin_room", async ({ roomId, playerName }) => {
      try {
        const room = await Room.findOne({ roomId: roomId, playersName: playerName });
        if (!room) {
          console.log(`Rejoin failed: room ${roomId} not found for player ${playerName}`);
          return;
        }

        const playerIndex = room.playersName.indexOf(playerName);
        if (playerIndex === -1) return;

        const oldSocketId = room.players[playerIndex];
        console.log(`Player ${playerName} rejoining room ${roomId}. Old socket: ${oldSocketId}, New socket: ${socket.id}`);

        // Cancel any pending cleanup timer for the old socket ID
        if (oldSocketId && this.disconnectTimers.has(oldSocketId)) {
          clearTimeout(this.disconnectTimers.get(oldSocketId));
          this.disconnectTimers.delete(oldSocketId);
          console.log(`Cancelled cleanup timer for old socket ${oldSocketId}`);
        }

        // Update the socket ID in the Room document
        room.players[playerIndex] = socket.id;
        room.markModified('players');
        await room.save();

        // Re-join the Socket.IO room so future events reach this socket
        socket.join(roomId);

        // Check if a game is in progress
        const activeGame = await Game.findOne({ roomId: roomId });
        if (activeGame) {
          // Update socket ID in the Game document too
          const gamePIdx = activeGame.players.findIndex(p => p.index === playerIndex);
          if (gamePIdx > -1) {
            activeGame.players[gamePIdx].socketId = socket.id;
            activeGame.markModified('players');
            await activeGame.save();
          }

          const myPlayer = activeGame.players.find(p => p.index === playerIndex);
          socket.emit("rejoin_room_success", {
            gameInProgress: true,
            roomId: roomId,
            playingAs: playerIndex,
            yourHand: myPlayer ? myPlayer.hand : [],
            deckCount: activeGame.shuffledDeck.length,
            cards: activeGame.cards,
            players: activeGame.players.map(p => ({ name: p.name, team: p.team, isTurn: p.isTurn, index: p.index })),
            currentPlayerIndex: activeGame.players.findIndex(p => p.isTurn),
            protectedPatterns: activeGame.protectedPatterns || [],
            voiceChatEnabled: room.voiceChatEnabled
          });
          console.log(`Sent active game state to rejoining player ${playerName}`);
        } else {
          // Game not started yet — restore lobby
          socket.emit("rejoin_room_success", {
            gameInProgress: false,
            roomId: roomId,
            players: room.playersName,
            playerLimit: room.playerLimit,
            gameMode: room.gameMode,
            voiceChatEnabled: room.voiceChatEnabled
          });
          // Refresh lobby list for everyone
          this.io.to(roomId).emit("room_update", {
            players: room.playersName,
            playerLimit: room.playerLimit,
            gameMode: room.gameMode,
            voiceChatEnabled: room.voiceChatEnabled
          });
          console.log(`Restored lobby state for rejoining player ${playerName}`);
        }
      } catch (err) {
        console.error("Error handling rejoin_room:", err);
      }
    });
  }

  handlePlayAgain(socket) {
    socket.on("play_again", async (data) => {
      const { roomId } = data || {};
      try {
        const room = await Room.findOne({ roomId: roomId });
        if (room && room.players[0] === socket.id) {
          await this.startGameForRoom(roomId, room.players, room.playersName, room.gameMode);
          console.log(`Play again triggered for room ${roomId}`);
        }
      } catch (err) {
        console.error("Error handling play again:", err);
      }
    });
  }

  registerEvents() {
    this.io.on("connection", (socket) => {
      this.handleCreateCustomRoom(socket);
      this.handleJoinCustomRoom(socket);
      this.handlePlayOnline(socket);
      this.handleStartCustomGame(socket);
      this.handleDisconnection(socket);
      this.handlePlayAgain(socket);
      this.handleRejoinRoom(socket);

      socket.on("get_voice_token", async (data, callback) => {
        const { roomId } = data || {};
        if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
          console.warn("Agora credentials are not configured on the backend server.");
          if (typeof callback === 'function') callback({ success: false, error: "Not configured" });
          return;
        }

        try {
          const room = await Room.findOne({ roomId: roomId });
          if (!room || !room.players.includes(socket.id)) {
            if (typeof callback === 'function') callback({ success: false, error: "Access denied" });
            return;
          }

          const expirationTimeInSeconds = 3600 * 2; // 2 hours
          const currentTimestamp = Math.floor(Date.now() / 1000);
          const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

          // Generate dynamic RTC token using RtcTokenBuilder (UID 0 allows dynamic client UID allocation)
          const token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            roomId,
            0,
            RtcRole.PUBLISHER,
            privilegeExpiredTs
          );

          if (typeof callback === 'function') callback({ success: true, token });
        } catch (err) {
          console.error("Error generating voice token:", err);
          if (typeof callback === 'function') callback({ success: false, error: "Failed to generate token" });
        }
      });

      socket.on("disconnect", () => {
        // Unexpected disconnect — use grace period so player can reconnect
        this.cleanUpSocketRoom(socket, false);
      });
      socket.on("leave_room", () => {
        // Deliberate exit — clean up immediately, cancel any pending grace timer
        if (this.disconnectTimers.has(socket.id)) {
          clearTimeout(this.disconnectTimers.get(socket.id));
          this.disconnectTimers.delete(socket.id);
        }
        this.cleanUpSocketRoom(socket, true);
      });
    });
  }

  getRandomBotName() {
    const names = [
      "Alex", "Sam", "Chris", "Jordan", "Taylor", "Morgan", "Casey", "Jamie", "Robin", "Pat",
      "Oliver", "Sophia", "Jackson", "Emma", "Aiden", "Olivia", "Lucas", "Ava", "Liam", "Mia",
      "Ethan", "Isabella", "Noah", "Charlotte", "Mason", "Amelia", "Logan", "Harper", "Jacob", "Evelyn",
      "Aaron", "Grace", "Ben", "Lily", "Daniel", "Zoe", "Luke", "Chloe", "Leo", "Maya",
      "Guest_5192", "Guest_4821", "Guest_9124", "Guest_1180", "Guest_7329", "Guest_6241"
    ];
    return names[Math.floor(Math.random() * names.length)];
  }
}

module.exports = RoomController;
