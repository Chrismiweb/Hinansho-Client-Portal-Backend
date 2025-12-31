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

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

module.exports = {
    generateRandom,
    generateOTP,
    comparePassword,
    generateToken
};