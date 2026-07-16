const mongoose = require('mongoose');
const { parseDob, indianPhoneValidator, indianZipCodeValidator, attachAgeVirtual } = require('./registrationSchemaHelpers');

const RetailerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  BusinessName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  countryCode: { type: String, required: false }, // e.g. "+91" - required:false at schema level until registration controller sends it (Phase 3)
  phone: {
    type: String,
    required: true,
    validate: { validator: indianPhoneValidator, message: 'Phone number must be exactly 10 digits for India (+91)' }
  },
  dob: { type: Date, required: true, set: parseDob },
  licenseNumber: {
    type: String,
    required: true,
    // No single national format exists - drug/retail licenses are issued per-state under the
    // Drugs & Cosmetics Act. Just bound the length and allow common separators (e.g. "KA-B5-12345").
    validate: {
      validator: (v) => !v || /^[A-Za-z0-9\-/. ]{3,50}$/.test(v),
      message: 'License number must be 3-50 characters (letters, numbers, spaces, - / . allowed)'
    }
  },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Others'] },
  zipCode: {
    type: String,
    required: true,
    validate: { validator: indianZipCodeValidator, message: 'PIN code must be exactly 6 digits for India (+91)' }
  },
  address: { type: String },
  licenseDocument: { type: String, default: null }, // optional Cloudinary URL for an uploaded license/certificate document
  profileImage: { type: String },
  password: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  role: { type: String, default: 'retailer' },
  razorpayAccountId: {
    type: String,
    default: null
  },
  resetPasswordOTP: {
    type: String,
    default: null
  },
  resetPasswordOTPExpires: {
    type: Date,
    default: null
  },
  isOTPVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  passwordChangedAt: Date
}, { timestamps: true });

attachAgeVirtual(RetailerSchema);

module.exports = mongoose.model('Retailer', RetailerSchema);
