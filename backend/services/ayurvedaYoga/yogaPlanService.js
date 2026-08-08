/**
 * AI yoga-recommendation generator. Given a patient's wellness profile,
 * dosha assessment, and reported goals/conditions, produces a morning/evening
 * asana sequence for a doctor to review, edit, and approve during
 * prescription.
 *
 * Mirrors services/ayurvedaDiet/dietPlanService.js's Gemini call pattern:
 * same SDK, same responseJsonSchema structured-output approach, same
 * error-code contract (NO_KEY / DISABLED / RATE_LIMIT / JSON_PARSE_ERROR).
 * Provider-pluggable via config.js. Video links are intentionally NOT
 * generated here -- asana selection and video lookup are separate concerns;
 * the caller fills in links via services/youtubeService.js.
 */
const { AYURVEDA_YOGA_ENABLED, AYURVEDA_YOGA_PROVIDER, AYURVEDA_YOGA_MODEL } = require('./config');
const { BODY_TYPES } = require('../../constants/bodyTypes');

const BODY_TYPE_LABELS = Object.fromEntries(BODY_TYPES.map((b) => [b.value, b.label]));

const ASANA_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Asana or pranayama name.' },
    purpose: { type: 'string', description: 'One short sentence: why this practice suits the patient\'s dosha/condition.' },
    durationMinutes: { type: 'integer' },
  },
  required: ['name', 'purpose', 'durationMinutes'],
};

const YOGA_PLAN_SCHEMA = {
  type: 'object',
  properties: {
    morning: { type: 'array', description: '2-5 morning asanas/pranayama.', items: ASANA_SCHEMA },
    evening: { type: 'array', description: '2-5 evening asanas/pranayama.', items: ASANA_SCHEMA },
    summary: { type: 'string', description: 'One or two sentences on why this sequence fits the patient\'s Prakriti and goals.' },
  },
  required: ['morning', 'evening', 'summary'],
};

const na = (v) => (v === undefined || v === null || v === '' ? 'not provided' : v);

function buildPrompt({ profile, dosha, patient, conditions }) {
  const bd = profile?.basicDetails || {};
  const profileConditions = profile?.healthInfo?.conditions || {};
  const conditionsList = [
    profileConditions.diabetes && 'diabetes',
    profileConditions.highBP && 'high blood pressure',
    profileConditions.obesityFocus && 'weight management focus',
    profileConditions.skinDisease && 'skin disease (eczema/psoriasis/chronic rashes)',
    profileConditions.jointPainArthritis && 'joint pain / arthritis',
    profileConditions.digestiveIssues && 'digestive issues (GERD/gastritis)',
    profileConditions.respiratoryIssues && 'respiratory issues (chronic cough/breathing difficulty)',
    ...(profileConditions.other || []),
    ...(Array.isArray(conditions) ? conditions : []),
  ].filter(Boolean);

  const patientBlock = {
    age: na(patient?.age),
    gender: na(patient?.gender),
    bodyType: bd.bodyType ? (BODY_TYPE_LABELS[bd.bodyType] || bd.bodyType) : 'not provided',
    activityLevel: na(profile?.lifestyle?.activityLevel),
    stressLevel: na(profile?.lifestyle?.stressLevel),
    sleep: `${na(profile?.lifestyle?.sleepHours)} hours, quality: ${na(profile?.lifestyle?.sleepQuality)}`,
    exerciseHabits: na(profile?.lifestyle?.exerciseHabits),
    medicalConditionsAndGoals: conditionsList.length ? conditionsList : 'none reported',
  };

  const doshaBlock = dosha ? {
    primaryDosha: dosha.primaryDosha,
    secondaryDosha: dosha.secondaryDosha || 'none (single dosha dominant)',
    thirdDoshaStatus: dosha.thirdDoshaStatus,
    scores: dosha.calculatedScores,
  } : 'not assessed';

  return (
    `You are an Ayurvedic yoga instructor generating a personalized morning/evening asana and ` +
    `pranayama sequence for a patient. Every recommendation must be safe, explainable, and connect to ` +
    `the patient's specific dosha, medical conditions, or goals -- never a generic pose list. Flag ` +
    `contraindications implicitly by choosing safe alternatives rather than risky poses for the ` +
    `patient's reported conditions.\n\n` +
    `PATIENT PROFILE:\n${JSON.stringify(patientBlock, null, 2)}\n\n` +
    `DOSHA (PRAKRITI) ASSESSMENT:\n${JSON.stringify(doshaBlock, null, 2)}\n\n` +
    `Generate a morning sequence and an evening sequence (2-5 practices each), each with a name, ` +
    `one-sentence purpose, and a duration in minutes, plus a short overall summary, following the ` +
    `response schema exactly.`
  );
}

async function generateWithGemini(prompt) {
  const { GoogleGenAI } = require('@google/genai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { const e = new Error('GEMINI_API_KEY is not set'); e.code = 'NO_KEY'; throw e; }

  const ai = new GoogleGenAI({ apiKey });
  let resp;
  try {
    resp = await ai.models.generateContent({
      model: AYURVEDA_YOGA_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json', responseJsonSchema: YOGA_PLAN_SCHEMA, temperature: 0.4 },
    });
  } catch (error) {
    if (error.status === 429 || (error.message && (error.message.includes('429') || error.message.includes('quota')))) {
      const e = new Error('Gemini API rate limit exceeded');
      e.code = 'RATE_LIMIT';
      throw e;
    }
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(resp.text);
  } catch (_) {
    try {
      const m = String(resp.text || '').match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    } catch (parseError) {
      const e = new Error('Failed to parse AI response: ' + parseError.message);
      e.code = 'JSON_PARSE_ERROR';
      throw e;
    }
  }
  return parsed && typeof parsed === 'object' ? parsed : {};
}

// ---- sanitization: trust nothing the model returns ------------------------
const clampStr = (v, n = 500) => String(v || '').slice(0, n);
const clampNum = (v, min, max, fallback) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
};

function sanitizeAsanaList(list) {
  return (Array.isArray(list) ? list : [])
    .filter((a) => a && a.name)
    .slice(0, 8)
    .map((a) => ({
      name: clampStr(a.name, 100),
      purpose: clampStr(a.purpose, 300),
      durationMinutes: clampNum(a.durationMinutes, 1, 60, 5),
      link: '', // filled by the caller via youtubeService, not the AI model
    }));
}

function sanitizePlan(raw) {
  return {
    morning: sanitizeAsanaList(raw.morning),
    evening: sanitizeAsanaList(raw.evening),
    summary: clampStr(raw.summary, 500),
  };
}

/**
 * @param {object} args { profile: AyurvedaWellnessProfile, dosha: AyurvedaDoshaAssessment|null, patient: {age, gender}, conditions: string[] }
 * @returns {Promise<object>} sanitized { morning, evening, summary } ready for video-link fill-in and persistence
 */
async function generateYogaPlan({ profile, dosha, patient, conditions }) {
  if (!AYURVEDA_YOGA_ENABLED) { const e = new Error('AI yoga planning is disabled'); e.code = 'DISABLED'; throw e; }

  const prompt = buildPrompt({ profile, dosha, patient, conditions });

  let raw;
  if (AYURVEDA_YOGA_PROVIDER === 'gemini') {
    raw = await generateWithGemini(prompt);
  } else {
    const e = new Error(`Ayurveda yoga provider '${AYURVEDA_YOGA_PROVIDER}' is not implemented`);
    e.code = 'PROVIDER_UNIMPLEMENTED';
    throw e;
  }

  return sanitizePlan(raw);
}

module.exports = { generateYogaPlan };
