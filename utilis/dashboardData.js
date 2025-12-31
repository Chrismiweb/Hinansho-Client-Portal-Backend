const transactionModel = require('../model/transaction');
const userModel = require('../model/user');
const userDashboardModel = require('../model/userDashboard');
const mongoose = require('mongoose');
// const Presale = require('../model/tokensale');

const getDashboardData = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated", success: false });
  }

  try {
    // Fetch user basic info
    const user = await userModel.findById(userId).select(
      'user_name referral_code kookiePoints leaderboardRank profile_picture profile_banner country'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found', success: false });
    }

    // Fetch user dashboard (optional fields)
    const userDashboard = await userDashboardModel.findOne({ userId });

    // Count users who used this user's referral
    const referralCount = await userModel.countDocuments({ referred_by: userId });


    // Dynamically set referral progress and bonus multiplier
    const referralProgress = {
      current: referralCount,
      goal: 250,
      multiplier: referralCount >= 1000 ? 'x10' :
        referralCount >= 750 ? 'x7.5' :
          referralCount >= 500 ? 'x5' :
            referralCount >= 250 ? 'x2.5' :
              referralCount >= 100 ? 'x1.5' : 'x1'
    };

    console.log("Referral Count:", referralCount);

    // Fetch latest 5 "kookie points" transactions
    const kookieTransactions = await transactionModel.find({
      transaction_type: 'kookie points',
      description: { $ne: 'bet' },
      userId: userId
    })
      .sort({ timestamp: -1 })
      .limit(5);

    // Fetch latest 5 "bet" transactions
    const betTransactions = await transactionModel.find({
      // transaction_type: 'kookie points',
      description: 'bet',
      userId: userId
    })
      .sort({ timestamp: -1 })
      .limit(5);

    // Fetch token sale and build enhanced tokenSaleData
    let tokenSaleData = null;
    const tokenSale = await Presale.findOne({ isActive: true });

    if (tokenSale) {
      const currentDate = new Date();
      let status = 'locked';
      let description = 'Token sale is not yet started.';

      if (currentDate >= tokenSale.startDate && currentDate <= tokenSale.endDate) {
        status = 'active';
        description = 'Token sale is currently active.';
      } else if (currentDate > tokenSale.endDate) {
        status = 'ended';
        description = 'Token sale has ended.';
      }

      const tokensSold = tokenSale.tokensSold || 0;
      const totalTokens = tokenSale.totalTokens || 1;
      const progress = Math.min((tokensSold / totalTokens) * 100, 100).toFixed(2);

      tokenSaleData = {
        status,
        description,
        progress: parseFloat(progress),
        price: tokenSale.price,
        round: tokenSale.roundNumber || 'N/A',
        tokenPriceUSD: tokenSale.tokenPriceUSD,
        tokenPriceETH: tokenSale.tokenPriceETH,
      };
    }

    // Fetch mission stats (optional fields)
    const missionStats = userDashboard?.missionStats || { completed: 0, total: 500, totalPointsEarned: 0 };


    // Send dashboard data
    res.status(200).json({
      success: true,
      data: {
        user_name: user.user_name,
        referralCount: referralCount,
        kookiePoints: user.kookiePoints,
        referralCode: user.referral_code,
        leaderboardRank: user.leaderboardRank,
        profile_picture: user.profile_picture,
        profile_banner: user.profile_banner,
        country: user.country,
        referralProgress,
        tokenSale:tokenSaleData,
        airdropStatus: userDashboard?.airdropStatus || { description: '', buttonText: 'Go Stake' },
        missions: missionStats,
        transactionHistory: kookieTransactions || [],
        betHistory: betTransactions || []
      }
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ message: error.message, success: false });
  }
};

module.exports = { getDashboardData };
