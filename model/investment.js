// models/Investment.js
const investmentSchema = new mongoose.Schema({
  investor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Investor",
    required: true
  },

  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true
  },

  amountPaid: Number,
  purchaseDate: Date,

  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // admin
  }
}, { timestamps: true });

module.exports = mongoose.model("Investment", investmentSchema);
