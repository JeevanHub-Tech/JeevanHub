/**
 * AI Ayurvedic diet-plan generator. Given a patient's wellness profile and
 * dosha assessment result, produces an explained, 7-day personalized diet
 * plan with cooking instructions and avoidance lists.
 *
 * Mirrors the Gemini call pattern used by the doctor-match agent and the
 * prescription-OCR service: same SDK, same responseJsonSchema
 * structured-output approach, same error-code contract (NO_KEY / DISABLED /
 * RATE_LIMIT / JSON_PARSE_ERROR). Provider-pluggable via config.js.
 */
const { AYURVEDA_DIET_ENABLED, AYURVEDA_DIET_PROVIDER, AYURVEDA_DIET_MODEL } = require('./config');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL_SCHEMA = {
  type: 'object',
  properties: {
    items: { type: 'array', items: { type: 'string' } },
    portion: { type: 'string' },
    purpose: { type: 'string', description: 'One short sentence: the Ayurvedic reason for this meal.' },
  },
  required: ['items', 'portion', 'purpose'],
};

const DAY_PLAN_SCHEMA = {
  type: 'object',
  properties: {
    day: { type: 'string', enum: DAYS },
    breakfast: MEAL_SCHEMA,
    midMorning: MEAL_SCHEMA,
    lunch: MEAL_SCHEMA,
    eveningSnack: MEAL_SCHEMA,
    dinner: MEAL_SCHEMA,
  },
  required: ['day', 'breakfast', 'midMorning', 'lunch', 'eveningSnack', 'dinner'],
};

const DIET_PLAN_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'object',
      properties: {
        bmiCategory: { type: 'string' },
        prakritiSummary: { type: 'string', description: 'One or two sentences summarizing the patient\'s dosha constitution.' },
        healthConsiderations: { type: 'array', items: { type: 'string' } },
      },
      required: ['prakritiSummary', 'healthConsiderations'],
    },
    explanation: {
      type: 'object',
      properties: {
        doshaBalanceReasoning: { type: 'string', description: 'Why these foods balance the patient\'s dosha.' },
        medicalConditionReasoning: { type: 'string', description: 'How the plan supports the patient\'s medical conditions, or empty if none reported.' },
        seasonalReasoning: { type: 'string', description: 'Seasonal (especially monsoon) benefits of the plan.' },
      },
      required: ['doshaBalanceReasoning', 'medicalConditionReasoning', 'seasonalReasoning'],
    },
    weeklyPlan: {
      type: 'array',
      description: 'Exactly 7 entries, one per day of the week, Monday through Sunday.',
      items: DAY_PLAN_SCHEMA,
    },
    cookingInstructions: {
      type: 'object',
      properties: {
        meals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mealContext: { type: 'string', description: 'e.g. "Breakfast", "Lunch", "General".' },
              cookingMethod: { type: 'string' },
              preparationStyle: { type: 'string' },
              spicesHerbs: { type: 'array', items: { type: 'string' } },
              goodCombinations: { type: 'array', items: { type: 'string' } },
              avoidCombinations: { type: 'array', items: { type: 'string' } },
            },
            required: ['mealContext', 'cookingMethod', 'preparationStyle'],
          },
        },
        generalGuidelines: { type: 'array', items: { type: 'string' } },
      },
      required: ['meals', 'generalGuidelines'],
    },
    foodsToAvoid: {
      type: 'object',
      properties: {
        doshaBased: { type: 'array', items: { type: 'string' } },
        medicalBased: { type: 'array', items: { type: 'string' } },
        seasonalBased: { type: 'array', items: { type: 'string' } },
      },
      required: ['doshaBased', 'medicalBased', 'seasonalBased'],
    },
    lifestyleRecommendations: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'explanation', 'weeklyPlan', 'cookingInstructions', 'foodsToAvoid', 'lifestyleRecommendations'],
};

const na = (v) => (v === undefined || v === null || v === '' ? 'not provided' : v);

function computeBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return +(weightKg / (heightM * heightM)).toFixed(1);
}

