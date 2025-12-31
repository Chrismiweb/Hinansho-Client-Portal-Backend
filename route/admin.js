const express = require('express');
const checkRole = require('../middleware/checkRole'); // NEW
const {suspendUser,unsuspendUser,deleteUser,fetchUsers,sendNotification, getAdminProfile, fetchReferrals} = require('../controller/adminCtrl');
const { upload } = require('../controller/uploadProfilePic');
const { checkPermission } = require('../middleware/checkPermission');
const { getAdminDashboardData } = require('../utilis/dashboardAdmin');

const routers = express.Router();

// ✅ Use checkRole instead of isAdmin
routers.get('/get-referrals', checkRole('Admin', 'Master'), fetchReferrals);  
routers.get('/get-all-users', checkRole('Master', 'Admin'), checkPermission('user_list'), fetchUsers);
routers.get('/admin-profile', checkRole('Admin', 'Master'), getAdminProfile); // NEW
routers.get('/get-dashboard', checkRole('Admin', 'Master'), getAdminDashboardData); // NEW
routers.patch('/suspend-user/:userId', checkRole('Admin', 'Master'), checkPermission('account_management'), suspendUser);
routers.patch('/unsuspend-user/:userId', checkRole('Admin', 'Master'), checkPermission('account_management'), unsuspendUser);
routers.delete('/delete-user/:userId', checkRole('Admin', 'Master'), checkPermission('account_management'), deleteUser);
routers.post('/send-notification', checkRole('Admin', 'Master'), checkPermission('notifications'), sendNotification);


module.exports = routers;
