const mongoose = require("mongoose");
const { CONTENT_SOURCE_VALUES } = require("../constants/contentSource");

const asanaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    link: { type: String, default: "" },
}, { _id: false });

// AI-generated personalized yoga plan. One current record per patient --
// mirrors AyurvedaDietPlan's shape/provenance model exactly (see that file
// for the reasoning). Patient generates it from their Prakriti + wellness
// profile; a doctor can then view/edit/save it, gated behind the same
// draft/publish flow as the diet plan and medicines.
const ayurvedaYogaPlanSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
        unique: true,
    },
    wellnessProfileId: { type: mongoose.Schema.Types.ObjectId, ref: "AyurvedaWellnessProfile" },
    doshaAssessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "AyurvedaDoshaAssessment" },
    basedOn: {
        wellnessProfileUpdatedAt: { type: Date },
        doshaAssessmentUpdatedAt: { type: Date },
    },
    summary: { type: String },
    morning: [asanaSchema],
    evening: [asanaSchema],
    videoAutoFetched: { type: [String], default: [] },
    model: { type: String },
    generatedAt: { type: Date, default: Date.now },

    status: { type: String, enum: CONTENT_SOURCE_VALUES, default: "ai" },
    doctorReview: {
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
        reviewedAt: { type: Date },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
        morning: [asanaSchema],
        evening: [asanaSchema],
        notes: { type: String },
        // Silent draft (Save) until "Submit Prescription" flips this to true.
        published: { type: Boolean, default: false },
    },
    history: [{
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
        action: { type: String, enum: ["ai_generated", "edited", "approved", "replaced"] },
        snapshot: mongoose.Schema.Types.Mixed,
    }],
}, { timestamps: true });

const AyurvedaYogaPlan = mongoose.model("AyurvedaYogaPlan", ayurvedaYogaPlanSchema);
module.exports = AyurvedaYogaPlan;
