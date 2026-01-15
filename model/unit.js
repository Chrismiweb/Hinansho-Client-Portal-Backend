const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },

  unitNo: {
    type: String,
    required: true
    // Example: HST-A01, LAND-1A
  },

  type: {
    type: String,
    enum: ['hostel', 'land', 'apartment'],
    required: true
  },

  maxTenants: {
    type: Number,
    default: 2
  },

  rentAmount: {
    type: Number
  },

  bedrooms: {
    type: Number,
    default: 1
  },

  bathrooms: {
    type: Number,
    default: 1
  },

  sizeSqFt: {
    type: Number
  },

  status: {
    type: String,
    enum: ['vacant', 'owned', 'occupied'],
    default: 'vacant'
  },

  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  tenants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, { timestamps: true });

/**
 * Enforce:
 * - Max 2 tenants per unit
 */
unitSchema.pre('save', function (next) {
  if (this.tenants.length > this.maxTenants) {
    return next(new Error('Maximum tenant limit exceeded'));
  }
  next();
});

module.exports = mongoose.model('Unit', unitSchema);
