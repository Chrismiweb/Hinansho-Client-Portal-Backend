const User = require('../model/user');
const RentPaymentRequest = require('../model/rentPayment');
const Tenancy = require('../model/tenancy');

const uploadRentPayment = async (req, res) => {
  try {
    const tenantId = req.user._id;

    const { amountClaimed, rentDate } = req.body;

    if (!amountClaimed) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Receipt is required'
      });
    }


    const tenancy = await Tenancy.findOne({
      tenant: tenantId,
      status: 'active'
    });

    if (!tenancy) {
      return res.status(400).json({
        success: false,
        message: 'No active tenancy found'
      });
    }

    const payment = await RentPaymentRequest.create({
      tenant: tenantId,
      tenancy: tenancy._id,
      unit: tenancy.unit,
      property: tenancy.property,
      investor: tenancy.investor,
      amountClaimed,
      rentDate,
      receiptUrl: `/uploads/documents/${req.file.filename}`
    });

    res.status(201).json({
      success: true,
      message: 'Rent payment submitted for verification',
      payment
    });

  } catch (error) {
    console.error('Upload rent error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = { uploadRentPayment };
