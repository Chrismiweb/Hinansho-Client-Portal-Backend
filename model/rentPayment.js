const { Schema, model } = require('mongoose');

const RentPaymentRequestSchema = new Schema({
  tenancy: {
    type: Schema.Types.ObjectId,
    ref: 'Tenancy',
    required: true,
    index: true
  },

  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  rentDate: {
    type: Date,
    default: Date.now
  },

  amountClaimed: {
    type: Number,
    required: true
  },

  receiptUrl: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  adminNote: {
    type: String
  },

  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User' // admin
  },

  reviewedAt: {
    type: Date
  }

}, { timestamps: true });

RentPaymentRequestSchema.index(
  {
    tenancy: 1,
    rentDate: 1
  },
  { unique: true }
);


module.exports = model('RentPaymentRequest', RentPaymentRequestSchema);