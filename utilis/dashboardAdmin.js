const mongoose = require('mongoose');
const User = require('../model/user');
const Transaction = require('../model/transaction');
const UserDashboard = require('../model/userDashboard');

const getAdminDashboardData = async (req, res) => {
    const userId = req.user?._id || req.user?.userId;


    if (!userId) {
        return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    try {
        // 1. Fetch User Basic Info
        const user = await User.findById(userId).select(
            'user_name referral_code profile_picture profile_banner country user_type'
        );
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 2. Fetch Optional Dashboard Stats
        const dashboard = await UserDashboard.findOne({ userId });

        // 3. Referral Count
        const referralCount = await User.countDocuments({ referred_by: userId });

        // // 4. Fetch All Mission Activities for This User
        // const allMissions = await Mission.find({ userId }).sort({ date: -1 });

        // // 5. Transactions
        // const kookieTransactions = await Transaction.find({ userId, type: 'Kookie' }).sort({ timestamp: -1 });
        // const betTransactions = await Transaction.find({ userId, type: 'Bet' }).sort({ timestamp: -1 });

        // 4. Fetch All Mission Activities for All Users (optional if needed for Admins)
        // let allMissions = [];
        // if (user.user_type === 'Admin' || user.user_type === 'Master') {
        //     allMissions = await Mission.find({}).sort({ date: -1 });
        // } else {
        //     allMissions = await Mission.find({ userId }).sort({ date: -1 });
        // }

        // 5. Transactions (All users if Admin, own only if regular user)
        let kookieTransactions = [];
        let betTransactions = [];

        if (user.user_type === 'Admin' || user.user_type === 'Master') {
            kookieTransactions = await Transaction.find({ transaction_type: 'kookie points', description: { $ne: 'bet' }, }).sort({ timestamp: -1 });
            betTransactions = await Transaction.find({ description: 'bet' }).sort({ timestamp: -1 });
        } else {
            kookieTransactions = await Transaction.find({ userId, transaction_type: 'kookie points', description: { $ne: 'bet' }, }).sort({ timestamp: -1 });
            betTransactions = await Transaction.find({ userId, description: 'bet' }).sort({ timestamp: -1 });
        }

        // 6. Final Response
        res.status(200).json({
            success: true,
            data: {
                user_name: user.user_name,
                referralCode: user.referral_code,
                referralCount,
                user_type: user.user_type,
                country: user.country,
                profile_picture: user.profile_picture,
                profile_banner: user.profile_banner,
                // missionStats: allMissions, 
                transactionHistory: kookieTransactions,
                betHistory: betTransactions
            }
        });

    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = { getAdminDashboardData };
