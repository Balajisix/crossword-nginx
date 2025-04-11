const express = require('express');
const cors = require("cors");
require('./config/db');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const adminRoutes = require('./routes/adminRoutes');
const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config();

const app = express();
// app.use(cors());

mongoose
  .connect("mongodb+srv://brainbric:balaji@cluster0.7x8pu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log(error));

app.use(
  cors({
    // origin: "https://crossword-game-sicasa.vercel.app",
    // origin: "http://localhost:5000",
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
  })
);

app.use(express.json());
const _dirname = path.dirname("");
const buildpath = path.join(_dirname, "../client/dist");
app.use(express.static(buildpath));

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
});

module.exports = app;
