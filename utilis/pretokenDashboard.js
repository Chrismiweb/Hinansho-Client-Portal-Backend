const { getRankProgress, getNextRank } = require('../controller/pretokenController');
const User = require('../model/user');
const Transaction = require('../model/transaction');

// Function to get dashboard data
const getDashboardData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id); // assuming you use auth middleware

        if (!user) return res.status(404).json({ message: 'User not found' });

        const rankProgress = getRankProgress(user.totalDeposit || 0, user.presaleRank);
        const nextRank = getNextRank(user.presaleRank);

        const tokenTransaction  = await Transaction.findOne({
            userId: user._id,
            transaction_type: 'token',
        });

        return res.json({
            kookiePoints: user.kookiePoints || 0,
            totalDeposit: user.totalDeposit || 0,
            currentRank: user.presaleRank,
            nextRank,
            rankProgress,
            tokenTransaction,
            referralCount: user.referralCount || 0,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getDashboardData,
};