// models/User.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const { isEmail } = require('validator');

const userSchema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [isEmail, 'Invalid email address']
    },
    password: {
      type: String,
      required: function() { return !this.googleId; },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    googleId: { type: String, unique: true, sparse: true },
    profile_picture: String,
    phone_number: String,
    role: {
      type: String,
      enum: ["Admin", "Investor", "Tenant"],
      required: true,
    },
    permissions: { type: [String], default: [] },
    twoFactorSecret: { type: String },
    is2FAEnabled: { type: Boolean, default: false },
    resetToken: String,
    resetExpires: Date,
    otpLastRequested: Date,
    isVerified: { type: Boolean, default: false },
    lastLogin: Date
  },
  { timestamps: true }
);


// Hide sensitive fields
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.otp;
    delete ret.otpExpiration;
    return ret;
  }
});

module.exports = model('User', userSchema);