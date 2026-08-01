const AyurvedaWellnessProfile = require("../models/AyurvedaWellnessProfile");
const AyurvedaDoshaAssessment = require("../models/AyurvedaDoshaAssessment");
const AyurvedaDietPlan = require("../models/AyurvedaDietPlan");
const Patient = require("../models/Patient");
const Booking = require("../models/Booking");
const { getDoshaProfile } = require("../constants/doshaProfiles");
const { generateDietPlan } = require("../services/ayurvedaDiet/dietPlanService");
const { AYURVEDA_DIET_MODEL } = require("../services/ayurvedaDiet/config");

async function assertDoctorRelationship(req, patientId) {
    if (req.user.role === "admin") return true;
    if (req.user.role !== "doctor") return false;
    return Booking.exists({ doctorId: req.user._id, patientId });
}

// ---------------------------------------------------------------- Wellness profile

exports.upsertWellnessProfile = async (req, res) => {
    if (req.user.role !== "patient") {
        return res.status(403).json({ error: "Only patients can update their wellness profile." });
    }
    try {
        const { basicDetails, healthInfo, lifestyle, foodHabits, season } = req.body || {};
        const profile = await AyurvedaWellnessProfile.findOneAndUpdate(
            { patientId: req.user._id },
            { basicDetails, healthInfo, lifestyle, foodHabits, season },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
        return res.status(200).json({ message: "Wellness profile saved", profile });
    } catch (error) {
        console.error("Error saving wellness profile:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getWellnessProfile = async (req, res) => {
    try {
        const profile = await AyurvedaWellnessProfile.findOne({ patientId: req.user._id });
        return res.status(200).json(profile || null);
    } catch (error) {
        console.error("Error fetching wellness profile:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.getWellnessProfileForPatient = async (req, res) => {
    const { patientId } = req.params;
    try {
        const allowed = await assertDoctorRelationship(req, patientId);
        if (!allowed) return res.status(403).json({ error: "Access denied" });

        const profile = await AyurvedaWellnessProfile.findOne({ patientId });
        return res.status(200).json(profile || null);
    } catch (error) {
        console.error("Error fetching patient's wellness profile:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

// ---------------------------------------------------------------- Dosha assessment

exports.submitDoshaAssessment = async (req, res) => {
    if (req.user.role !== "patient") {
        return res.status(403).json({ error: "Only patients can submit an assessment." });
    }
    try {
        const { responses } = req.body; // [{ questionId, category, doshaType, score }]
        if (!Array.isArray(responses) || responses.length === 0) {
            return res.status(400).json({ error: "responses array is required" });
        }

        const totals = { vata: 0, pitta: 0, kapha: 0 };
        const counts = { vata: 0, pitta: 0, kapha: 0 };
        for (const r of responses) {
            if (!totals.hasOwnProperty(r.doshaType)) continue;
            totals[r.doshaType] += Number(r.score) || 0;
            counts[r.doshaType] += 1;
        }

        // Normalize each dosha to a 0-100 scale (max score per question is 4),
        // then express as a share of the combined total so the three add to ~100.
        const maxPossible = {
            vata: counts.vata * 4 || 1,
            pitta: counts.pitta * 4 || 1,
            kapha: counts.kapha * 4 || 1,
        };
        const normalized = {
            vata: (totals.vata / maxPossible.vata) * 100,
            pitta: (totals.pitta / maxPossible.pitta) * 100,
            kapha: (totals.kapha / maxPossible.kapha) * 100,
        };
        const sumNormalized = normalized.vata + normalized.pitta + normalized.kapha || 1;
        const calculatedScores = {
            vata: +((normalized.vata / sumNormalized) * 100).toFixed(1),
            pitta: +((normalized.pitta / sumNormalized) * 100).toFixed(1),
            kapha: +((normalized.kapha / sumNormalized) * 100).toFixed(1),
        };

        const sorted = Object.entries(calculatedScores).sort((a, b) => b[1] - a[1]);
        const primaryDosha = sorted[0][0].toUpperCase();
        const secondaryDosha = (sorted[0][1] - sorted[1][1] <= 15) ? sorted[1][0].toUpperCase() : null;
        const thirdScore = sorted[2][1];
        const thirdDoshaStatus = thirdScore < 20 ? "Low" : thirdScore > 40 ? "Elevated" : "Balanced";

        const assessment = await AyurvedaDoshaAssessment.findOneAndUpdate(
            { patientId: req.user._id },
            {
                responses,
                calculatedScores,
                primaryDosha,
                secondaryDosha,
                thirdDoshaStatus,
                isComplete: true,
            },
            { new: true, upsert: true, runValidators: true }
        );

        const doshaProfile = getDoshaProfile(assessment.primaryDosha, assessment.secondaryDosha);
        return res.status(200).json({ message: "Assessment saved", assessment: { ...assessment.toObject(), doshaProfile } });
    } catch (error) {
        console.error("Error saving dosha assessment:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getDoshaAssessment = async (req, res) => {
    try {
        const assessment = await AyurvedaDoshaAssessment.findOne({ patientId: req.user._id });
        if (!assessment) return res.status(200).json(null);
        const profile = getDoshaProfile(assessment.primaryDosha, assessment.secondaryDosha);
        return res.status(200).json({ ...assessment.toObject(), doshaProfile: profile });
    } catch (error) {
        console.error("Error fetching dosha assessment:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.getDoshaAssessmentForPatient = async (req, res) => {
    const { patientId } = req.params;
    try {
        const allowed = await assertDoctorRelationship(req, patientId);
        if (!allowed) return res.status(403).json({ error: "Access denied" });

        const assessment = await AyurvedaDoshaAssessment.findOne({ patientId });
        if (!assessment) return res.status(200).json(null);
        const profile = getDoshaProfile(assessment.primaryDosha, assessment.secondaryDosha);
        return res.status(200).json({ ...assessment.toObject(), doshaProfile: profile });
    } catch (error) {
        console.error("Error fetching patient's dosha assessment:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

// ---------------------------------------------------------------- Diet plan

function mapServiceErrorToStatus(res, error) {
    if (error.code === "MISSING_DOSHA") {
        return res.status(400).json({ message: "Complete the Prakriti (dosha) assessment before generating a diet plan." });
    }
    if (error.code === "DISABLED" || error.code === "NO_KEY" || error.code === "PROVIDER_UNIMPLEMENTED") {
        return res.status(503).json({ message: "AI diet planning is unavailable right now. Please try again later." });
    }
    if (error.code === "RATE_LIMIT") {
        return res.status(429).json({ message: "We're experiencing high traffic. Please wait a moment and try again." });
    }
    if (error.code === "JSON_PARSE_ERROR") {
        return res.status(500).json({ message: "AI response was hard to read. Please try generating again." });
    }
    console.error("AI diet plan generation failed:", error.message);
    return res.status(500).json({ message: "Couldn't generate the diet plan. Please try again." });
}

exports.generateDietPlan = async (req, res) => {
    try {
        const patientId = req.user.role === "patient" ? req.user._id : req.body.patientId;
        if (!patientId) return res.status(400).json({ error: "patientId is required" });

        if (req.user.role !== "patient") {
            const allowed = await assertDoctorRelationship(req, patientId);
            if (!allowed) return res.status(403).json({ error: "Access denied" });
        }

        const [patient, profile, dosha] = await Promise.all([
            Patient.findById(patientId),
            AyurvedaWellnessProfile.findOne({ patientId }),
            AyurvedaDoshaAssessment.findOne({ patientId }),
        ]);

        if (!patient) return res.status(404).json({ error: "Patient not found" });
        if (!dosha || !dosha.isComplete) {
            return res.status(400).json({ message: "Complete the Prakriti (dosha) assessment before generating a diet plan." });
        }

        const planFields = await generateDietPlan({
            profile: profile || null,
            dosha,
            patient: { age: patient.age, gender: patient.gender },
        });

        const plan = await AyurvedaDietPlan.findOneAndUpdate(
            { patientId },
            {
                wellnessProfileId: profile ? profile._id : null,
                doshaAssessmentId: dosha._id,
                basedOn: {
                    wellnessProfileUpdatedAt: profile ? profile.updatedAt : null,
                    doshaAssessmentUpdatedAt: dosha.updatedAt,
                },
                ...planFields,
                model: AYURVEDA_DIET_MODEL,
                generatedAt: new Date(),
            },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({ message: "Diet plan generated", plan });
    } catch (error) {
        return mapServiceErrorToStatus(res, error);
    }
};

async function attachStaleness(plan) {
    if (!plan) return null;
    const [profile, dosha] = await Promise.all([
        plan.wellnessProfileId ? AyurvedaWellnessProfile.findById(plan.wellnessProfileId) : null,
        plan.doshaAssessmentId ? AyurvedaDoshaAssessment.findById(plan.doshaAssessmentId) : null,
    ]);
    const profileChanged = profile && plan.basedOn?.wellnessProfileUpdatedAt
        && new Date(profile.updatedAt).getTime() !== new Date(plan.basedOn.wellnessProfileUpdatedAt).getTime();
    const doshaChanged = dosha && plan.basedOn?.doshaAssessmentUpdatedAt
        && new Date(dosha.updatedAt).getTime() !== new Date(plan.basedOn.doshaAssessmentUpdatedAt).getTime();
    return { ...plan.toObject(), isStale: Boolean(profileChanged || doshaChanged) };
}

exports.getDietPlan = async (req, res) => {
    try {
        const plan = await AyurvedaDietPlan.findOne({ patientId: req.user._id });
        return res.status(200).json(await attachStaleness(plan));
    } catch (error) {
        console.error("Error fetching diet plan:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.getDietPlanForPatient = async (req, res) => {
    const { patientId } = req.params;
    try {
        const allowed = await assertDoctorRelationship(req, patientId);
        if (!allowed) return res.status(403).json({ error: "Access denied" });

        const plan = await AyurvedaDietPlan.findOne({ patientId });
        return res.status(200).json(await attachStaleness(plan));
    } catch (error) {
        console.error("Error fetching patient's diet plan:", error);
        return res.status(500).json({ error: "Server error" });
    }
};
