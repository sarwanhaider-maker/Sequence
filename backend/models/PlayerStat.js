const mongoose = require('mongoose');

const PlayerStatSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD' format
  firstSeenAt: { type: Date, default: Date.now }
}, { timestamps: true });

// One record per player per day — prevents duplicates
PlayerStatSchema.index({ playerName: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PlayerStat', PlayerStatSchema);
