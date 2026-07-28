/**
 * Config for the AI Ayurvedic diet-plan generator. Mirrors
 * services/doctorMatch/config.js -- separate env vars so this agent can be
 * tuned/disabled independently of doctor-matching and prescription OCR.
 */
const num = (v, d) => (v === undefined || v === '' || isNaN(Number(v)) ? d : Number(v));
const bool = (v, d) => (v === undefined || v === '' ? d : String(v).toLowerCase() === 'true');

module.exports = {
  AYURVEDA_DIET_ENABLED: bool(process.env.AYURVEDA_DIET_ENABLED, true),

  // 'gemini' now (reuses the GEMINI_API_KEY already configured for the other agents).
  AYURVEDA_DIET_PROVIDER: process.env.AYURVEDA_DIET_PROVIDER || 'gemini',

  // '-latest' alias avoids stale pinned model ids. Smallest/cheapest tier
  // (flash-lite) -- keep AI usage conservative and low-cost.
  AYURVEDA_DIET_MODEL: process.env.AYURVEDA_DIET_MODEL || 'gemini-flash-lite-latest',
};
