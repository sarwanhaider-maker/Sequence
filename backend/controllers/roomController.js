const { Server } = require("socket.io");
const Room = require('../models/room');
const Game = require('../models/Game');

class RoomController {
  constructor(io, initializeGameForRoom, startGameForRoom) {
    this.io = io;
    this.initializeGameForRoom = initializeGameForRoom;
    this.startGameForRoom = startGameForRoom;
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
      const { playerName, playerLimit, gameMode } = data || {};
      const roomId = await this.generateUniqueRoomId();
      try {
        const newRoom = new Room({
          roomId,
          players: [socket.id],
          isCustom: true,
          empty: true,
          playersName: [playerName],
          playerLimit: playerLimit || 8,
          gameMode: gameMode || "8_players"
        });
        await newRoom.save();

        socket.join(roomId);
        if (typeof callback === 'function') {
          callback({ roomId });
        }
        console.log(`Room created with ID: ${roomId}, by player: ${playerName}, limit: ${newRoom.playerLimit}, mode: ${newRoom.gameMode}`);
        
        socket.emit("custom_room_created", { roomId });
        this.io.to(roomId).emit("room_update", {
          players: [playerName],
          playerLimit: newRoom.playerLimit,
          gameMode: newRoom.gameMode
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
            gameMode: room.gameMode
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
            gameMode: room.gameMode
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
        }

        socket.join(room.roomId);
        if (room.players.length === 2) {
          await this.startGameForRoom(room.roomId, room.players, room.playersName, room.gameMode);
          if (typeof callback === 'function') {
            callback({ roomId: room.roomId });
          }
        } else {
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

  async cleanUpSocketRoom(socket) {
    try {
      const room = await Room.findOne({ players: socket.id });
      if (!room) return;

      console.log(`Cleaning up room ${room.roomId} for socket ${socket.id}`);

      const playerIndex = room.players.indexOf(socket.id);
      if (playerIndex > -1) {
        room.players.splice(playerIndex, 1);
        room.playersName.splice(playerIndex, 1);
      }

      const activeGame = await Game.findOne({ roomId: room.roomId });
      if (activeGame) {
        await Game.deleteOne({ roomId: room.roomId });
        console.log(`Deleted active game for room ${room.roomId} because player disconnected/left.`);
        this.io.to(room.roomId).emit("game_reset_to_lobby");
      }

      if (room.players.length === 0) {
        await Room.deleteOne({ roomId: room.roomId });
        console.log(`Deleted empty room ${room.roomId}`);
      } else {
        room.empty = true;
        await room.save();

        this.io.to(room.roomId).emit("room_update", {
          players: room.playersName,
          playerLimit: room.playerLimit,
          gameMode: room.gameMode
        });
      }
    } catch (err) {
      console.error("Error in cleanUpSocketRoom:", err);
    }
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

      socket.on("disconnect", () => {
        this.cleanUpSocketRoom(socket);
      });
      socket.on("leave_room", () => {
        this.cleanUpSocketRoom(socket);
      });
    });
  }
}

module.exports = RoomController;
