// models/Investor.js
const investorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  fullName: String,
  phone: String,

  totalInvested: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Investor", investorSchema);
