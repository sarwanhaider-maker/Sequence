const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  socketId: String,
  name: String,
  hand: [Object],
  isTurn: { type: Boolean, default: false },
  team: String,
  index: Number
}, { _id: false });

const GameSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  players: [PlayerSchema],
  scores: {
    red: { type: Number, default: 0 },
    blue: { type: Number, default: 0 },
    green: { type: Number }
  },
  shuffledDeck: [Object],
  cards: [Object],
  protectedPatterns: [Array],
  targetSequences: { type: Number, default: 2 }
}, { timestamps: true });

module.exports = mongoose.model('Game', GameSchema);
