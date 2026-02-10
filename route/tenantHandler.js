const express = require('express');
const { upload } = require('../controller/uploadProfilePic');
const { uploadRentPayment } = require('../controller/tenantCtrl');

const tenantRouters = express.Router()

tenantRouters.post(
  '/rent/upload',
  upload.single('receipt'),
  uploadRentPayment
);

module.exports = tenantRouters;