function bmiCategory(bmi) {
  if (bmi === null) return 'unknown';
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

// India-calendar Ayurvedic season, derived from the server clock rather than
// a patient-entered field -- the season is a fact of "now", not a form input.
function getCurrentSeason(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'summer';
  if (month <= 9) return 'monsoon';
  return 'autumn';
}

function buildPrompt({ profile, dosha, patient }) {
  const bd = profile?.basicDetails || {};
  const bmi = computeBmi(bd.heightCm, bd.weightKg);
  const conditions = profile?.healthInfo?.conditions || {};
  const conditionsList = [
    conditions.diabetes && 'diabetes',
    conditions.highBP && 'high blood pressure',
    conditions.obesityFocus && 'weight management focus',
    conditions.skinDisease && 'skin disease (eczema/psoriasis/chronic rashes)',
    conditions.jointPainArthritis && 'joint pain / arthritis',
    conditions.digestiveIssues && 'digestive issues (GERD/gastritis)',
    conditions.respiratoryIssues && 'respiratory issues (chronic cough/breathing difficulty)',
    ...(conditions.other || []),
  ].filter(Boolean);
  const season = getCurrentSeason();

  const patientBlock = {
    age: na(patient?.age),
    gender: na(patient?.gender),
    heightCm: na(bd.heightCm),
    weightKg: na(bd.weightKg),
    bmi: bmi === null ? 'not provided' : bmi,
    bmiCategory: bmiCategory(bmi),
    bodyType: na(bd.bodyType),
    medicalConditions: conditionsList.length ? conditionsList : 'none reported',
    medications: (profile?.healthInfo?.medications || []).length ? profile.healthInfo.medications : 'none reported',
    allergiesAndRestrictions: (profile?.healthInfo?.allergies || []).length ? profile.healthInfo.allergies : 'none reported',
    activityLevel: na(profile?.lifestyle?.activityLevel),
    sleep: `${na(profile?.lifestyle?.sleepHours)} hours, quality: ${na(profile?.lifestyle?.sleepQuality)}`,
    stressLevel: na(profile?.lifestyle?.stressLevel),
    exerciseHabits: na(profile?.lifestyle?.exerciseHabits),
    workRoutine: na(profile?.lifestyle?.workRoutine),
    dietType: na(profile?.foodHabits?.dietType),
    preferredFoods: (profile?.foodHabits?.preferredFoods || []).length ? profile.foodHabits.preferredFoods : 'none specified',
    dislikedFoods: (profile?.foodHabits?.dislikedFoods || []).length ? profile.foodHabits.dislikedFoods : 'none specified',
    eatingTimings: na(profile?.foodHabits?.eatingTimings),
    waterIntakeLiters: na(profile?.foodHabits?.waterIntakeLiters),
    currentSeason: na(season),
  };

  const doshaBlock = {
    primaryDosha: dosha.primaryDosha,
    secondaryDosha: dosha.secondaryDosha || 'none (single dosha dominant)',
    thirdDoshaStatus: dosha.thirdDoshaStatus,
    scores: dosha.calculatedScores,
  };

  const monsoonNote = season === 'monsoon'
    ? '\n\nSpecial focus: it is currently monsoon season. Emphasize easily digestible, freshly cooked, warm foods; caution against raw salads, street food, and stagnant-water risks; recommend immunity-supportive spices (ginger, turmeric, black pepper); flag monsoon-specific digestive-safety practices in foodsToAvoid.seasonalBased.'
    : '';

  return (
    `You are an Ayurvedic nutrition assistant generating a personalized diet plan for a patient. ` +
    `Every recommendation must be explainable and connect to the patient's specific dosha, medical ` +
    `conditions, or season -- never a generic food list. Strictly avoid any item listed in the ` +
    `patient's allergies/restrictions or disliked foods. Respect their diet type (e.g. vegetarian) ` +
    `absolutely.${monsoonNote}\n\n` +
    `PATIENT PROFILE:\n${JSON.stringify(patientBlock, null, 2)}\n\n` +
    `DOSHA (PRAKRITI) ASSESSMENT:\n${JSON.stringify(doshaBlock, null, 2)}\n\n` +
    `Generate a complete 7-day plan (Monday through Sunday, all 7 required), cooking instructions, ` +
    `foods to avoid (separately reasoned by dosha, medical condition, and season), and lifestyle ` +
    `recommendations, following the response schema exactly.`
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
      model: AYURVEDA_DIET_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json', responseJsonSchema: DIET_PLAN_SCHEMA, temperature: 0.4 },
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
const clampArr = (v, n = 20, strLen = 200) =>
  (Array.isArray(v) ? v : []).slice(0, n).map((s) => clampStr(s, strLen)).filter(Boolean);

function sanitizeMeal(meal) {
  meal = meal || {};
  return {
    items: clampArr(meal.items, 12, 120),
    portion: clampStr(meal.portion, 200),
    purpose: clampStr(meal.purpose, 300),
  };
}

function sanitizeWeeklyPlan(weeklyPlan) {
  const byDay = new Map();
  (Array.isArray(weeklyPlan) ? weeklyPlan : []).forEach((d) => {
    if (d && DAYS.includes(d.day)) byDay.set(d.day, d);
  });
  return DAYS.map((day) => {
    const d = byDay.get(day) || {};
    return {
      day,
      breakfast: sanitizeMeal(d.breakfast),
      midMorning: sanitizeMeal(d.midMorning),
      lunch: sanitizeMeal(d.lunch),
      eveningSnack: sanitizeMeal(d.eveningSnack),
      dinner: sanitizeMeal(d.dinner),
    };
  });
}

function sanitizePlan(raw) {
  const summary = raw.summary || {};
  const explanation = raw.explanation || {};
  const cooking = raw.cookingInstructions || {};
  const avoid = raw.foodsToAvoid || {};

  return {
    summary: {
      bmiCategory: clampStr(summary.bmiCategory, 50),
      prakritiSummary: clampStr(summary.prakritiSummary, 500),
      healthConsiderations: clampArr(summary.healthConsiderations, 10, 200),
    },
    explanation: {
      doshaBalanceReasoning: clampStr(explanation.doshaBalanceReasoning, 800),
      medicalConditionReasoning: clampStr(explanation.medicalConditionReasoning, 800),
      seasonalReasoning: clampStr(explanation.seasonalReasoning, 800),
    },
    weeklyPlan: sanitizeWeeklyPlan(raw.weeklyPlan),
    cookingInstructions: {
      meals: (Array.isArray(cooking.meals) ? cooking.meals : []).slice(0, 10).map((m) => ({
        mealContext: clampStr(m?.mealContext, 60),
        cookingMethod: clampStr(m?.cookingMethod, 200),
        preparationStyle: clampStr(m?.preparationStyle, 200),
        spicesHerbs: clampArr(m?.spicesHerbs, 10, 60),
        goodCombinations: clampArr(m?.goodCombinations, 10, 100),
        avoidCombinations: clampArr(m?.avoidCombinations, 10, 100),
      })),
      generalGuidelines: clampArr(cooking.generalGuidelines, 15, 200),
    },
    foodsToAvoid: {
      doshaBased: clampArr(avoid.doshaBased, 15, 150),
      medicalBased: clampArr(avoid.medicalBased, 15, 150),
      seasonalBased: clampArr(avoid.seasonalBased, 15, 150),
    },
    lifestyleRecommendations: clampArr(raw.lifestyleRecommendations, 15, 250),
  };
}

/**
 * @param {object} args { profile: AyurvedaWellnessProfile, dosha: AyurvedaDoshaAssessment, patient: {age, gender} }
 * @returns {Promise<object>} sanitized plan fields ready to persist on AyurvedaDietPlan (minus model/generatedAt/ids)
 */
async function generateDietPlan({ profile, dosha, patient }) {
  if (!AYURVEDA_DIET_ENABLED) { const e = new Error('AI diet planning is disabled'); e.code = 'DISABLED'; throw e; }
  if (!dosha || !dosha.primaryDosha) { const e = new Error('Dosha assessment is required'); e.code = 'MISSING_DOSHA'; throw e; }

  const prompt = buildPrompt({ profile, dosha, patient });

  let raw;
  if (AYURVEDA_DIET_PROVIDER === 'gemini') {
    raw = await generateWithGemini(prompt);
  } else {
    const e = new Error(`Ayurveda diet provider '${AYURVEDA_DIET_PROVIDER}' is not implemented`);
    e.code = 'PROVIDER_UNIMPLEMENTED';
    throw e;
  }

  return sanitizePlan(raw);
}

module.exports = { generateDietPlan, computeBmi, bmiCategory };
