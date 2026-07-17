// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Array of medicine items instead of a single medicine
  items: [{
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    quantity: { type: Number, required: true },
    subTotal: { type: Number, required: true },
    // 'accepted'/'rejected' cover the retailer's initial response to a pending
    // order; without them in the enum, the retailer "Accept"/"Reject" actions
    // (MyOrders.js) fail Mongoose validation on save and the order silently
    // never progresses past "pending" -- see updateOrderStatus below.
    itemStatus: { type: String, enum: ['pending', 'accepted', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    retailerStatus: { type: String, enum: ['received', 'accepted', 'rejected', 'shipped'], default: 'received' }
  }],
  totalPrice: Number,

  buyer: {
    firstName: String,
    lastName: String,
    type: { type: String, enum: ['Patient', 'Doctor'], required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, refPath: 'buyer.type', required: true }
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  paymentMethod: {
    type: String,
    enum: ['cashOnDelivery', 'onlinePayment'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentProof: {
    type: String, // Path to the uploaded payment screenshot
    required: false
  },
  paymentQR: {
    type: String, // Path to the QR code image
    required: false
  },
  razorpayOrderId: { type: String, required: false },
  paymentId: { type: String, required: false }, // Razorpay payment id, set once verified
  prescriptionUrl: { type: String, required: false }, // Uploaded prescription image, required when cart has an Rx item
  review: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    deliveredAt: { type: Date }
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  retailerStatus: {
    type: String,
    enum: ['received', 'accepted', 'rejected', 'shipped'],
    default: 'received'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);