const { Schema, model } = require("mongoose");

const TenancySchema = new Schema({
  unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
    unique: true
  },

  rentAmount: {
    type: Number,
    required: true
  },

  securityDeposit: {
    type: Number,
    required: true
  },

  tenants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  startDate: Date,
  endDate: Date,

  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = model('Tenancy', TenancySchema);