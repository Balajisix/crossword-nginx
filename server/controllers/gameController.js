const { v4: uuidv4 } = require('uuid');
const GameSession = require('../models/gameSessionModel');
const Question = require('../models/questionModel');
const User = require('../models/userModel');

const getPuzzle = async (req, res) => {
  try {
    const questions = await Question.find({});

    if (!questions.length) {
      return res.status(200).json({
        grid: [],
        clues: { across: [], down: [] }
      });
    }

    let maxRow = 0;
    let maxCol = 0;
    questions.forEach(q => {
      if (typeof q.row !== 'number' || typeof q.col !== 'number' || !q.answer || !q.type) {
        throw new Error(`Invalid question data: ${JSON.stringify(q)}`);
      }
      const answerLength = q.answer.length;
      if (q.type === 'across') {
        maxRow = Math.max(maxRow, q.row);
        maxCol = Math.max(maxCol, q.col + answerLength - 1);
      } else if (q.type === 'down') {
        maxRow = Math.max(maxRow, q.row + answerLength - 1);
        maxCol = Math.max(maxCol, q.col);
      }
    });

    const grid = Array.from({ length: maxRow + 1 }, () =>
      Array(maxCol + 1).fill('')
    );

    questions.forEach(q => {
      const answer = q.answer.toUpperCase();
      if (q.type === 'across') {
        for (let i = 0; i < answer.length; i++) {
          grid[q.row][q.col + i] = answer[i];
        }
      } else if (q.type === 'down') {
        for (let i = 0; i < answer.length; i++) {
          grid[q.row + i][q.col] = answer[i];
        }
      }
    });

    const across = questions
      .filter(q => q.type === 'across')
      .map(q => ({
        number: q.number,
        clue: q.clue,
        answer: q.answer,
        row: q.row,
        col: q.col
      }));
    const down = questions
      .filter(q => q.type === 'down')
      .map(q => ({
        number: q.number,
        clue: q.clue,
        answer: q.answer,
        row: q.row,
        col: q.col
      }));

    const puzzle = {
      grid,
      clues: { across, down }
    };
    res.status(200).json(puzzle);
  } catch (error) {
    console.error("Error in getPuzzle:", error);
    res.status(500).json({ message: error.message });
  }
};

const startGame = async (req, res) => {
  try {
    const sessionId = uuidv4();
    const { userId } = req.body;
    console.log("Creating game session with id:", sessionId);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.isPlayed) {
      return res.status(400).json({ message: "You have already played this game." });
    }

    // Create the game session with currentPlayer set to userId
    const gameSession = await GameSession.create({ 
      sessionId, 
      currentPlayer: userId
    });
    console.log("Game session created:", gameSession);

    // Populate the currentPlayer field (to return sroNumber, for example)
    const populatedSession = await GameSession.findById(gameSession._id)
      .populate('currentPlayer', 'sroNumber');

    res.status(201).json({ message: "Game started", session: populatedSession });
  } catch (error) {
    console.error("Error in startGame:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Question.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.status(200).json({ message: "Question updated", question: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Question.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Question not found" });
    }
    res.status(200).json({ message: "Question deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const terminateGame = async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    console.log("Terminating session:", sessionId);
    const session = await GameSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.status === 'in-progress') {
      session.status = 'terminated';
      session.endTime = new Date();
      await session.save();
    }
    if (userId) {
      await User.findByIdAndUpdate(userId, { isTerminated: true });
    }
    res.status(200).json({ message: "Game terminated", session });
  } catch (error) {
    console.error("Error in terminateGame:", error);
    res.status(500).json({ message: error.message });
  }
};

const finishGame = async (req, res) => {
  try {
    const { sessionId } = req.body;
    console.log("Finishing session:", sessionId);
    const session = await GameSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.status === 'in-progress') {
      session.status = 'completed';
      session.endTime = new Date();
      await session.save();
    }
    res.status(200).json({ message: "Game finished", session });
  } catch (error) {
    console.error("Error in finishGame:", error);
    res.status(500).json({ message: error.message });
  }
};

const submitGame = async (req, res) => {
  try {
    console.log("submitGame called with body:", req.body);
    const { sessionId, userId, score } = req.body;
    
    if (!sessionId || !userId || score === undefined || score === null) {
      return res.status(400).json({ message: 'Missing sessionId, userId, or score' });
    }

    const user = await User.findById(userId);
    console.log("Found user:", user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isPlayed) {
      return res.status(400).json({ message: 'You have already submitted your game.' });
    }

    user.score = score;
    user.isPlayed = true;
    await user.save();
    console.log("Updated user score:", user.score);

    const session = await GameSession.findOne({ sessionId });
    console.log("Found session:", session);
    if (session) {
      session.status = 'completed';
      session.finalScore = score;
      session.endTime = new Date();
      await session.save();
    }

    return res.status(200).json({ message: 'Score submitted successfully', updatedScore: user.score });
  } catch (error) {
    console.error('Error in submitGame:', error);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getPuzzle, 
  startGame, 
  updateQuestion, 
  deleteQuestion, 
  terminateGame, 
  finishGame, 
  submitGame 
};
