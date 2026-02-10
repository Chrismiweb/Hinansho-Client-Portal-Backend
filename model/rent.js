const { Schema, model } = require('mongoose');

const RentSchema = new Schema({
  tenant: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },
  tenancy: {
    type: Schema.Types.ObjectId,
    ref: 'Tenancy',
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  rentDate: {
    type: Date,
    required: true
  },

  source: {
    type: String,
    enum: ['manual_verification'],
    default: 'manual_verification'
  },

  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = model('Rent', RentSchema);
