const User = require('../model/user');
const Transaction = require('../model/transaction');
const Notification = require('../model/notification');
const csv = require('csv-parser');
const fs = require('fs');
const { Parser } = require('json2csv');

// Suspend a user account
const suspendUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure the userId is a valid MongoDB ObjectId
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Update user suspension status
        const user = await User.findByIdAndUpdate(
            userId,
            { isSuspended: true },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User suspended successfully', user });
    } catch (error) {
        console.error("Error suspending user:", error);
        res.status(500).json({ message: 'Server error', error: error.message || error });
    }
};

// Unsuspend a user account
const unsuspendUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId as a valid MongoDB ObjectId
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Update user's suspension status
        const user = await User.findByIdAndUpdate(
            userId,
            { isSuspended: false },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User unsuspended successfully', user });
    } catch (error) {
        console.error("Error unsuspending user:", error);
        res.status(500).json({ message: 'Server error', error: error.message || error });
    }
};

// Delete a user account
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate if ID is a valid MongoDB ObjectId
        if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Find and delete user
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: 'Server error', error: error.message || error });
    }
};

// Fetch all users with their details
const fetchUsers = async (req, res) => {
    try {
        const users = await User.find({user_type: 'User'})
            .select('user_name email wallet_address kookiePoints referralCount referral_code referred_by');

        const usersWithDetails = await Promise.all(users.map(async (user) => {
            // Fetch transactions for user
            const transactions = await Transaction.find({ userId: user._id }).sort({ timestamp: -1 });

            // Fetch user who referred this user
            const referredBy = user.referred_by
                ? await User.findById(user.referred_by).select('user_name email referral_code')
                : null;

            // Fetch users this user referred
            const referredUsers = await User.find({ referred_by: user._id }).select('user_name email');

            return {
                ...user.toObject(),
                referredBy,      // who referred this user
                referredUsers,   // who this user referred
                transactions     // user's transaction history
            };
        }));

        res.status(200).json({
            message: "Users with referrals and transactions fetched successfully",
            users: usersWithDetails,
            success: true
        });

    } catch (error) {
        console.error("Admin fetch users error:", error);
        res.status(500).json({ message: 'Server error', error, success: false });
    }
};

const sendNotification = async (req, res) => {
    try {
        const { title, message, recipients } = req.body;

        let users = [];

        if (recipients === 'all') {
            users = await User.find({});
        } else if (Array.isArray(recipients)) {
            users = await User.find({ _id: { $in: recipients } });
        } else {
            return res.status(400).json({ message: 'Invalid recipients format' });
        }

        const notifications = users.map(user => ({
            userId: user._id,
            title,
            message
        }));

        await Notification.insertMany(notifications);

        res.json({ message: 'Notifications sent and stored successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const getAdminProfile = async (req, res) => {
  try {
      const userId = req.user.userId || req.user._id;
      const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.user_type !== 'Admin' && user.user_type !== 'Master') {
      return res.status(403).json({
        message: 'Access denied',
        reason: `user_type is ${user.user_type}`,
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        user_type: user.user_type,
        permissions: user.user_type === 'Admin' ? user.permissions : 'all',
      },
    });

  } catch (error) {
    console.error("Error in getAdminProfile:", error);
    res.status(500).json({ message: error.message });
  }
};

const fetchReferrals = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('user_type');

        if (!user || !['Admin', 'Master'].includes(user.user_type)) {
            return res.status(403).json({ message: 'Access denied. Admins only.', success: false });
        }

        const referrals = await User.find({ referred_by: user._id }).select('user_name email referral_code createdAt');

        return res.status(200).json({
            success: true,
            message: referrals.length ? 'Referrals fetched successfully' : 'No referrals found',
            referrals,
        });
    } catch (error) {
        console.error("Error fetching referrals:", error);
        return res.status(500).json({ message: 'Server error', error: error.message, success: false });
    }
};

const uploadCsv = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const results = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            // Validate wallet address format
            const walletRegex = /^0x[a-fA-F0-9]{40}$/;
            if (!walletRegex.test(data.walletAddress)) {
                return res.status(400).json({ message: `Invalid wallet address format in row: ${JSON.stringify(data)}` });
            }
            results.push(data);
        })
        .on('end', async () => {
            try {
                // Insert all valid entries into the whitelist
                const whitelistEntries = results.map(entry => ({
                    walletAddress: entry.walletAddress,
                    addedByUser: req.user._id // Assuming req.user._id contains the ID of the admin uploading the CSV
                }));

                await Whitelist.insertMany(whitelistEntries);
                res.status(201).json({ message: "Whitelist entries added successfully", entries: whitelistEntries });
            } catch (err) {
                res.status(500).json({ message: "Error saving to database", error: err.message });
            }
        })
        .on('error', (err) => {
            res.status(500).json({ message: "Error reading CSV file", error: err.message });
        });
};

const downloadTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({}).sort({ timestamp: -1 });

        if (transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found' });
        }

        // Convert transactions to CSV format
        const fields = ['userId', 'itemId', 'amount', 'timestamp', 'status' , 'transactionId', 'date'];
        const opts = { fields };
        const parser = new Parser(opts);
        const csvData = parser.parse(transactions);

        // Set headers for file download
        res.setHeader('Content-disposition', 'attachment; filename=transactions.csv');
        res.setHeader('Content-Type', 'text/csv');

        // Send CSV data
        res.status(200).send(csvData);
    } catch (error) {
        console.error("Error downloading transactions:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
  
module.exports = {
    suspendUser,
    unsuspendUser,
    deleteUser,
    fetchUsers,
    sendNotification,
    getAdminProfile,
    fetchReferrals,
    uploadCsv,
    downloadTransactions

};
