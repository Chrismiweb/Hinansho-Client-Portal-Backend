// models/PropertyDocument.js
const { Schema, model } = require("mongoose");

const propertyDocumentSchema = new Schema({
  // Who this document belongs to
  investor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Context (optional but important)
  property: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    default: null,
    index: true
  },

  unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    default: null
  },

  ownership: {
    type: Schema.Types.ObjectId,
    ref: 'Ownership',
    default: null
  },

  // Document info
  documentType: {
    type: String,
    enum: [
      'deed',
      'contract',
      'agreement',
      'allocation_letter',
      'receipt',
      'other'
    ],
    default: 'other'
  },

  originalName: {
    type: String,
    required: true
  },

  fileUrl: {
    type: String,
    required: true
  },

  mimeType: String,
  size: Number,
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = model('PropertyDocument', propertyDocumentSchema);