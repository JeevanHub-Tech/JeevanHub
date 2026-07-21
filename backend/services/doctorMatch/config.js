/**
 * Config for the AI doctor-matching agent. Kept separate from the enrichment
 * pipeline's LLM config so the two can use different providers/models independently.
 *
 * The agent is provider-pluggable: swapping Gemini (default, free tier) for
 * Anthropic/OpenAI/etc. later is a change to DOCTOR_MATCH_PROVIDER + adding a
 * branch in doctorMatchService.js — no controller/route changes.
 */
const num = (v, d) => (v === undefined || v === '' || isNaN(Number(v)) ? d : Number(v));
const bool = (v, d) => (v === undefined || v === '' ? d : String(v).toLowerCase() === 'true');

module.exports = {
  DOCTOR_MATCH_ENABLED: bool(process.env.DOCTOR_MATCH_ENABLED, true),

  // 'gemini' now (uses the GEMINI_API_KEY already configured for enrichment).
  DOCTOR_MATCH_PROVIDER: process.env.DOCTOR_MATCH_PROVIDER || 'gemini',

  // Model per provider. '-latest' aliases don't go stale the way pinned
  // gemini-2.5-* ids did (those now 404 for new keys).
  DOCTOR_MATCH_MODEL:
    process.env.DOCTOR_MATCH_MODEL ||
    (process.env.DOCTOR_MATCH_PROVIDER === 'anthropic' ? 'claude-haiku-4-5' : 'gemini-flash-latest'),

  // Cap how many doctors are ranked in one call (keeps the prompt bounded).
  DOCTOR_MATCH_MAX_CANDIDATES: num(process.env.DOCTOR_MATCH_MAX_CANDIDATES, 60),

  // Max characters of the patient's free-text query we forward (defensive bound).
  DOCTOR_MATCH_MAX_QUERY_CHARS: num(process.env.DOCTOR_MATCH_MAX_QUERY_CHARS, 800),
};
