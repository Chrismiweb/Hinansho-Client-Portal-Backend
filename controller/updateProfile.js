const Notification = require("../model/notification");
// const referralsModel = require("../model/referral");
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require("../model/user");
const mongoose = require('mongoose');


const getUserInfo = async (req, res) => {
    try {
        const userId = req.user?.userId;  // Get user ID from request params

        // Find user and exclude sensitive fields
        const user = await User.findById(userId).select("-password -otp -otpExpiration -resetToken -resetExpires");

        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        const referralRecord = await referralsModel.findOne({ userId });
        const referralCode = user.referral_code;
        res.status(200).json({
            success: true,
            message: "User profile retrieved successfully",
            user: {
                id: user._id,
                user_name: user.user_name,
                email: user.email,
                profile_picture: user.profile_picture,
                profile_banner: user.profile_banner,
                bio: user.bio,
                referralCode,
                referred_by: user.referred_by,
                referralCount: user.referralCount,
                leaderboardRank: user.leaderboardRank,
                user_type: user.user_type,
                country: user.country,
                walletAddress: user.walletAddress,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
            }
        });
    } catch (error) {
        console.error("Error fetching user info:", error);
        return res.status(500).json({ success: false, error: "Server Error" });
    }
};

// Get user notifications
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;

        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

        res.json({ success: true, data: notifications });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const updatedNotification = await Notification.findOneAndUpdate(
            { _id:id, userId },
            { status: 'read' },
            { new: true }
        );

        if (!updatedNotification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ success: true, data: updatedNotification });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

const Enable2FA = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        if (user.is2FAEnabled) {
            return res.status(400).json({ error: '2FA already enabled' });
        }

        //Generate a secret key
        const secret = speakeasy.generateSecret({ length: 32, name: `MemeX (${user.email})` });
        user.twoFactorSecret = secret.base32;
        await user.save();

        //Generate QR code
        const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);
        res.status(200).json({
            success: true,
            message: '2FA secret generated successfully, Scan with Authenticator App',
            data: {
                secret: secret.base32,
                qrCodeDataURL
            }
        });
    }
    catch (error) {
        console.error("Error enabling 2FA:", error);
        return res.status(500).json({ success: false, error: "Server Error" });
    }
};


const Verify2FA = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { token } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        if (!user.twoFactorSecret) {
            return res.status(400).json({ error: '2FA not set up' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
        });

        if (verified) {
            user.is2FAEnabled = true;
            await user.save();
            return res.status(200).json({ success: true, message: '2FA enabled successfully' });
        } else {
            return res.status(400).json({ success: false, error: 'Invalid 2FA token' });
        }
    }
    catch (error) {
        console.error("Error verifying 2FA:", error);
        return res.status(500).json({ success: false, error: "Server Error" });
    }
};

const Disable2FA = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { token } = req.body;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        if (!user.is2FAEnabled) {
            return res.status(400).json({ error: '2FA is not enabled' });
        }
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
        });
        if (verified) {
            user.is2FAEnabled = false;
            user.twoFactorSecret = null;
            await user.save();
            return res.status(200).json({ success: true, message: '2FA disabled successfully' });
        } else {
            return res.status(400).json({ success: false, error: 'Invalid 2FA token' });
        }
    }
    catch (error) {
        console.error("Error disabling 2FA:", error);
        return res.status(500).json({ success: false, error: "Server Error" });
    }
};


module.exports = {
    getUserInfo,
    getUserNotifications,
    markAsRead,
    Enable2FA,
    Verify2FA,
    Disable2FA
}