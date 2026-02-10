const User = require('../model/user');
const Rent = require('../model/rent');
const RentPaymentRequest = require('../model/rentPayment');
const propertyDocument = require('../model/propertyDocument');
const Ownership = require('../model/owner');

const getRentSummary = async (req, res) => {
  const investorId = req.user._id;
  const { month, year } = req.query;

  const rents = await Rent.find({ investor: investorId, month, year });

  const totalCollected = rents.reduce((sum, r) => sum + r.amount, 0);

  res.json({
    success: true,
    totalCollected,
    count: rents.length
  });
};

const investorFinanceSummary = async (req, res) => {
  const investorId = req.user._id;

  try {
    const investments = await Ownership.find({ investor: investorId });

    const totalInvested = investments.reduce(
      (sum, o) => sum + o.amountPaid,
      0
    );

    const approvedRent = await RentPaymentRequest.aggregate([
      { $match: { investor: investorId, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingRent = await RentPaymentRequest.aggregate([
      { $match: { investor: investorId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalRentReceived = approvedRent[0]?.total || 0;
    const pendingAmount = pendingRent[0]?.total || 0;

    const roi =
      totalInvested > 0
        ? ((totalRentReceived / totalInvested) * 100).toFixed(2)
        : 0;

    res.json({
      success: true,
      data: {
        totalInvested,
        totalRentReceived,
        pendingRent: pendingAmount,
        roi: Number(roi)
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getRentHistory = async (req, res) => {
  const investorId = req.user._id;

  const rents = await Rent.find({ investor: investorId })
    .populate('property unit tenant')
    .sort({ createdAt: -1 });

  res.json({ success: true, rents });
};

const getPendingPayments = async (req, res) => {
  const investorId = req.user._id;

  const payments = await RentPaymentRequest.find({
    investor: investorId,
    status: 'pending'
  });

  res.json({ success: true, payments });
};

const fetchMyDocuments = async (req, res) => {
  const investorId = req.user._id;

  try {
    const documents = await propertyDocument.find({ investor: investorId })
      .populate('property', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      documents
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getRentSummary,
  getRentHistory,
  getPendingPayments,
  fetchMyDocuments,
  investorFinanceSummary
};
