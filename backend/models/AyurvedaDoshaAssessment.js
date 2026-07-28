const mongoose = require("mongoose");

// New dosha questionnaire for the Ayurveda diet module. Deliberately separate
// from the existing PrakritiAssessment model/collection -- different
// question set (matches the wellness-module spec's own parameter list),
// different consumers, no shared state.
const ayurvedaDoshaAssessmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
        unique: true,
    },
    isComplete: {
        type: Boolean,
        default: false,
    },
    responses: [
        {
            questionId: { type: String, required: true },
            category: {
                type: String,
                enum: ["physical", "mental_behavioral", "lifestyle"],
                required: true,
            },
            doshaType: {
                type: String,
                enum: ["vata", "pitta", "kapha"],
                required: true,
            },
            score: { type: Number, required: true, min: 0, max: 4 },
        },
    ],
    calculatedScores: {
        vata: { type: Number, default: 0 },
        pitta: { type: Number, default: 0 },
        kapha: { type: Number, default: 0 },
    },
    primaryDosha: {
        type: String,
        enum: ["VATA", "PITTA", "KAPHA"],
    },
    secondaryDosha: {
        type: String,
        enum: ["VATA", "PITTA", "KAPHA", null],
        default: null,
    },
    thirdDoshaStatus: {
        type: String,
        enum: ["Balanced", "Low", "Elevated"],
    },
}, { timestamps: true });

const AyurvedaDoshaAssessment = mongoose.model("AyurvedaDoshaAssessment", ayurvedaDoshaAssessmentSchema);
module.exports = AyurvedaDoshaAssessment;
