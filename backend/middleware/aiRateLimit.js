const rateLimit = require("express-rate-limit");

// Shared guardrail for every AI-backed endpoint (Gemini doctor-match, OCR,
// Ayurveda diet-plan generation): these are the most expensive/costly calls
// in the app and must be used conservatively, not just correctness-limited.
// Keyed by authenticated user when available (precise, survives shared/NAT
// IPs) and falls back to IP for the one public AI route (doctor ai-match).
function aiRateLimit({ windowMs, max, message }) {
    return rateLimit({
        windowMs,
        max,
        message: { message: message || "Too many AI requests. Please wait before trying again." },
        keyGenerator: (req) => (req.user?._id ? String(req.user._id) : req.ip),
    });
}

module.exports = { aiRateLimit };
