const AyurvedaWellnessProfile = require("../models/AyurvedaWellnessProfile");
const AyurvedaDoshaAssessment = require("../models/AyurvedaDoshaAssessment");
const AyurvedaYogaPlan = require("../models/AyurvedaYogaPlan");
const Patient = require("../models/Patient");
const { assertDoctorRelationship, isProfileFilled } = require("./ayurvedaController");
const { generateYogaPlan: generateYogaPlanAi } = require("../services/ayurvedaYoga/yogaPlanService");
const { AYURVEDA_YOGA_MODEL } = require("../services/ayurvedaYoga/config");
const { fetchYouTubeVideos } = require("../services/youtubeService");

function mapServiceErrorToStatus(res, error) {
    if (error.code === "DISABLED" || error.code === "NO_KEY" || error.code === "PROVIDER_UNIMPLEMENTED") {
        return res.status(503).json({ message: "AI yoga planning is unavailable right now. Please try again later." });
    }
    if (error.code === "RATE_LIMIT") {
        return res.status(429).json({ message: "We're experiencing high traffic. Please wait a moment and try again." });
    }
    if (error.code === "JSON_PARSE_ERROR") {
        return res.status(500).json({ message: "AI response was hard to read. Please try generating again." });
    }
    console.error("AI yoga plan generation failed:", error.message);
    return res.status(500).json({ message: "Couldn't generate the yoga plan. Please try again." });
}

// For any asana missing a video link, auto-fetch one via YouTube so the
// patient never sees a recommendation with no video to follow along to.
async function fillMissingVideoLinks(asanas, autoFetchedNames) {
    const results = [];
    for (const asana of (asanas || [])) {
        if (asana.link) {
            results.push(asana);
            continue;
        }
        try {
            const { videos } = await fetchYouTubeVideos(`${asana.name} yoga asana tutorial correct technique`, asana.name);
            const link = videos?.[0]?.link || "";
            if (link) autoFetchedNames.push(asana.name);
            results.push({ name: asana.name, link });
        } catch (e) {
            results.push({ name: asana.name, link: "" });
        }
    }
    return results;
}

// Patient generates their own AI yoga plan from their Prakriti + wellness
// profile -- same gating and pattern as generateDietPlan in
// ayurvedaController.js. A doctor can view/edit/approve it afterward via
// reviewYogaPlan, exactly like the diet plan.
exports.generateYogaPlan = async (req, res) => {
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
            return res.status(400).json({ message: "Complete the Prakriti (dosha) assessment before generating a yoga plan." });
        }
        if (!isProfileFilled(profile)) {
            return res.status(400).json({ message: "Complete your wellness profile before generating a yoga plan." });
        }

        const planFields = await generateYogaPlanAi({
            profile,
            dosha,
            patient: { age: patient.age, gender: patient.gender },
            conditions: [],
        });

        const videoAutoFetched = [];
        const morning = await fillMissingVideoLinks(planFields.morning, videoAutoFetched);
        const evening = await fillMissingVideoLinks(planFields.evening, videoAutoFetched);

        // findOneAndUpdate here is a full replacement, so every field --
        // including history/status/doctorReview -- must be spelled out
        // explicitly or it's dropped. Doctor input is always first-class:
        // once a doctor has reviewed this plan (draft or published), a
        // regenerate never discards that review -- only the underlying raw
        // AI fields refresh. Mirrors generateDietPlan exactly.
        const existing = await AyurvedaYogaPlan.findOne({ patientId });
        const hasDoctorReview = Boolean(existing?.doctorReview?.reviewedAt);
        let history = existing?.history ? existing.history.map((h) => (h.toObject ? h.toObject() : h)) : [];
        history.push({
            changedAt: new Date(),
            action: hasDoctorReview ? "replaced" : "ai_generated",
            snapshot: { morning, evening },
        });
        if (history.length > 10) history = history.slice(-10);

        const plan = await AyurvedaYogaPlan.findOneAndUpdate(
            { patientId },
            {
                wellnessProfileId: profile ? profile._id : null,
                doshaAssessmentId: dosha._id,
                basedOn: {
                    wellnessProfileUpdatedAt: profile ? profile.updatedAt : null,
                    doshaAssessmentUpdatedAt: dosha.updatedAt,
                },
                summary: planFields.summary,
                morning,
                evening,
                videoAutoFetched,
                model: AYURVEDA_YOGA_MODEL,
                generatedAt: new Date(),
                status: hasDoctorReview ? existing.status : "ai",
                doctorReview: hasDoctorReview ? existing.doctorReview : {},
                history,
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json({ message: "Yoga plan generated", plan });
    } catch (error) {
        return mapServiceErrorToStatus(res, error);
    }
};

// AI-vs-doctor provenance resolution -- identical rule to resolveDisplayPlan
// in ayurvedaController.js: once a doctor's review is published, it wins.
function resolveDisplayYogaPlan(plan) {
    const status = plan.status || "ai";
    const reviewPublished = Boolean(plan.doctorReview?.published);
    if ((status === "ai_modified" || status === "doctor_approved") && reviewPublished) {
        const dr = plan.doctorReview || {};
        return { summary: plan.summary, morning: dr.morning, evening: dr.evening };
    }
    return { summary: plan.summary, morning: plan.morning, evening: plan.evening };
}

