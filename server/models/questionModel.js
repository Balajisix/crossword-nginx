const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ['across', 'down'], required: true },
  number: { type: Number, required: true },
  clue: { type: String, required: true },
  answer: { type: String, required: true },
  row: { type: Number, required: true },
  col: { type: Number, required: true },
});

module.exports = mongoose.model('Question', questionSchema);
