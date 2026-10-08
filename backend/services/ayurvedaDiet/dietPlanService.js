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
const { BODY_TYPES } = require('../../constants/bodyTypes');

const BODY_TYPE_LABELS = Object.fromEntries(BODY_TYPES.map((b) => [b.value, b.label]));

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
        regionalPreference: { type: 'string', description: 'Regional cuisine style applied (e.g. North Indian, South Indian, Indo-Chinese).' },
      },
      required: ['prakritiSummary', 'healthConsiderations'],
    },
    explanation: {
      type: 'object',
      properties: {
        doshaBalanceReasoning: { type: 'string', description: 'Why these foods balance the patient\'s dosha.' },
        medicalConditionReasoning: { type: 'string', description: 'How the plan supports the patient\'s medical conditions, or empty if none reported.' },
        seasonalReasoning: { type: 'string', description: 'Seasonal (especially monsoon) benefits of the plan.' },
        regionalAdaptationReasoning: { type: 'string', description: 'How the regional cuisine style (North Indian, South Indian, or Indo-Chinese) is harmonized for dosha balance.' },
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
        regionalDishesToAvoid: { type: 'array', items: { type: 'string' }, description: 'Popular regional dishes of this cuisine to avoid due to dosha aggravation.' },
      },
      required: ['doshaBased', 'medicalBased', 'seasonalBased'],
    },
    lifestyleRecommendations: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'explanation', 'weeklyPlan', 'cookingInstructions', 'foodsToAvoid', 'lifestyleRecommendations'],
};

const RECIPE_SCHEMA = {
  type: 'object',
  properties: {
    dishName: { type: 'string', description: 'Name of the dish' },
    prepTimeMinutes: { type: 'number', description: 'Preparation time in minutes' },
    cookTimeMinutes: { type: 'number', description: 'Cooking time in minutes' },
    servings: { type: 'string', description: 'Portion / Servings size' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          item: { type: 'string', description: 'Ingredient name and quantity, e.g. "1/2 cup Moong Dal (washed)"' },
          ayurvedicRole: { type: 'string', description: 'Ayurvedic significance or digestive note, e.g. "Easy to digest, cooling protein"' },
        },
        required: ['item'],
      },
    },
    steps: {
      type: 'array',
      items: { type: 'string', description: 'Numbered cooking step instruction' },
    },
    ayurvedicBenefits: {
      type: 'string',
      description: 'Why this dish and cooking method suits the patient\'s dosha balance and digestive Agni.',
    },
    cookingTips: {
      type: 'array',
      items: { type: 'string', description: 'Ayurvedic culinary tips, tempering recommendations, or food combinations.' },
    },
  },
  required: ['dishName', 'prepTimeMinutes', 'cookTimeMinutes', 'ingredients', 'steps', 'ayurvedicBenefits'],
};

