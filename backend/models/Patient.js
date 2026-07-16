const mongoose = require('mongoose');
const { parseDob, indianPhoneValidator, indianZipCodeValidator, attachAgeVirtual } = require('./registrationSchemaHelpers');

const PatientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  countryCode: { type: String, required: false }, // e.g. "+91" - required:false at schema level until registration controller sends it (Phase 3)
  phone: {
    type: String,
    required: true,
    validate: { validator: indianPhoneValidator, message: 'Phone number must be exactly 10 digits for India (+91)' }
  },
  dob: { type: Date, required: true, set: parseDob },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Others'] },
  zipCode: {
    type: String,
    required: true,
    validate: { validator: indianZipCodeValidator, message: 'PIN code must be exactly 6 digits for India (+91)' }
  },
  address: { type: String },
  password: { type: String, required: true },
  role: { type: String, default: 'patient' },
  profileImage: {
    type: String
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
  hasTakenAssessment: {
    type: Boolean,
    default: false
  },
  lastAssessmentDate: {
    type: Date,
    default: null
  },
  medicalHistory: [{
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String },
    mimeType: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  passwordChangedAt: Date
}, { timestamps: true });

attachAgeVirtual(PatientSchema);

module.exports = mongoose.model('Patient', PatientSchema);