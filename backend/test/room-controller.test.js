const { Server } = require('socket.io');
const Client = require('socket.io-client');
const RoomController = require('../controllers/roomController');
const Room = require('../models/room');
const Game = require('../models/Game');

jest.mock('../models/room', () => {
  let roomsDb = [];
  const MockRoom = function(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockImplementation(() => {
      const idx = roomsDb.findIndex(r => r.roomId === this.roomId);
      if (idx > -1) {
        roomsDb[idx] = this;
      } else {
        roomsDb.push(this);
      }
      return Promise.resolve(this);
    });
  };
  MockRoom.findOne = jest.fn().mockImplementation((query) => {
    if (query.players) {
      return Promise.resolve(roomsDb.find(r => r.players.includes(query.players)));
    }
    if (query.roomId) {
      return Promise.resolve(roomsDb.find(r => r.roomId === query.roomId));
    }
    if (query.empty !== undefined) {
      return Promise.resolve(roomsDb.find(r => r.empty === query.empty && !r.isCustom));
    }
    return Promise.resolve(null);
  });
  MockRoom.find = jest.fn().mockImplementation((query) => {
    let res = roomsDb;
    if (query) {
      if (query.empty !== undefined) res = res.filter(r => r.empty === query.empty);
      if (query.isCustom !== undefined) res = res.filter(r => r.isCustom === query.isCustom);
      if (query.playerLimit !== undefined) res = res.filter(r => r.playerLimit === query.playerLimit);
      if (query.stakeId !== undefined) res = res.filter(r => r.stakeId === query.stakeId);
      if (query.boardType !== undefined) res = res.filter(r => r.boardType === query.boardType);
    }
    return Promise.resolve(res);
  });
  MockRoom.deleteOne = jest.fn().mockImplementation((query) => {
    const index = roomsDb.findIndex(r => r.roomId === query.roomId);
    if (index > -1) {
      roomsDb.splice(index, 1);
    }
    return Promise.resolve({ deletedCount: 1 });
  });
  MockRoom._db = () => roomsDb;
  MockRoom._clear = () => { roomsDb.length = 0; };
  return MockRoom;
});

jest.mock('../models/Game', () => {
  let gamesDb = [];
  const MockGame = function(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockImplementation(() => {
      const idx = gamesDb.findIndex(g => g.roomId === this.roomId);
      if (idx > -1) {
        gamesDb[idx] = this;
      } else {
        gamesDb.push(this);
      }
      return Promise.resolve(this);
    });
  };
  MockGame.findOne = jest.fn().mockImplementation((query) => {
    return Promise.resolve(gamesDb.find(g => g.roomId === query.roomId));
  });
  MockGame.deleteOne = jest.fn().mockImplementation((query) => {
    const index = gamesDb.findIndex(g => g.roomId === query.roomId);
    if (index > -1) {
      gamesDb.splice(index, 1);
    }
    return Promise.resolve({ deletedCount: 1 });
  });
  MockGame.deleteMany = jest.fn().mockImplementation((query) => {
    const index = gamesDb.findIndex(g => g.roomId === query.roomId);
    if (index > -1) {
      gamesDb.splice(index, 1);
    }
    return Promise.resolve({ deletedCount: 1 });
  });
  MockGame._db = () => gamesDb;
  MockGame._clear = () => { gamesDb.length = 0; };
  return MockGame;
});

describe('RoomController', () => {
  let io, roomController, clientA, clientB;
  let mockInitializeGame, mockStartGame;

  beforeEach((done) => {
    Room._clear();
    Game._clear();
    io = new Server();
    mockInitializeGame = jest.fn();
    mockStartGame = jest.fn();
    roomController = new RoomController(io, mockInitializeGame, mockStartGame);
    
    clientA = Client('http://localhost:3000');
    clientB = Client('http://localhost:3000');
    
    io.on('connection', (socket) => {
      socket.on('disconnect', () => {
        socket.disconnect(true);
      });
    });
    io.listen(3000);
    done();
  });

  afterEach((done) => {
    io.close();
    clientA.disconnect();
    clientB.disconnect();
    done();
  });

  it('should create a custom room', (done) => {
    clientA.on('custom_room_created', (data) => {
      expect(data.roomId).toEqual(expect.any(String));
      const room = Room._db().find(r => r.roomId === data.roomId);
      expect(room).toBeDefined();
      expect(room.isCustom).toBe(true);
      done();
    });
    clientA.emit('create_custom_room', { playerName: 'Player A' });
  });

  it('should join a custom room', (done) => {
    clientA.on('custom_room_created', (data) => {
      const roomId = data.roomId;
      clientB.on('room_update', (roomData) => {
        const room = Room._db().find(r => r.roomId === roomId);
        expect(room.players).toContain(clientB.id);
        done();
      });
      clientB.emit('join_custom_room', { roomId, playerName: 'Player B' });
    });
    clientA.emit('create_custom_room', { playerName: 'Player A' });
  });

  it('should match players in random queue', (done) => {
    clientA.emit('play_online', { playerName: 'Player A' });
    clientB.emit('play_online', { playerName: 'Player B' });
    setTimeout(() => {
      const room = Room._db().find((r) =>
        r.players.includes(clientA.id) && r.players.includes(clientB.id)
      );
      expect(room).toBeDefined();
      expect(room.players).toContain(clientA.id);
      expect(room.players).toContain(clientB.id);
      expect(room.empty).toBe(false);
      done();
    }, 500);
  });

  it('should remove a room when gameOverclicked is emitted', (done) => {
    clientA.emit('create_custom_room', { playerName: 'Player A' });
    clientA.on('custom_room_created', (data) => {
      const { roomId } = data;
      clientA.emit('gameOverclicked', roomId);
      setTimeout(() => {
        const room = Room._db().find(r => r.roomId === roomId);
        expect(room).toBeUndefined();
        done();
      }, 500);
    });
  });
});