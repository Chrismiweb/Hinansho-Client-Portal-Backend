const express = require('express');
const {getUserInfo, getUserNotifications, markAsRead, Enable2FA, Verify2FA, Disable2FA } = require('../controller/updateProfile');
const { uploadProfilePicture, upload, getProfileMedia , updateProfile} = require('../controller/uploadProfilePic');
const { isLoggedIn } = require('../middleware/auth');
const { getDashboardData } = require('../utilis/dashboardData');
const router = express.Router();

router.use(isLoggedIn); // Apply authentication middleware to all routes
router.get('/dashboard', getDashboardData);
router.get('/profile-info', getUserInfo);
router.patch('/update-profile', updateProfile);
router.get('/profile-picture', getProfileMedia);
router.patch('/upload-profile-picture', upload.single('profile_picture'), uploadProfilePicture);
router.post('/enable2fa', Enable2FA);
router.post('/verify2fa', Verify2FA);
router.post('/disable2fa', Disable2FA);
router.get('/get-notification', getUserNotifications);
router.patch('/notification/:id/read', markAsRead); // Mark notification as read (not implemented in controller yet)

module.exports = router;