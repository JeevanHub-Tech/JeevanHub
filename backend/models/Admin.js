const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  forcePasswordReset: { type: Boolean, default: false },
  passwordChangedAt: Date,
  permissions: {
    manageAdmins: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false },
    manageDoctors: { type: Boolean, default: false },
    manageRetailers: { type: Boolean, default: false },
    manageTransactions: { type: Boolean, default: false },
    manageBlogs: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('Admin', adminSchema);
