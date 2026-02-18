const express = require('express');
const {suspendUser,unsuspendUser,deleteUser,sendNotification, getAdminProfile, createProperty, fetchProperties, getAllInvestors, getAllTenants, updateProperty, getInvestorDetails} = require('../controller/adminCtrl');
const { upload } = require('../controller/uploadProfilePic');
const { createUnit, getUnitsByProperty, getAvailableUnits, assignUnitToInvestor, assignTenantsToUnit, deleteUnit, updateUnit, uploadPropertyDocuments, fetchPropertyDocuments, deletePropertyDocument, getPendingPayments, approvePayment, rejectPayment } = require('../controller/adminUnitCtrl');
const { createInvestorByAdmin } = require('../controller/auth');
const uploadDocuments = require('../middleware/uploadDocs');

const routers = express.Router()



routers.get('/getInvestors', getAllInvestors);
routers.get('/investor/:investorId', getInvestorDetails);
routers.get('/getTenants', getAllTenants);
routers.get('/rent/pending', getPendingPayments);
routers.post('/createInvestor', createInvestorByAdmin);
routers.post('/add-properties', upload.single('image'), createProperty);
routers.get('/fetch-properties', fetchProperties);
routers.post('/create-unit', createUnit);
routers.get('/units/property/:propertyId', getUnitsByProperty); 
routers.get('/units/available', getAvailableUnits);
routers.post('/assign-unit', assignUnitToInvestor);
routers.post('/investors/:investorId/documents', uploadDocuments.array('documents', 10), uploadPropertyDocuments);
routers.post('/rent/approve/:paymentId', approvePayment);
routers.post('/rent/reject/:paymentId', rejectPayment);
routers.get('/investors/:investorId/documents', fetchPropertyDocuments);
routers.post('/assign-tenants', assignTenantsToUnit);
routers.put('/update-unit/:unitId', updateUnit);
routers.put('/update-property/:propertyId', upload.single('image'), updateProperty);
routers.delete('/delete-unit/:unitId', deleteUnit);
routers.delete('/investors/:investorId/documents/:documentId', deletePropertyDocument);


module.exports = routers;
