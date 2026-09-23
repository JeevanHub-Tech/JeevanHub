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
  // Weight per unit in grams. Used for shipping cost estimation and automated
  // shipment creation. null = retailer hasn't set it yet → UI prompts them,
  // and freight calculators use a 200g fallback per unit.
  weightGrams: {
    type: Number,
    default: null,
    min: [1, 'Weight must be at least 1 gram'],
    max: [50000, 'Weight cannot exceed 50 kg']
  },
  category: { type: String, required: true },
  description: { type: String, required: true },
  diseasesTreated: [{ type: String, trim: true }],
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