/**
 * AI doctor-matching agent. Given a patient's free-text description of their
 * illness/concern and a shortlist of doctors, returns the doctors ranked by how
 * well they fit — with a short patient-facing reason for each.
 *
 * Provider-pluggable (see config.js). Gemini is the only implemented backend for
 * now; it reuses the GEMINI_API_KEY already configured for the enrichment pipeline.
 * Ranking is advisory only — it never invents doctors: the model may only return
 * ids from the candidate list, and anything it returns that isn't a real candidate
 * is dropped server-side.
 */
const {
  DOCTOR_MATCH_ENABLED, DOCTOR_MATCH_PROVIDER, DOCTOR_MATCH_MODEL,
  DOCTOR_MATCH_MAX_CANDIDATES, DOCTOR_MATCH_MAX_QUERY_CHARS,
} = require('./config');

const RANK_SCHEMA = {
  type: 'object',
  properties: {
    ranked: {
      type: 'array',
      description: 'Doctors that genuinely fit the concern, best first. Omit poor fits entirely.',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The doctor id, copied exactly from the candidate list.' },
          score: { type: 'number', description: '0-100 fit score for this concern.' },
          reason: { type: 'string', description: 'One short patient-facing sentence on why this doctor fits.' },
        },
        required: ['id', 'score', 'reason'],
      },
    },
  },
  required: ['ranked'],
};

/** Compact each doctor down to just what the model needs to judge fit. */
function toCandidate(d) {
  return {
    id: String(d.id || d._id),
    name: `${d.firstName || ''} ${d.lastName || ''}`.trim(),
    specialization: Array.isArray(d.specialization) ? d.specialization.join(', ') : (d.specialization || ''),
    designation: d.designation || '',
    education: d.education || '',
    experienceYears: d.experience ?? null,
    languages: Array.isArray(d.languages) ? d.languages.join(', ') : (d.languages || ''),
    about: (d.introduction || '').slice(0, 400),
    rating: d.rating ?? null,
  };
}

function buildPrompt(query, candidates) {
  return (
    `A patient is looking for an Ayurvedic doctor. In their own words, their concern is:\n` +
    `"""${query}"""\n\n` +
    `Here are the available doctors (JSON). Rank the ones who fit this concern, best first, ` +
    `and give each a 0-100 fit score and one short, warm, patient-facing reason. ` +
    `Weigh specialization relevance most, then experience, then rating and languages. ` +
    `Use a high score (80-100) only for a strong specialty match, mid (50-79) for a reasonable fit, ` +
    `and low (below 50) for a weak/general fit. If NO doctor is a strong match, still return the 3 ` +
    `closest available doctors with honest low scores rather than an empty list, so the patient always ` +
    `has a starting point. Only use ids present in this list; never invent a doctor.\n\n` +
    `DOCTORS:\n${JSON.stringify(candidates)}`
  );
}

// ---- provider backends ----------------------------------------------------
async function rankWithGemini({ query, candidates }) {
  const { GoogleGenAI } = require('@google/genai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { const e = new Error('GEMINI_API_KEY is not set'); e.code = 'NO_KEY'; throw e; }

  const ai = new GoogleGenAI({ apiKey });
  const resp = await ai.models.generateContent({
    model: DOCTOR_MATCH_MODEL,
    contents: buildPrompt(query, candidates),
    config: { responseMimeType: 'application/json', responseJsonSchema: RANK_SCHEMA, temperature: 0.3 },
  });
  let parsed;
  try { parsed = JSON.parse(resp.text); }
  catch (_) {
    const m = String(resp.text || '').match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : { ranked: [] };
  }
  return Array.isArray(parsed.ranked) ? parsed.ranked : [];
}

/**
 * @param {object} args { query: string, doctors: object[] }
 * @returns {Promise<Array<{id:string, score:number, reason:string}>>} ranked, best first,
 *   filtered to ids that actually exist in `doctors`.
 */
async function rankDoctors({ query, doctors }) {
  if (!DOCTOR_MATCH_ENABLED) { const e = new Error('AI doctor matching is disabled'); e.code = 'DISABLED'; throw e; }
  const cleanQuery = String(query || '').trim().slice(0, DOCTOR_MATCH_MAX_QUERY_CHARS);
  if (!cleanQuery) { const e = new Error('Empty query'); e.code = 'EMPTY_QUERY'; throw e; }
  if (!Array.isArray(doctors) || doctors.length === 0) return [];

  const candidates = doctors.slice(0, DOCTOR_MATCH_MAX_CANDIDATES).map(toCandidate);
  const validIds = new Set(candidates.map((c) => c.id));

  let ranked;
  if (DOCTOR_MATCH_PROVIDER === 'gemini') {
    ranked = await rankWithGemini({ query: cleanQuery, candidates });
  } else {
    const e = new Error(`Doctor-match provider '${DOCTOR_MATCH_PROVIDER}' is not implemented`);
    e.code = 'PROVIDER_UNIMPLEMENTED';
    throw e;
  }

  // Trust nothing: keep only real ids, dedupe, clamp scores, sort best-first.
  const seen = new Set();
  return ranked
    .filter((r) => r && validIds.has(String(r.id)) && !seen.has(String(r.id)) && seen.add(String(r.id)))
    .map((r) => ({
      id: String(r.id),
      score: Math.max(0, Math.min(100, Number(r.score) || 0)),
      reason: String(r.reason || '').slice(0, 240),
    }))
    .sort((a, b) => b.score - a.score);
}

module.exports = { rankDoctors };
