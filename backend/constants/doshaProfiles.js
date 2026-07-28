// Static, deterministic Ayurveda dosha content -- keyed by primary dosha.
// Rendered by the API alongside a patient's calculated scores. No AI
// involved here: dosha theory is fixed reference content, not something to
// hallucinate per-request the way the diet plan's day-to-day items are.

const DOSHA_INFO = {
    VATA: {
        title: "Vata",
        element: "Air & Space",
        explanation:
            "Vata governs movement, breathing, circulation, and the nervous system. It is the driving force behind all bodily activity.",
        characteristics: [
            "Thin or light body frame, tends to lose weight easily",
            "Dry skin and hair",
            "Cold hands and feet, prefers warmth",
            "Variable appetite and digestion",
            "Light or interrupted sleep",
            "Quick thinker, learns fast but forgets fast",
            "Enthusiastic and creative, but prone to anxiety when imbalanced",
        ],
        possibleImbalances: [
            "Anxiety, restlessness, or racing thoughts",
            "Irregular digestion, bloating, gas, constipation",
            "Dry skin, joint discomfort",
            "Disturbed or insufficient sleep",
            "Fatigue from overexertion",
        ],
        lifestyleRecommendations: [
            "Keep a regular daily routine, especially meal and sleep timings",
            "Favor warm, cooked, moist, and lightly oiled foods",
            "Stay warm; avoid excess cold, wind, and dry environments",
            "Practice calming routines -- gentle yoga, meditation, warm oil self-massage",
            "Avoid excessive fasting, overstimulation, and irregular schedules",
        ],
    },
    PITTA: {
        title: "Pitta",
        element: "Fire & Water",
        explanation:
            "Pitta governs digestion, metabolism, and transformation -- including how the body processes food and how the mind processes information.",
        characteristics: [
            "Medium, athletic build",
            "Warm body, sweats easily",
            "Sharp appetite, strong digestion",
            "Sensitive or rash-prone skin",
            "Sharp intellect, good focus, natural leader",
            "Ambitious and competitive, can become irritable under stress",
        ],
        possibleImbalances: [
            "Acidity, heartburn, or excess body heat",
            "Skin irritation, rashes, or inflammation",
            "Irritability, anger, or impatience",
            "Excessive hunger or overeating when stressed",
        ],
        lifestyleRecommendations: [
            "Favor cooling, mildly spiced, and hydrating foods",
            "Avoid excessive heat, sun exposure, and skipping meals",
            "Build in downtime -- avoid overworking or overscheduling",
            "Practice moderation; avoid excess alcohol, caffeine, and fried food",
            "Cooling activities like swimming or evening walks help balance excess heat",
        ],
    },
    KAPHA: {
        title: "Kapha",
        element: "Earth & Water",
        explanation:
            "Kapha governs structure, stability, and lubrication in the body. It provides strength, immunity, and emotional calm.",
        characteristics: [
            "Solid, well-built body frame, gains weight easily",
            "Smooth, soft, slightly oily skin",
            "Thick hair",
            "Slow but steady digestion",
            "Calm, steady, and affectionate temperament",
            "Deep sleeper, good stamina, resistant to sudden change",
        ],
        possibleImbalances: [
            "Weight gain, sluggish digestion",
            "Lethargy, low motivation, oversleeping",
            "Congestion or heaviness",
            "Attachment or resistance to change",
        ],
        lifestyleRecommendations: [
            "Favor light, warm, and spiced foods; minimize heavy, oily, sugary foods",
            "Stay physically active -- regular vigorous exercise is important",
            "Avoid daytime sleeping and excessive rest",
            "Seek variety and stimulation to counter inertia",
            "Wake early and keep an energizing morning routine",
        ],
    },
};

const THIRD_DOSHA_LABEL = {
    Balanced: "in balance",
    Low: "low relative to your other doshas",
    Elevated: "somewhat elevated alongside your dominant dosha",
};

/**
 * @param {'VATA'|'PITTA'|'KAPHA'} primaryDosha
 * @param {'VATA'|'PITTA'|'KAPHA'|null} secondaryDosha
 * @returns {object} combined profile info for API responses
 */
function getDoshaProfile(primaryDosha, secondaryDosha) {
    const primary = DOSHA_INFO[primaryDosha] || null;
    const secondary = secondaryDosha ? DOSHA_INFO[secondaryDosha] : null;
    return { primary, secondary };
}

module.exports = { DOSHA_INFO, THIRD_DOSHA_LABEL, getDoshaProfile };
