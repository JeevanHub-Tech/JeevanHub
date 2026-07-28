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
    uploadedAt: { type: Date, default: Date.now },
    // Gemini OCR draft, extracted automatically at upload time. Immutable once
    // written -- the patient never edits this directly, only the
    // patientVerification copy below. Never shown to a doctor.
    ocr: {
      status: { type: String, enum: ['pending', 'processing', 'done', 'failed'], default: 'pending' },
      medicines: [{
        name: { type: String },
        dosage: { type: String },
        frequency: { type: String },
        duration: { type: String },
        instructions: { type: String },
      }],
      doctorName: { type: String },
      doctorRegistrationNumber: { type: String },
      prescriptionDate: { type: String },
      patientNameOnDocument: { type: String },
      rawText: { type: String },
      unclearNotes: { type: String },
      model: { type: String },
      error: { type: String },
      analyzedAt: { type: Date },
    },
    // Patient's editable copy of the OCR draft. Starts as a clone of `ocr` once
    // OCR finishes; the patient corrects/fills it in and submits. Only the
    // `submitted` state is ever exposed to a doctor.
    patientVerification: {
      status: { type: String, enum: ['pending', 'in_review', 'submitted'], default: 'pending' },
      medicines: [{
        name: { type: String },
        dosage: { type: String },
        frequency: { type: String },
        duration: { type: String },
        instructions: { type: String },
      }],
      doctorName: { type: String },
      doctorRegistrationNumber: { type: String },
      prescriptionDate: { type: String },
      patientNameOnDocument: { type: String },
      notes: { type: String },
      submittedAt: { type: Date },
    },
    // Full audit trail: the raw OCR extraction and every patient submission,
    // so "what did OCR say vs. what did the patient change" is always
    // reconstructable even though `ocr`/`patientVerification` above only hold
    // the latest state.
    auditLog: [{
      stage: { type: String, enum: ['ocr_extracted', 'ocr_failed', 'patient_submitted'], required: true },
      snapshot: { type: mongoose.Schema.Types.Mixed },
      actor: { type: mongoose.Schema.Types.ObjectId, refPath: 'medicalHistory.auditLog.actorModel' },
      actorModel: { type: String, enum: ['Patient', 'Doctor'] },
      at: { type: Date, default: Date.now },
    }],
  }],
  passwordChangedAt: Date
}, { timestamps: true });

attachAgeVirtual(PatientSchema);

module.exports = mongoose.model('Patient', PatientSchema);