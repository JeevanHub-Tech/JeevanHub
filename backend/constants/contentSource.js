// Shared AI-vs-doctor provenance enum, reused across AyurvedaDietPlan.status
// and DietYoga.yoga.status so a single frontend badge-resolver works for both.
const CONTENT_SOURCE_VALUES = ["ai", "doctor", "ai_modified", "doctor_approved"];

const CONTENT_SOURCE_LABELS = {
    ai: "AI Generated",
    doctor: "Doctor Provided",
    ai_modified: "AI Generated + Doctor Modified",
    doctor_approved: "Doctor Approved",
};

module.exports = { CONTENT_SOURCE_VALUES, CONTENT_SOURCE_LABELS };
