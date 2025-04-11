const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { 
    type: String, 
    enum: ['in-progress', 'completed', 'terminated'], 
    default: 'in-progress' 
  },
  currentPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPlayed: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('GameSession', gameSessionSchema);
