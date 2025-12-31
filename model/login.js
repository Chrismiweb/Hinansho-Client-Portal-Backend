const mongoose = require('mongoose');

const LoginLogSchema = new mongoose.Schema({
    userId: { type: String, required: true }, 
    lastLoginDate: { type: Date, default: null },
  });
  const LoginLog = mongoose.model("LoginLog", LoginLogSchema);
  module.exports = LoginLog;
  