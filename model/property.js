// models/Property.js
const propertySchema = new mongoose.Schema({
  title: String,

  type: {
    type: String,
    enum: ["land", "hostel"],
    required: true
  },

  location: String,
  price: Number,

  images: [String],

  status: {
    type: String,
    enum: ["available", "assigned"],
    default: "available"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);
