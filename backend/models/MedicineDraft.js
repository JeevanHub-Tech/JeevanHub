const mongoose = require('mongoose');

const MedicineDraftSchema = new mongoose.Schema({
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer', required: true, unique: true },
  present: { type: Array, default: [] }, // Array of current table rows
}, { timestamps: true });

module.exports = mongoose.model('MedicineDraft', MedicineDraftSchema);
