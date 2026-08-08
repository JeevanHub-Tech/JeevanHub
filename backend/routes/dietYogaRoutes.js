// routes/dietYogaRoutes.js
const express = require("express");
const router = express.Router();
const {
  getDietYogaByBooking,
  updateDiet,
  updateYoga,
  getDietYogaByPatientEmail,
  deleteDietYoga,
  prescribeDiet,
  prescribeYoga,
  generateYogaPlan,
  suggestYogaVideo,
} = require("../controllers/dietYogaController");
const auth = require("../middleware/auth");
const { aiRateLimit } = require("../middleware/aiRateLimit");

// Conservative guardrail on the AI yoga generator: it's a real Gemini call
// per click, not a cheap read.
const yogaAiLimit = aiRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: "Too many yoga plan generation requests. Please wait before generating another plan.",
});

// Create or update diet recommendation
router.post("/", auth, prescribeDiet);

// Create or update yoga recommendation
router.post("/yoga", auth, prescribeYoga);

// AI-assisted yoga generation + per-asana video suggestion (doctor-only)
router.post("/yoga/generate", auth, yogaAiLimit, generateYogaPlan);
router.post("/yoga/video-suggest", auth, suggestYogaVideo);

// Get diet and yoga recommendation by booking ID
router.get("/booking/:bookingId", auth, getDietYogaByBooking);

// Update diet recommendation
router.put("/diet/:id", auth, updateDiet);

// Update yoga recommendation
router.put("/yoga/:id", auth, updateYoga);

// Add this new route
router.get("/patient/:patientEmail", auth, getDietYogaByPatientEmail);

// Delete diet and yoga recommendation
router.delete("/:id", auth, deleteDietYoga);

module.exports = router;
