const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  creator: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true }
  },
  PGN: { type: String, required: true }, // e.g., ["e4", "e5", "Nf3", ...]
  result: { type: String, enum: ['1-0', '0-1', '1/2-1/2', 'ongoing'], default: 'ongoing' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
