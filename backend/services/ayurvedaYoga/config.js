/**
 * Config for the AI yoga-recommendation generator. Mirrors
 * services/ayurvedaDiet/config.js -- separate env vars so this agent can be
 * tuned/disabled independently of the diet planner and other AI agents.
 */
const num = (v, d) => (v === undefined || v === '' || isNaN(Number(v)) ? d : Number(v));
const bool = (v, d) => (v === undefined || v === '' ? d : String(v).toLowerCase() === 'true');

module.exports = {
  AYURVEDA_YOGA_ENABLED: bool(process.env.AYURVEDA_YOGA_ENABLED, true),

  // 'gemini' now (reuses the GEMINI_API_KEY already configured for the other agents).
  AYURVEDA_YOGA_PROVIDER: process.env.AYURVEDA_YOGA_PROVIDER || 'gemini',

  // '-latest' alias avoids stale pinned model ids. Smallest/cheapest tier
  // (flash-lite) -- keep AI usage conservative and low-cost.
  AYURVEDA_YOGA_MODEL: process.env.AYURVEDA_YOGA_MODEL || 'gemini-flash-lite-latest',
};
