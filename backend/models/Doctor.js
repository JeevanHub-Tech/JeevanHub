const mongoose = require("mongoose");

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
    originalStartTime: { type: String }, // Required for 'cancelled' or 'rescheduled'
    
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
    phone: { type: String, required: false }, // String for formatted numbers
    age: { type: Number, required: false },
    gender: { type: String, required: false },
    zipCode: { type: String, required: false }, // String to support formats
    address: { type: String, required: false },
    designation: { type: String, required: false },
    specialization: { type: [String], required: true },
    experience: { type: Number, required: false },
    certificate: { type: String, required: false },
    password: { type: String, required: false }, // not required for excel upload
    price: { type: Number, required: false }, // formerly fee
    education: { type: String, required: false }, // degree
    college: { type: String, required: false }, // from DoctorData
    dob: { type: String, required: false }, // Date as string or Date format
    profileImage: { type: String, required: false }, // from DoctorData imageLink
    qrCode: { type: String }, // payment qr
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

module.exports = mongoose.model("Doctor", doctorSchema);