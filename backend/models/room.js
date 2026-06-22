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
  },
  voiceChatEnabled: {
    type: Boolean,
    default: false
  },
  stakeId: {
    type: Number,
    default: null
  },
  stakeFee: {
    type: Number,
    default: 0
  },
  stakeReward: {
    type: Number,
    default: 0
  },
  boardType: {
    type: String,
    default: "STANDARD"
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
