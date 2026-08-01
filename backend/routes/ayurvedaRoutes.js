const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { aiRateLimit } = require("../middleware/aiRateLimit");
const {
    upsertWellnessProfile,
    getWellnessProfile,
    getWellnessProfileForPatient,
    submitDoshaAssessment,
    getDoshaAssessment,
    getDoshaAssessmentForPatient,
    generateDietPlan,
    getDietPlan,
    getDietPlanForPatient,
    deleteDietPlan,
} = require("../controllers/ayurvedaController");

router.post("/wellness-profile", verifyToken, upsertWellnessProfile);
router.get("/wellness-profile", verifyToken, getWellnessProfile);
router.get("/wellness-profile/patient/:patientId", verifyToken, getWellnessProfileForPatient);

router.post("/dosha-assessment", verifyToken, submitDoshaAssessment);
router.get("/dosha-assessment", verifyToken, getDoshaAssessment);
router.get("/dosha-assessment/patient/:patientId", verifyToken, getDoshaAssessmentForPatient);

// Conservative guardrail on the AI diet-plan generator: it's a real Gemini
// call per click (Generate/Regenerate), not a cheap read.
const dietPlanAiLimit = aiRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: "Too many diet plan generation requests. Please wait before generating another plan.",
});

router.post("/diet-plan/generate", verifyToken, dietPlanAiLimit, generateDietPlan);
router.get("/diet-plan", verifyToken, getDietPlan);
router.get("/diet-plan/patient/:patientId", verifyToken, getDietPlanForPatient);
router.delete("/diet-plan", verifyToken, deleteDietPlan);

module.exports = router;
