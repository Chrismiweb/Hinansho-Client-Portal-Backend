const user = require("../model/user");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate Random String
const generateRandom = () => {
    return Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
};

// Generate OTP
const generateOTP = () => {
    return crypto.randomInt(10000, 99999).toString();
};

const comparePassword = async (plain, hashed) => {
  return await bcrypt.compare(plain, hashed);
};

// In your auth controller or wherever you generate tokens
const generateToken = (user) => {
  // Make sure you're passing the user object with _id
  return jwt.sign(
    { 
      userId: user._id.toString(), // Convert ObjectId to string
      email: user.email,
      role: user.role
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
};

module.exports = {
    generateRandom,
    generateOTP,
    comparePassword,
    generateToken
};