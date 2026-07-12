const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  zipCode: { type: String, required: true },
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

module.exports = mongoose.model('Patient', PatientSchema);