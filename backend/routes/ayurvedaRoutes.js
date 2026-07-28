const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
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
} = require("../controllers/ayurvedaController");

router.post("/wellness-profile", verifyToken, upsertWellnessProfile);
router.get("/wellness-profile", verifyToken, getWellnessProfile);
router.get("/wellness-profile/patient/:patientId", verifyToken, getWellnessProfileForPatient);

router.post("/dosha-assessment", verifyToken, submitDoshaAssessment);
router.get("/dosha-assessment", verifyToken, getDoshaAssessment);
router.get("/dosha-assessment/patient/:patientId", verifyToken, getDoshaAssessmentForPatient);

router.post("/diet-plan/generate", verifyToken, generateDietPlan);
router.get("/diet-plan", verifyToken, getDietPlan);
router.get("/diet-plan/patient/:patientId", verifyToken, getDietPlanForPatient);

module.exports = router;
