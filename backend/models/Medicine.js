const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { 
    type: Number, 
    required: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value for quantity'
    }
  },
  category: { type: String, required: true },
  description: { type: String, required: true },
  prescription: { type: Boolean, required: true },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  images: [{ type: String }], 
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer', required: true }, 
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

MedicineSchema.index({ category: 1 });
MedicineSchema.index({ price: 1 });
MedicineSchema.index({ name: 1 });
MedicineSchema.index({ rating: -1 });

module.exports = mongoose.model('Medicine', MedicineSchema);