const REGIONAL_LABELS = {
  north_indian: 'North Indian (Phulkas/Roti, Dal Tadka, Seasonal Sabzi, Paneer, Jeera Rice, Khichdi, Warm Digestive Spices)',
  south_indian: 'South Indian (Idli, Dosa/Uttapam, Sambar, Rasam, Rice/Kanji, Mor/Buttermilk, Curry Leaves, Mustard & Hing Tempering)',
  indo_chinese: 'Indo-Chinese (Ayurvedic-adapted: Steamed vegetable dumplings/Momos, Ginger-Garlic-Sesame Clear Vegetable Soup, Mild Stir-fry Veggies, Light Fried Rice with Cumin & Turmeric, avoiding excess vinegar/MSG/deep-frying)',
  no_preference: 'Standard Indian Ayurvedic / Balanced Homestyle',
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

  const regionalKey = profile?.foodHabits?.regionalPreference || 'no_preference';
  const regionalLabel = REGIONAL_LABELS[regionalKey] || REGIONAL_LABELS.no_preference;

  const patientBlock = {
    age: na(patient?.age),
    gender: na(patient?.gender),
    heightCm: na(bd.heightCm),
    weightKg: na(bd.weightKg),
    bmi: bmi === null ? 'not provided' : bmi,
    bmiCategory: bmiCategory(bmi),
    bodyType: bd.bodyType ? (BODY_TYPE_LABELS[bd.bodyType] || bd.bodyType) : 'not provided',
    medicalConditions: conditionsList.length ? conditionsList : 'none reported',
    medications: (profile?.healthInfo?.medications || []).length ? profile.healthInfo.medications : 'none reported',
    allergiesAndRestrictions: (profile?.healthInfo?.allergies || []).length ? profile.healthInfo.allergies : 'none reported',
    activityLevel: na(profile?.lifestyle?.activityLevel),
    sleep: `${na(profile?.lifestyle?.sleepHours)} hours, quality: ${na(profile?.lifestyle?.sleepQuality)}`,
    stressLevel: na(profile?.lifestyle?.stressLevel),
    exerciseHabits: na(profile?.lifestyle?.exerciseHabits),
    workRoutine: na(profile?.lifestyle?.workRoutine),
    dietType: na(profile?.foodHabits?.dietType),
    regionalPreference: regionalLabel,
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

  const regionalDirective = regionalKey !== 'no_preference'
    ? `\n\nREGIONAL CUISINE HARMONIZATION MANDATE:\n` +
      `The patient strongly prefers "${regionalLabel}". You MUST design authentic breakfast, lunch, and dinner dishes conforming to this regional culinary tradition while modifying them for strict Ayurvedic compatibility with the patient's dominant dosha (${dosha.primaryDosha}) and health conditions. In summary.regionalPreference, record "${regionalKey.replace('_', ' ')}". In explanation.regionalAdaptationReasoning, clearly explain how this cuisine was adapted for their dosha. In foodsToAvoid.regionalDishesToAvoid, list 2-4 popular regional dishes of this cuisine that this patient must strictly avoid or modify.`
    : `\n\nIn explanation.regionalAdaptationReasoning, explain the general Ayurvedic cuisine principles applied.`;

  return (
    `You are an Ayurvedic nutrition assistant generating a personalized diet plan for a patient. ` +
    `Every recommendation must be explainable and connect to the patient's specific dosha, medical ` +
    `conditions, or season -- never a generic food list. Strictly avoid any item listed in the ` +
    `patient's allergies/restrictions or disliked foods. Respect their diet type (e.g. vegetarian) ` +
    `absolutely.${monsoonNote}${regionalDirective}\n\n` +
    `PATIENT PROFILE:\n${JSON.stringify(patientBlock, null, 2)}\n\n` +
    `DOSHA (PRAKRITI) ASSESSMENT:\n${JSON.stringify(doshaBlock, null, 2)}\n\n` +
    `Generate a complete 7-day plan (Monday through Sunday, all 7 required), cooking instructions, ` +
    `foods to avoid (separately reasoned by dosha, medical condition, season, and regional cuisine), and lifestyle ` +
    `recommendations, following the response schema exactly.`
  );
}

async function generateWithGemini(prompt, schema = DIET_PLAN_SCHEMA) {
  const { GoogleGenAI } = require('@google/genai');
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { const e = new Error('GEMINI_API_KEY is not set'); e.code = 'NO_KEY'; throw e; }

  const ai = new GoogleGenAI({ apiKey });
  let resp;
  try {
    resp = await ai.models.generateContent({
      model: AYURVEDA_DIET_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0.4 },
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
      regionalPreference: clampStr(summary.regionalPreference, 100),
    },
    explanation: {
      doshaBalanceReasoning: clampStr(explanation.doshaBalanceReasoning, 800),
      medicalConditionReasoning: clampStr(explanation.medicalConditionReasoning, 800),
      seasonalReasoning: clampStr(explanation.seasonalReasoning, 800),
      regionalAdaptationReasoning: clampStr(explanation.regionalAdaptationReasoning, 800),
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
      regionalDishesToAvoid: clampArr(avoid.regionalDishesToAvoid, 15, 150),
    },
    lifestyleRecommendations: clampArr(raw.lifestyleRecommendations, 15, 250),
  };
}

function sanitizeRecipe(raw) {
  if (!raw || typeof raw !== 'object') raw = {};
  return {
    dishName: clampStr(raw.dishName, 150) || 'Ayurvedic Meal Recipe',
    prepTimeMinutes: typeof raw.prepTimeMinutes === 'number' ? raw.prepTimeMinutes : 10,
    cookTimeMinutes: typeof raw.cookTimeMinutes === 'number' ? raw.cookTimeMinutes : 15,
    servings: clampStr(raw.servings, 50) || '1 serving',
    ingredients: (Array.isArray(raw.ingredients) ? raw.ingredients : []).slice(0, 20).map((ing) => ({
      item: clampStr(ing?.item, 150),
      ayurvedicRole: clampStr(ing?.ayurvedicRole, 150),
    })).filter((ing) => ing.item),
    steps: clampArr(raw.steps, 15, 400),
    ayurvedicBenefits: clampStr(raw.ayurvedicBenefits, 800),
    cookingTips: clampArr(raw.cookingTips, 10, 300),
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
    raw = await generateWithGemini(prompt, DIET_PLAN_SCHEMA);
  } else {
    const e = new Error(`Ayurveda diet provider '${AYURVEDA_DIET_PROVIDER}' is not implemented`);
    e.code = 'PROVIDER_UNIMPLEMENTED';
    throw e;
  }

  return sanitizePlan(raw);
}

/**
 * On-demand Ayurvedic recipe and preparation generator for a specific meal.
 */
async function generateMealRecipe({ mealContext, items, portion, day, dosha, healthInfo, lang = 'en', regionalPreference }) {
  if (!AYURVEDA_DIET_ENABLED) { const e = new Error('AI diet planning is disabled'); e.code = 'DISABLED'; throw e; }

  const isHindi = lang === 'hi';
  const foodList = Array.isArray(items) ? items.join(', ') : (items || 'Ayurvedic Dish');
  const conditions = healthInfo?.conditions || {};
  const conditionsList = [
    conditions.diabetes && 'diabetes',
    conditions.highBP && 'high blood pressure',
    conditions.obesityFocus && 'weight management focus',
    conditions.skinDisease && 'skin disease',
    conditions.jointPainArthritis && 'joint pain / arthritis',
    conditions.digestiveIssues && 'digestive issues (GERD/gastritis)',
    conditions.respiratoryIssues && 'respiratory issues',
    ...(conditions.other || []),
  ].filter(Boolean);

  const prompt = (
    `You are an expert Ayurvedic chef and certified Vaidya (Ayurvedic nutritionist). ` +
    `Provide an authentic, therapeutic, and easy-to-follow Ayurvedic cooking recipe with step-by-step preparation instructions for this specific meal:\n\n` +
    `MEAL DETAILS:\n` +
    `- Meal Type: ${mealContext || 'Meal'}${day ? ` (${day})` : ''}\n` +
    `- Food Item(s): ${foodList}\n` +
    `- Recommended Portion: ${portion || '1 serving'}\n` +
    `- Patient's Dominant Dosha: ${dosha?.primaryDosha || 'Tridoshic'}${dosha?.secondaryDosha ? ` / ${dosha.secondaryDosha}` : ''}\n` +
    `- Medical Health Considerations: ${conditionsList.length ? conditionsList.join(', ') : 'General Wellness'}\n` +
    `- Allergies & Foods to Avoid: ${(healthInfo?.allergies || []).join(', ') || 'None reported'}\n` +
    (regionalPreference ? `- Regional Cuisine Preference: ${regionalPreference}\n` : '') +
    `\nRECIPE REQUIREMENTS:\n` +
    `1. Provide realistic prep time (prepTimeMinutes) and cooking time (cookTimeMinutes).\n` +
    `2. List key ingredients with exact measurements and their Ayurvedic health role (e.g. "digestive fire booster", "tridoshic protein", "cooling herb").\n` +
    `3. Provide clear, numbered step-by-step cooking method following authentic Ayurvedic principles (e.g. tempering with digestive spices like jeera/turmeric/hing in cow's ghee/sesame oil, gentle boiling/simmering, avoiding reheating honey).\n` +
    `4. In ayurvedicBenefits, clearly explain why this preparation balances the patient's dosha (${dosha?.primaryDosha || 'doshas'}) and kindles digestive fire (Agni).\n` +
    `5. In cookingTips, provide 1-3 practical Ayurvedic kitchen tips (e.g. ideal meal timing, temperature, what to avoid eating together).\n` +
    (isHindi ? `6. Return all text, dish name, ingredients, and instructions in natural Hindi (Devanagari script).\n` : `6. Return all text in English.\n`) +
    `7. Output strictly valid JSON matching the schema.`
  );

  let raw;
  if (AYURVEDA_DIET_PROVIDER === 'gemini') {
    raw = await generateWithGemini(prompt, RECIPE_SCHEMA);
  } else {
    const e = new Error(`Ayurveda diet provider '${AYURVEDA_DIET_PROVIDER}' is not implemented`);
    e.code = 'PROVIDER_UNIMPLEMENTED';
    throw e;
  }

  return sanitizeRecipe(raw);
}

/**
 * Translates an existing diet plan JSON into authentic Hindi while maintaining schema compatibility.
 */
async function translateDietPlanToHindi(dietPlan) {
  if (!dietPlan) return null;
  if (!AYURVEDA_DIET_ENABLED) return null;

  const prompt = `You are a certified Ayurvedic practitioner and translator. Translate the following Ayurvedic diet plan JSON from English to clear, natural, and authentic Hindi (Devanagari script).

CRITICAL INSTRUCTIONS:
1. Maintain the EXACT same JSON structure and keys as required by the schema.
2. The day field in weeklyPlan must remain one of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].
3. Translate all meal items (e.g. "Warm quinoa porridge with cinnamon" -> "दालचीनी युक्त गर्म किनोआ दलिया", "Moong dal soup" -> "मूंग दाल सूप"), portions (e.g. "1 bowl" -> "1 कटोरी", "1 cup" -> "1 कप", "1 plate" -> "1 प्लेट", "1 small handful" -> "1 छोटी मुट्ठी"), and Ayurvedic purpose strings into natural Hindi.
4. Translate cooking instructions, spices, combinations, foods to avoid, and lifestyle recommendations into natural Hindi.
5. Translate summary and explanations into natural Hindi.
6. Return only valid JSON matching the schema.

DIET PLAN TO TRANSLATE:
${JSON.stringify({
    summary: dietPlan.summary,
    explanation: dietPlan.explanation,
    weeklyPlan: dietPlan.weeklyPlan,
    cookingInstructions: dietPlan.cookingInstructions,
    foodsToAvoid: dietPlan.foodsToAvoid,
    lifestyleRecommendations: dietPlan.lifestyleRecommendations,
}, null, 2)}`;

  let raw;
  if (AYURVEDA_DIET_PROVIDER === 'gemini') {
    raw = await generateWithGemini(prompt, DIET_PLAN_SCHEMA);
  } else {
    return null;
  }

  return sanitizePlan(raw);
}

module.exports = { generateDietPlan, generateMealRecipe, translateDietPlanToHindi, computeBmi, bmiCategory };

