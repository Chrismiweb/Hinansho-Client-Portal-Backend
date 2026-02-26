const User = require('../model/user');
const Rent = require('../model/rent');
const RentPaymentRequest = require('../model/rentPayment');
const propertyDocument = require('../model/propertyDocument');
const Ownership = require('../model/owner');
const Property = require('../model/property');
const Unit = require('../model/unit');



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


// Fetch properties an investor has ownership in, with summary stats
const getInvestorProperties = async (req, res) => {
  const investorId = req.user._id;

  try {
    const ownerships = await Ownership.find({ investor: investorId })
      .populate({ path: 'unit', select: 'unitNo status property' })
      .populate('property')
      .sort({ createdAt: -1 })
      .lean();

    if (!ownerships.length) {
      return res.json({ success: true, properties: [] });
    }

    const propMap = new Map();

    ownerships.forEach(o => {
      const p = o.property;
      if (!p) return;

      const id = p._id.toString();

      if (!propMap.has(id)) {
        propMap.set(id, {
          propertyId: p._id,
          name: p.name,
          location: p.location,
          type: p.property_type,
          status: p.status,
          images: p.images || [],
          totalUnits: p.totalUnits || 0,
          ownershipCount: 0,
          amountInvested: 0,
          unitsOwned: []
        });
      }

      const entry = propMap.get(id);
      entry.ownershipCount += 1;
      entry.amountInvested += o.amountPaid || 0;
      if (o.unit) {
        entry.unitsOwned.push({ unitId: o.unit._id, unitNo: o.unit.unitNo, unitStatus: o.unit.status });
      }
    });

    const propertyIds = Array.from(propMap.keys());

    const units = await Unit.find({ property: { $in: propertyIds } }).select('property status').lean();
    const unitCounts = {};

    units.forEach(u => {
      const id = u.property.toString();
      unitCounts[id] = unitCounts[id] || { total: 0, occupied: 0 };
      unitCounts[id].total += 1;
      if (u.status === 'occupied') unitCounts[id].occupied += 1;
    });

    const properties = Array.from(propMap.values()).map(entry => {
      const id = entry.propertyId.toString();
      const counts = unitCounts[id] || { total: entry.totalUnits || 0, occupied: 0 };
      const total = counts.total || entry.totalUnits || 0;
      const occupancy = total > 0 ? Math.round((counts.occupied / total) * 100) : 0;
      const statusLabel = entry.status === 'active' ? 'Active' : entry.status === 'completed' ? 'Completed' : 'Under Management';

      return {
        propertyId: entry.propertyId,
        name: entry.name,
        location: entry.location,
        type: entry.type,
        occupancy,
        totalUnits: total,
        ownershipCount: entry.ownershipCount,
        amountInvested: entry.amountInvested,
        status: statusLabel,
        image: entry.images[0] || null,
        unitsOwned: entry.unitsOwned
      };
    });

    res.json({ success: true, properties });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getRentSummary,
  getRentHistory,
  getPendingPayments,
  fetchMyDocuments,
  investorFinanceSummary,
  getInvestorProperties
};
