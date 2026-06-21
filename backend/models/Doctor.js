const mongoose = require("mongoose");

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
    forcePasswordReset: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("Doctor", doctorSchema);