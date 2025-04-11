const Question = require('../models/questionModel');
const GameSession = require('../models/gameSessionModel');
const User = require('../models/userModel');
const PDFDocument = require('pdfkit');

// Create a new question
const createQuestion = async (req, res) => {
  try {
    const { type, number, clue, answer, row, col } = req.body;

    if (!type || !number || !clue || !answer || row === undefined || col === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newQuestion = await Question.create({
      type,
      number,
      clue,
      answer,
      row,
      col
    });

    res.status(201).json({ message: "Question created", question: newQuestion });
  } catch (error) {
    console.error("Error in createQuestion:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all questions
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({});
    res.status(200).json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all game sessions (with currentPlayer's sroNumber)
const getGameSessions = async (req, res) => {
  try {
    const sessions = await GameSession.find({}).populate('currentPlayer', 'sroNumber');
    const activeSessions = await GameSession.find({ status: "in-progress" });
    res.status(200).json({ sessions, activeSessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users along with their score and details
const getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Aggregation pipeline for report generation
const getPlayedUsersReportData = async () => {
  const reportData = await User.aggregate([
    { $match: { isPlayed: true } },
    // Lookup game sessions related to the use
    {
      $lookup: {
        from: "gamesessions", 
        localField: "_id",
        foreignField: "currentPlayer",
        as: "gameSessions"
      }
    },
    // Calculate total time taken
    {
      $addFields: {
        totalTimeTaken: {
          $sum: {
            $map: {
              input: "$gameSessions",
              as: "session",
              in: { $subtract: ["$$session.endTime", "$$session.startTime"] }
            }
          }
        }
      }
    },
    // Convert milliseconds to seconds and round off
    {
      $addFields: {
        timeTaken: { $round: [{ $divide: ["$totalTimeTaken", 1000] }, 0] }
      }
    },
    { $sort: { score: -1 } },
    { $project: { name: 1, sroNumber: 1, phoneNumber: 1, score: 1, timeTaken: 1 } },
    // Group data to get total played count and users array
    { 
      $group: {
        _id: null,
        totalPlayed: { $sum: 1 },
        users: { 
          $push: { 
            name: "$name", 
            sroNumber: "$sroNumber",
            phoneNumber: "$phoneNumber", 
            score: "$score",
            timeTaken: "$timeTaken"
          } 
        }
      }
    },
    { $project: { _id: 0, totalPlayed: 1, users: 1 } }
  ]);
  return reportData[0] || { totalPlayed: 0, users: [] };
};

// Generate a PDF report for played users using PDFKit
const generateReportPDF = async (req, res) => {
  try {
    const reportData = await getPlayedUsersReportData();

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=crossword-report-2025.pdf');
    doc.pipe(res);

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#333333')
      .text('Crossword Game Report', { align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(12)
      .fillColor('#555555')
      .text('SICASA Presents', { align: 'center' });

    doc.moveDown();

    // Horizontal line
    doc
      .strokeColor('#AAAAAA')
      .lineWidth(1)
      .moveTo(doc.x, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();

    doc.moveDown(1);

    // Summary
    doc
      .fontSize(14)
      .fillColor('#333333')
      .text(`Total Users Played: ${reportData.totalPlayed}`, { align: 'center' })
      .moveDown(2);

    const rowHeight = 25;
    const columns = [
      { label: 'Name',            property: 'name',        width: 130, align: 'left'   },
      { label: 'SRO Number',      property: 'sroNumber',   width: 100, align: 'left'   },
      { label: 'Phone Number',    property: 'phoneNumber', width: 110, align: 'left'   },
      { label: 'Score',           property: 'score',       width: 60,  align: 'center' },
      { label: 'Time (s)',        property: 'timeTaken',   width: 60,  align: 'center' },
    ];

    // Calculate total table width
    const tableWidth = columns.reduce((acc, col) => acc + col.width, 0);

    // Calculate offset to center the table within page margins
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const offset = (pageWidth - tableWidth) / 2;

    // Starting X position for the table
    const tableLeft = doc.page.margins.left + Math.max(offset, 0);
    let yPos = doc.y;

    // Compute each column's X position
    let currentX = tableLeft;
    columns.forEach(col => {
      col.x = currentX;
      currentX += col.width;
    });

    doc
      .rect(tableLeft, yPos, tableWidth, rowHeight)
      .fill('#F2F2F2')
      .fillColor('#000000');

    doc.font('Helvetica-Bold').fontSize(11);

    columns.forEach(col => {
      doc.text(col.label, col.x + 5, yPos + 7, {
        width: col.width - 10,
        align: col.align,
        ellipsis: true
      });
    });

    // Header border
    doc
      .strokeColor('#666666')
      .lineWidth(1)
      .rect(tableLeft, yPos, tableWidth, rowHeight)
      .stroke();

    yPos += rowHeight;

    doc.font('Helvetica').fontSize(10);

    reportData.users.forEach((user, index) => {
      const fillColor = index % 2 === 0 ? '#FFFFFF' : '#FAFAFA';
      doc
        .rect(tableLeft, yPos, tableWidth, rowHeight)
        .fill(fillColor)
        .fillColor('#000000');

      // Row text
      columns.forEach(col => {
        const value = user[col.property] !== undefined ? user[col.property].toString() : '';
        doc.text(value, col.x + 5, yPos + 7, {
          width: col.width - 10,
          align: col.align,
          ellipsis: true
        });
      });

      // Row border
      doc
        .strokeColor('#666666')
        .lineWidth(1)
        .rect(tableLeft, yPos, tableWidth, rowHeight)
        .stroke();

      yPos += rowHeight;
    });

    doc.end();

  } catch (error) {
    console.error('Error generating report PDF:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  createQuestion, 
  getQuestions, 
  getGameSessions,
  getUsers,
  generateReportPDF,
};
