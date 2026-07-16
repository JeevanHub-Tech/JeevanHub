const mongoose = require("mongoose");
const { parseDob, indianPhoneValidator, indianZipCodeValidator, attachAgeVirtual } = require('./registrationSchemaHelpers');

const SlotTemplateSchema = new mongoose.Schema({
    startTime: { type: String, required: true }, // e.g. "09:00"
    duration: { type: Number, required: true }, // in minutes
    fee: { type: Number },
    consultationType: { type: String, enum: ['Online', 'In-Person', 'Both'], default: 'Online' },
    sessionType: { type: String, enum: ['1-to-1', 'Group'], default: '1-to-1' },
    maxCapacity: { type: Number, default: 1 },
    isDisabled: { type: Boolean, default: false }
});

const ScheduleOverrideSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    type: { type: String, enum: ['cancelled', 'rescheduled', 'added'], required: true },
    targetSlotId: { type: mongoose.Schema.Types.ObjectId }, // Required for 'cancelled' or 'rescheduled'
    
    // Details if 'rescheduled' or 'added'
    newStartTime: { type: String },
    newDuration: { type: Number },
    newFee: { type: Number },
    newConsultationType: { type: String, enum: ['Online', 'In-Person', 'Both'] },
    newSessionType: { type: String, enum: ['1-to-1', 'Group'] },
    newMaxCapacity: { type: Number },
    newBufferTime: { type: Number }
});

const doctorSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    registrationNumber: { type: String, required: false, unique: true, sparse: true }, // allow nulls if coming from excel
    email: { type: String, required: true, unique: true },
    countryCode: { type: String, required: false }, // e.g. "+91" - required:false at schema level to stay compatible with admin bulk-import (Phase 3 enforces required-ness for self-registration)
    phone: {
        type: String,
        required: false,
        validate: { validator: indianPhoneValidator, message: 'Phone number must be exactly 10 digits for India (+91)' }
    }, // String for formatted numbers
    gender: { type: String, required: false, enum: ['Male', 'Female', 'Others'] },
    zipCode: {
        type: String,
        required: false,
        validate: { validator: indianZipCodeValidator, message: 'PIN code must be exactly 6 digits for India (+91)' }
    }, // String to support formats
    address: { type: String, required: false },
    designation: { type: String, required: false },
    specialization: { type: [String], required: true },
    experience: { type: Number, required: false },
    certificate: { type: String, required: false },
    password: { type: String, required: false }, // not required for excel upload
    price: { type: Number, required: false }, // formerly fee
    education: { type: String, required: false }, // degree
    college: { type: String, required: false }, // from DoctorData
    dob: { type: Date, required: false, set: parseDob }, // was stored as a raw string; now normalized to a real Date (parseDob also handles the "DD/MM/YYYY" strings produced by the Excel bulk-import path)
    profileImage: { type: String, required: false }, // from DoctorData imageLink
    qrCode: { type: String }, // payment qr
    upiId: {
        type: String,
        required: false,
        validate: {
            validator: function(v) {
                return !v || /^[a-zA-Z0-9.\-_]{1,256}@[a-zA-Z0-9.\-_]{1,64}$/.test(v);
            },
            message: props => `${props.value} is not a valid UPI ID!`
        }
    },
    introduction: { type: String },
    languages: [{ type: String }],
    timings: { type: String },
    availableSlots: {
        Monday: [SlotTemplateSchema],
        Tuesday: [SlotTemplateSchema],
        Wednesday: [SlotTemplateSchema],
        Thursday: [SlotTemplateSchema],
        Friday: [SlotTemplateSchema],
        Saturday: [SlotTemplateSchema],
        Sunday: [SlotTemplateSchema]
    },
    scheduleOverrides: [ScheduleOverrideSchema],
    paymentMethods: [{ type: String }],
    approvalStatus: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
    },
    role: { type: String, default: 'doctor' },
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
    forcePasswordReset: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    },
    passwordChangedAt: Date
}, { timestamps: true });

attachAgeVirtual(doctorSchema);

module.exports = mongoose.model("Doctor", doctorSchema);