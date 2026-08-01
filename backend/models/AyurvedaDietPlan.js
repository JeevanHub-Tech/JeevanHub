const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
    items: [{ type: String }],
    portion: { type: String },
    purpose: { type: String },
}, { _id: false });

const dayPlanSchema = new mongoose.Schema({
    day: { type: String, required: true },
    breakfast: mealSchema,
    midMorning: mealSchema,
    lunch: mealSchema,
    eveningSnack: mealSchema,
    dinner: mealSchema,
}, { _id: false });

const cookingInstructionSchema = new mongoose.Schema({
    mealContext: { type: String },
    cookingMethod: { type: String },
    preparationStyle: { type: String },
    spicesHerbs: [{ type: String }],
    goodCombinations: [{ type: String }],
    avoidCombinations: [{ type: String }],
}, { _id: false });

// AI-generated personalized diet plan. One current record per patient --
// regenerating overwrites the previous plan (no history table in v1).
const ayurvedaDietPlanSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
        unique: true,
    },
    wellnessProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AyurvedaWellnessProfile",
    },
    doshaAssessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AyurvedaDoshaAssessment",
    },
    // Snapshot of the source docs' updatedAt at generation time -- lets the
    // API compute an `isStale` flag on read without a diff engine.
    basedOn: {
        wellnessProfileUpdatedAt: { type: Date },
        doshaAssessmentUpdatedAt: { type: Date },
    },
    summary: {
        bmiCategory: { type: String },
        prakritiSummary: { type: String },
        healthConsiderations: [{ type: String }],
    },
    explanation: {
        doshaBalanceReasoning: { type: String },
        medicalConditionReasoning: { type: String },
        seasonalReasoning: { type: String },
    },
    weeklyPlan: [dayPlanSchema],
    cookingInstructions: {
        meals: [cookingInstructionSchema],
        generalGuidelines: [{ type: String }],
    },
    foodsToAvoid: {
        doshaBased: [{ type: String }],
        medicalBased: [{ type: String }],
        seasonalBased: [{ type: String }],
    },
    lifestyleRecommendations: [{ type: String }],
    model: { type: String },
    generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const AyurvedaDietPlan = mongoose.model("AyurvedaDietPlan", ayurvedaDietPlanSchema);
module.exports = AyurvedaDietPlan;
