const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '2h' });
};

const registerUser = async (req, res) => {
  const { name, sroNumber, password, email, phoneNumber } = req.body;
  
  // SRO must be alphanumeric between 6 and 12 characters.
  const sroRegex = /^[a-zA-Z0-9]{6,12}$/;
  if (!sroRegex.test(sroNumber)) {
    return res.status(400).json({ message: 'Invalid SRO number format' });
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }
  
  // Validate phone number: exactly 10 digits.
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
  }
  
  try {
    const userExists = await User.findOne({ sroNumber });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ 
      name, 
      sroNumber, 
      passwordHash, 
      email, 
      phoneNumber, 
      isTerminated: false 
    });
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      sroNumber: user.sroNumber,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin || false,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { sroNumber, password } = req.body;

  console.log("Login attempt: ", { sroNumber, password });
  console.log("Admin env: ", { ADMIN_SRO: process.env.ADMIN_SRO, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD });
  
  if (sroNumber === process.env.ADMIN_SRO && password === process.env.ADMIN_PASSWORD) {
    console.log("Admin credentials matched.");
    return res.json({
      _id: 'admin',
      name: 'Super Admin',
      sroNumber: process.env.ADMIN_SRO,
      isAdmin: true,
      token: generateToken('admin'),
    });
  }
  
  try {
    const user = await User.findOne({ sroNumber });
    // Check if the user has been terminated
    if (user && user.isTerminated) {
      return res.status(403).json({ message: 'Your account has been terminated due to rule violations.' });
    }
    
    if (user && await bcrypt.compare(password, user.passwordHash)) {
      return res.json({
        _id: user._id,
        name: user.name,
        sroNumber: user.sroNumber,
        isAdmin: user.isAdmin || false,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { loginUser, registerUser };