const express = require('express');
const router = express.Router();
const { 
  getPuzzle, 
  startGame, 
  terminateGame, 
  finishGame, 
  submitGame,
  deleteQuestion,
  updateQuestion,
 } = require('../controllers/gameController');

router.get('/puzzle', getPuzzle);
router.post('/start', startGame);
router.post('/terminate', terminateGame);
router.post('/finish', finishGame);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.post('/submit', submitGame);

module.exports = router;
