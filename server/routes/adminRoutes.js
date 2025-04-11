const express = require('express');
const router = express.Router();
const { 
  createQuestion, 
  getQuestions, 
  getGameSessions,
  getUsers,
  generateReportPDF
} = require('../controllers/adminController');

router.get('/users', getUsers);
router.post('/questions', createQuestion);
router.get('/questions', getQuestions);
router.get('/sessions', getGameSessions);
router.get('/report', generateReportPDF);

module.exports = router;
