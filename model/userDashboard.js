const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const userDashboardSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    referralProgress: {
        current: { type: Number, default: 0 },
        goal: { type: Number, default: 250 },
        multiplier: { type: String, default: 'x1.5' }
    },
    tokenSale: {
        status: { type: String, enum: ['locked', 'available'], default: 'locked' },
        description: String
    },
    airdropStatus: {
        description: String,
        buttonText: { type: String, default: 'Go Stake' }
    },
    missionStats: {
        completed: { type: Number, default: 0 },
        total: { type: Number, default: 500 },
        totalPointsEarned: { type: Number, default: 0 }
    },
    completedMissions: [{
        key: String,
        completedAt: Date,
        count: { type: Number, default: 1 } // for repeatable
      }],
    transactionHistory: [
        {
            wallet: String,
            amount: Number,
            date: Date,
            status: { type: String, enum: ['Pending', 'Unsuccessful', 'Successful'] }
        }
    ],
    betHistory: [
        {
            gameName: String,
            bet: Number,
            multiplier: String,
            profit: Number
        }
    ],
}, { timestamps: true });

const userDashboardModel = model('UserDashboard', userDashboardSchema);

module.exports = userDashboardModel;