async function attachStaleness(plan, { includeHistory = false } = {}) {
    if (!plan) return null;
    const [profile, dosha] = await Promise.all([
        plan.wellnessProfileId ? AyurvedaWellnessProfile.findById(plan.wellnessProfileId) : null,
        plan.doshaAssessmentId ? AyurvedaDoshaAssessment.findById(plan.doshaAssessmentId) : null,
    ]);
    const profileChanged = profile && plan.basedOn?.wellnessProfileUpdatedAt
        && new Date(profile.updatedAt).getTime() !== new Date(plan.basedOn.wellnessProfileUpdatedAt).getTime();
    const doshaChanged = dosha && plan.basedOn?.doshaAssessmentUpdatedAt
        && new Date(dosha.updatedAt).getTime() !== new Date(plan.basedOn.doshaAssessmentUpdatedAt).getTime();
    const obj = plan.toObject();
    if (!includeHistory) delete obj.history;
    return { ...obj, isStale: Boolean(profileChanged || doshaChanged), displayPlan: resolveDisplayYogaPlan(obj) };
}

exports.getYogaPlan = async (req, res) => {
    try {
        const plan = await AyurvedaYogaPlan.findOne({ patientId: req.user._id });
        return res.status(200).json(await attachStaleness(plan));
    } catch (error) {
        console.error("Error fetching yoga plan:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.getYogaPlanForPatient = async (req, res) => {
    const { patientId } = req.params;
    try {
        const allowed = await assertDoctorRelationship(req, patientId);
        if (!allowed) return res.status(403).json({ error: "Access denied" });

        const plan = await AyurvedaYogaPlan.findOne({ patientId });
        return res.status(200).json(await attachStaleness(plan, { includeHistory: true }));
    } catch (error) {
        console.error("Error fetching patient's yoga plan:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

// Doctor saves a review: a silent draft (never visible to the patient) until
// publishYogaPlanForPatient() runs via "Submit Prescription". Auto-fills any
// asana missing a video link (doctor's own link always wins over auto-fetch).
exports.reviewYogaPlan = async (req, res) => {
    const { patientId } = req.params;
    try {
        const allowed = await assertDoctorRelationship(req, patientId);
        if (!allowed) return res.status(403).json({ error: "Access denied" });

        const { bookingId, morning, evening, notes } = req.body || {};
        const plan = await AyurvedaYogaPlan.findOne({ patientId });
        if (!plan) return res.status(404).json({ error: "No AI yoga plan exists for this patient yet." });

        const hasExistingReview = plan.doctorReview && plan.doctorReview.reviewedAt;
        const base = hasExistingReview ? plan.doctorReview : { morning: plan.morning, evening: plan.evening };

        const videoAutoFetched = plan.videoAutoFetched || [];
        const filledMorning = morning ? await fillMissingVideoLinks(morning, videoAutoFetched) : base.morning;
        const filledEvening = evening ? await fillMissingVideoLinks(evening, videoAutoFetched) : base.evening;

        plan.doctorReview = {
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            bookingId: bookingId || plan.doctorReview?.bookingId,
            morning: filledMorning,
            evening: filledEvening,
            notes: notes !== undefined ? notes : plan.doctorReview?.notes,
            published: false,
        };
        plan.status = "ai_modified";
        plan.videoAutoFetched = videoAutoFetched;

        const snapshot = plan.doctorReview.toObject ? plan.doctorReview.toObject() : plan.doctorReview;
        plan.history = plan.history || [];
        plan.history.push({ changedAt: new Date(), changedBy: req.user._id, action: "edited", snapshot });
        if (plan.history.length > 10) plan.history = plan.history.slice(-10);

        await plan.save();
        return res.status(200).json({ message: "Yoga plan draft saved", plan: await attachStaleness(plan, { includeHistory: true }) });
    } catch (error) {
        console.error("Error reviewing yoga plan:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

// Copies the doctor's unpublished review into published:true + status
// doctor_approved, making it visible to the patient. Called by
// bookingController's "Submit Prescription". No-op if there's nothing to
// publish (mirrors AyurvedaDietPlan's inline publish logic).
exports.publishYogaPlanForPatient = async (patientId) => {
    const plan = await AyurvedaYogaPlan.findOne({ patientId });
    if (!plan?.doctorReview?.reviewedAt || plan.doctorReview.published) return plan;
    plan.doctorReview.published = true;
    plan.status = "doctor_approved";
    await plan.save();
    return plan;
};

exports.deleteYogaPlan = async (req, res) => {
    if (req.user.role !== "patient") {
        return res.status(403).json({ message: "Only patients can delete their yoga plan." });
    }
    try {
        await AyurvedaYogaPlan.deleteOne({ patientId: req.user._id });
        return res.status(200).json({ message: "Yoga plan deleted" });
    } catch (error) {
        console.error("Error deleting yoga plan:", error);
        return res.status(500).json({ error: "Server error" });
    }
};
