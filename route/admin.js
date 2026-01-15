const express = require('express');
const {suspendUser,unsuspendUser,deleteUser,sendNotification, getAdminProfile, createProperty, fetchProperties, getAllInvestors, getAllTenants, updateProperty} = require('../controller/adminCtrl');
const { upload } = require('../controller/uploadProfilePic');
const { getAdminDashboardData } = require('../utilis/dashboardAdmin');
const allowRoles = require('../middleware/checkRole');
const { createUnit, getUnitsByProperty, getAvailableUnits, assignUnitToInvestor, assignTenantsToUnit, deleteUnit, updateUnit } = require('../controller/adminUnitCtrl');

const routers = express.Router();

// ✅ Use checkRole instead of isAdmin 
// routers.get('/get-all-users', checkRole('Master', 'Admin'), checkPermission('user_list'), fetchUsers);
// routers.get('/admin-profile', checkRole('Admin', 'Master'), getAdminProfile); // NEW
// routers.get('/get-dashboard', checkRole('Admin', 'Master'), getAdminDashboardData); // NEW
// routers.patch('/suspend-user/:userId', checkRole('Admin', 'Master'), checkPermission('account_management'), suspendUser);
// routers.patch('/unsuspend-user/:userId', checkRole('Admin', 'Master'), checkPermission('account_management'), unsuspendUser);
// routers.delete('/delete-user/:userId', checkRole('Admin', 'Master'), checkPermission('account_management'), deleteUser);
// routers.post('/send-notification', checkRole('Admin', 'Master'), checkPermission('notifications'), sendNotification);
routers.get('/getInvestors', getAllInvestors);
routers.get('/getTenants', getAllTenants);
routers.post('/add-properties', allowRoles('Admin'), upload.single('image'), createProperty);
routers.get('/fetch-properties', allowRoles('Admin'), fetchProperties);
routers.post('/create-unit', allowRoles('Admin'), createUnit);
routers.get('/units/property/:propertyId', allowRoles('Admin'), getUnitsByProperty);
routers.get('/units/available', allowRoles('Admin'), getAvailableUnits);
routers.post('/assign-unit', allowRoles('Admin'), assignUnitToInvestor);
routers.post('/assign-tenants', allowRoles('Admin'), assignTenantsToUnit);
routers.put('/update-unit/:unitId', allowRoles('Admin'), updateUnit);
routers.put('/update-property/:propertyId', allowRoles('Admin'), upload.single('image'), updateProperty);
routers.delete('/delete-unit/:unitId', allowRoles('Admin'), deleteUnit);

module.exports = routers;
