const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  players: [{
    type: String
  }],
  isCustom: {
    type: Boolean,
    default: false
  },
  empty: {
    type: Boolean,
    default: true
  },
  playersName: [{
    type: String
  }],
  playerLimit: {
    type: Number,
    default: 8
  },
  gameMode: {
    type: String,
    default: "8_players"
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
