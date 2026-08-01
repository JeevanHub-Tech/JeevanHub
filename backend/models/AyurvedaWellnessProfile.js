const mongoose = require("mongoose");

// Patient wellness profile input for the Ayurveda diet module. Every field
// here is optional except patientId -- patients may skip anything they don't
// want to share, and the diet-plan prompt just notes those fields as "not
// provided" rather than requiring them.
const ayurvedaWellnessProfileSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
        unique: true,
    },
    basicDetails: {
        heightCm: { type: Number, min: 0 },
        weightKg: { type: Number, min: 0 },
        bodyType: { type: String },
    },
    healthInfo: {
        conditions: {
            diabetes: { type: Boolean, default: false },
            highBP: { type: Boolean, default: false },
            obesityFocus: { type: Boolean, default: false },
            other: [{ type: String }],
        },
        medications: [{ type: String }],
        allergies: [{ type: String }],
    },
    lifestyle: {
        activityLevel: { type: String, enum: ["sedentary", "light", "moderate", "active"] },
        sleepHours: { type: Number, min: 0, max: 24 },
        sleepQuality: { type: String, enum: ["poor", "fair", "good"] },
        stressLevel: { type: String, enum: ["low", "moderate", "high"] },
        exerciseHabits: { type: String },
        workRoutine: { type: String },
    },
    foodHabits: {
        dietType: { type: String, enum: ["vegetarian", "non_vegetarian", "eggetarian", "vegan"] },
        preferredFoods: [{ type: String }],
        dislikedFoods: [{ type: String }],
        eatingTimings: { type: String },
        waterIntakeLiters: { type: Number, min: 0 },
    },
    season: {
        current: { type: String, enum: ["spring", "summer", "monsoon", "autumn", "winter"] },
    },
}, { timestamps: true });

const AyurvedaWellnessProfile = mongoose.model("AyurvedaWellnessProfile", ayurvedaWellnessProfileSchema);
module.exports = AyurvedaWellnessProfile;
