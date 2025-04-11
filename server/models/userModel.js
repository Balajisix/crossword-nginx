const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sroNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isTerminated: { type: Boolean, default: false },
  isPlayed: { type: Boolean, default: false },
  score: { type: Number, default: 0 } 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
