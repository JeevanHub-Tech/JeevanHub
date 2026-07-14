const mongoose = require('mongoose');

// doctorId is null for a patient's own default cart (added via "Add to Cart"),
// or a Doctor's _id for a cart created by that doctor's prescriptions. Together
// with patientId this gives each patient one default cart plus one cart per
// doctor they've been prescribed by — never mixed.
const cartSchema = new mongoose.Schema({
    patientId:{type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true},
    doctorId:{type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: false, default: null},
    items: [{
        medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    totalPrice: { type: Number, required: true },
    updatedAt: { type: Date, default: Date.now }
})

cartSchema.index({ patientId: 1, doctorId: 1 }, { unique: true });

module.exports = mongoose.model('Cart', cartSchema)