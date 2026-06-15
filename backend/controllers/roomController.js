const { Server } = require("socket.io");
const Room = require('../models/room');

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
      roomId = Math.random().toString(36).substring(2, 9);
      const existingRoom = await Room.findOne({ roomId: roomId });
      isUnique = !existingRoom;
    }
  
    return roomId;
  }

  async handleCreateCustomRoom(socket) {
    socket.on("create_custom_room", async (data, callback) => {
      const { playerName, playerLimit, gameMode } = data;
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
      const { roomId, playerName } = data;
      try {
        const room = await Room.findOne({ roomId: roomId });

        if (room && room.players.length < room.playerLimit) {
          room.players.push(socket.id);
          room.playersName.push(playerName);
          if (room.players.length === room.playerLimit) {
            room.empty = false;
          }
          await room.save();

          socket.join(roomId);
          if (typeof callback === 'function') {
            callback({ success: true, playerLimit: room.playerLimit, playersCount: room.players.length });
          }

          if (room.players.length === room.playerLimit) {
            await this.startGameForRoom(roomId, room.players, room.playersName, room.gameMode);
          } else {
            this.io.to(roomId).emit("room_update", {
              players: room.playersName,
              playerLimit: room.playerLimit,
              gameMode: room.gameMode
            });
          }
        } else {
          socket.emit("room_join_error", "Room is full or does not exist.");
        }
      } catch (err) {
        console.error("Error joining custom room:", err);
        socket.emit("room_join_error", "Failed to join the room.");
      }
    });
  }

  async handlePlayOnline(socket) {
    socket.on("play_online", async (data, callback) => {
      const { playerName } = data;
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
          callback({ roomId: room.roomId });
        } else {
          callback({ waiting: true, waitingroom: room.roomId });
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
      const { roomId } = data;
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
        
        room.playerLimit = actualLimit;
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

  registerEvents() {
    this.io.on("connection", (socket) => {
      this.handleCreateCustomRoom(socket);
      this.handleJoinCustomRoom(socket);
      this.handlePlayOnline(socket);
      this.handleStartCustomGame(socket);
      this.handleDisconnection(socket);
    });
  }
}

module.exports = RoomController;
