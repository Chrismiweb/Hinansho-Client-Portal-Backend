const { Schema, model } = require("mongoose");

const TenancySchema = new Schema({
  unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
    index: true
  },

  tenants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],

  investor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  property: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },

  rentAmount: {
    type: Number,
    required: true
  },

  securityDeposit: {
    type: Number,
    required: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date
  },

  status: {
    type: String,
    enum: ['active', 'terminated', 'expired'],
    default: 'active',
    index: true
  },

  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User' // admin
  }

}, { timestamps: true });

/**
 * Enforce:
 * - One ACTIVE tenancy per unit
 */
TenancySchema.index(
  { unit: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

module.exports = model('Tenancy', TenancySchema);
