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
    status: {
      type: 'string',
      enum: ['matched', 'clarify'],
      description:
        '"matched" if the patient described an actual health concern and doctors were ranked; ' +
        '"clarify" if the input was a greeting, gibberish, or too vague/unrelated to act on.',
    },
    message: {
      type: 'string',
      description: 'Only when status is "clarify": one short, warm sentence asking for more detail.',
    },
    suggestions: {
      type: 'array',
      description: 'Only when status is "clarify": 2-4 short concrete examples of what to add.',
      items: { type: 'string' },
    },
    ranked: {
      type: 'array',
      description: 'Only when status is "matched". Doctors that genuinely fit the concern, best first.',
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
  required: ['status'],
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
    `You help match a patient with an Ayurvedic doctor based on what they type into a free-text ` +
    `search box. Patient's input:\n"""${query}"""\n\n` +
    `Step 1 — Decide whether this input actually describes a health concern, symptom, or condition, ` +
    `even loosely (e.g. "stressed lately", "skin allergy", "want a general checkup"). It does NOT ` +
    `count as a health concern if it's a greeting ("hi", "hello"), small talk, gibberish/test text, ` +
    `or a request with no medical detail at all (e.g. "find me a doctor", "help"). If the input is too ` +
    `short or vague to act on, treat it as not a health concern.\n\n` +
    `Step 2a — If it is NOT a health concern, set status to "clarify". Write one short, warm sentence ` +
    `(max ~25 words) telling the patient you need more detail, plus 2-4 short concrete suggestions of ` +
    `what to add (e.g. main symptom, how long it's lasted, affected body area, severity). Leave "ranked" empty.\n\n` +
    `Step 2b — If it IS a health concern, set status to "matched" and rank the doctors below who fit, ` +
    `best first, each with a 0-100 fit score and one short, warm, patient-facing reason. Weigh ` +
    `specialization relevance most, then experience, then rating and languages. Use a high score ` +
    `(80-100) only for a strong specialty match, mid (50-79) for a reasonable fit, low (below 50) for a ` +
    `weak/general fit. If no doctor is a strong match, still return the closest 2-3 available doctors ` +
    `with honest low scores rather than an empty list, so the patient still has a starting point. Only ` +
    `use ids present in the list below; never invent a doctor.\n\n` +
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
    parsed = m ? JSON.parse(m[0]) : {};
  }
  return parsed && typeof parsed === 'object' ? parsed : {};
}

/**
 * @param {object} args { query: string, doctors: object[] }
 * @returns {Promise<{status: 'matched'|'clarify', ranked: Array<{id:string, score:number, reason:string}>,
 *   message?: string, suggestions?: string[]}>} `ranked` is best-first and filtered to ids that actually
 *   exist in `doctors`. `message`/`suggestions` are only present when status is 'clarify'.
 */
async function rankDoctors({ query, doctors }) {
  if (!DOCTOR_MATCH_ENABLED) { const e = new Error('AI doctor matching is disabled'); e.code = 'DISABLED'; throw e; }
  const cleanQuery = String(query || '').trim().slice(0, DOCTOR_MATCH_MAX_QUERY_CHARS);
  if (!cleanQuery) { const e = new Error('Empty query'); e.code = 'EMPTY_QUERY'; throw e; }
  if (!Array.isArray(doctors) || doctors.length === 0) return { status: 'matched', ranked: [] };

  const candidates = doctors.slice(0, DOCTOR_MATCH_MAX_CANDIDATES).map(toCandidate);
  const validIds = new Set(candidates.map((c) => c.id));

  let result;
  if (DOCTOR_MATCH_PROVIDER === 'gemini') {
    result = await rankWithGemini({ query: cleanQuery, candidates });
  } else {
    const e = new Error(`Doctor-match provider '${DOCTOR_MATCH_PROVIDER}' is not implemented`);
    e.code = 'PROVIDER_UNIMPLEMENTED';
    throw e;
  }

  if (result.status === 'clarify') {
    const suggestions = Array.isArray(result.suggestions)
      ? result.suggestions
          .filter((s) => typeof s === 'string' && s.trim())
          .slice(0, 4)
          .map((s) => s.trim().slice(0, 140))
      : [];
    return {
      status: 'clarify',
      message: String(result.message || "Could you share a bit more about what you're experiencing?").slice(0, 300),
      suggestions,
      ranked: [],
    };
  }

  // Trust nothing: keep only real ids, dedupe, clamp scores, sort best-first.
  const seen = new Set();
  const rawRanked = Array.isArray(result.ranked) ? result.ranked : [];
  const ranked = rawRanked
    .filter((r) => r && validIds.has(String(r.id)) && !seen.has(String(r.id)) && seen.add(String(r.id)))
    .map((r) => ({
      id: String(r.id),
      score: Math.max(0, Math.min(100, Number(r.score) || 0)),
      reason: String(r.reason || '').slice(0, 240),
    }))
    .sort((a, b) => b.score - a.score);

  return { status: 'matched', ranked };
}

module.exports = { rankDoctors };
