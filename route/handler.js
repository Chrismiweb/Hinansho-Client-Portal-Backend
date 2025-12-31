const express = require('express');
const {getUserInfo, getUserNotifications, markAsRead, Enable2FA, Verify2FA, Disable2FA } = require('../controller/updateProfile');
const { uploadProfilePicture, upload, getProfileMedia , updateProfile} = require('../controller/uploadProfilePic');
const { authenticateUser } = require('../middleware/auth');
const { getDashboardData } = require('../utilis/dashboardData');
const router = express.Router();

router.use(authenticateUser);
router.get('/dashboard', getDashboardData);
router.get('/profile-info', getUserInfo);
router.patch('/update-profile',upload.single('file'), updateProfile);
router.get('/profile-picture', getProfileMedia);
router.post('/enable2fa', Enable2FA);
router.post('/verify2fa', Verify2FA);
router.post('/disable2fa', Disable2FA);
router.get('/get-notification', getUserNotifications);
router.patch('/notification/:id/read', markAsRead); // Mark notification as read (not implemented in controller yet)

module.exports = router;