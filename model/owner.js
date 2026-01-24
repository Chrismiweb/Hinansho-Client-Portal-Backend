const { Schema, model } = require("mongoose");

const OwnershipSchema = new Schema({
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
    default: null
  },

  amountPaid: { type: Number, required: true },

  documents: [{
    type: Schema.Types.ObjectId,
    ref: 'PropertyDocument'
  }],

  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User' // admin
  }
}, { timestamps: true });

OwnershipSchema.index(
  { unit: 1 },
  { unique: true, sparse: true }
);

module.exports = model('Ownership', OwnershipSchema);