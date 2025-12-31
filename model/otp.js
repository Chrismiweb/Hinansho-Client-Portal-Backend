const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const otpSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    otp: { type: String, required: true },
    otpType: { type: String, enum: ['register', 'login', 'forgot_password'], required: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = model('Otp', otpSchema);
