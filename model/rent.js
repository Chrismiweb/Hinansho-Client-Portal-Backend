const RentPaymentSchema = new Schema({
  unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true
  },

  period: {
    month: Number,
    year: Number
  },

  amount: Number,

  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('RentPayment', RentPaymentSchema);