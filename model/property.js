const mongoose = require('mongoose');
const { Schema, model } = mongoose;


const PropertySchema = new Schema({
  name: { type: String, required: true },

  property_type: {
    type: String,
    enum: ['hostel', 'land'],
    required: true,
    index: true
  },

  location: String,

  description: String,

  status: {
    type: String,
    enum: ['active', 'completed', 'under_construction'],
    default: 'active'
  },

  hasUnits: {
    type: Boolean,
  },

  totalUnits: {
    type: Number,
    default: 0
  },

  expected_roi: {
    type: Number,
    required: true
  },

  images: [String],

  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User', // admin
    required: true
  }
}, { timestamps: true });

module.exports = model('Property', PropertySchema);
