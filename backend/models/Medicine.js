const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  prescription: { type: Boolean, required: true },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  images: [{ type: String }], 
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer', required: true }, 
}, { timestamps: true });

module.exports = mongoose.model('Medicine', MedicineSchema); 