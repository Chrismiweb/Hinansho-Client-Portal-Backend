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
  },

  type: {
    type: String,
    enum: ['hostel', 'land', 'apartment'],
    required: true
  },

  maxTenants: {
    type: Number,
    default: 1 // 🔑 now aligns with single tenancy
  },

  bedrooms: Number,
  bathrooms: Number,
  sizeSqFt: Number,

  status: {
    type: String,
    enum: ['vacant', 'occupied'],
    default: 'vacant',
    index: true
  },

  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Unit', unitSchema);
