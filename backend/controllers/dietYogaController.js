// controllers/dietYogaController.js
const DietYoga = require("../models/DietYoga");
const Booking = require("../models/Booking");
const Patient = require("../models/Patient");
const AyurvedaWellnessProfile = require("../models/AyurvedaWellnessProfile");
const AyurvedaDoshaAssessment = require("../models/AyurvedaDoshaAssessment");
const { generateYogaPlan: generateYogaPlanAi } = require("../services/ayurvedaYoga/yogaPlanService");
const { fetchYouTubeVideos } = require("../services/youtubeService");

function mapYogaServiceErrorToStatus(res, error) {
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
// patient never sees a yoga recommendation with no video to follow along to.
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
			results.push({ ...asana, link });
		} catch (e) {
			results.push(asana);
		}
	}
	return results;
}

// Create new diet recommendation
exports.prescribeDiet = async (req, res) => {
	const {
		bookingId,
		dietPlan
	} = req.body;

	try {
		// 1. Validate required fields upfront
		if (!bookingId || !dietPlan) {
			return res.status(400).json({
				message: "Missing required fields: bookingId and dietPlan are required."
			});
		}

		// 2. Check if the booking exists
		const booking = await Booking.findById(bookingId);
		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}

		if (booking.doctorId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Forbidden: You are not the assigned doctor for this booking." });
		}

		// 2. Check if diet yoga recommendation already exists for this booking
		let dietYoga = await DietYoga.findOne({ bookingId: bookingId });

		const isUpdate = !!dietYoga;

		if (dietYoga) {
			dietYoga.diet = dietPlan;
			// C5-6: Derive IDs securely
			dietYoga.doctor = req.user._id;
			dietYoga.patient = booking.patientId;
			dietYoga.updatedAt = Date.now();

			await dietYoga.save();
		} else {
			// --- CREATE NEW RECORD ---

			dietYoga = new DietYoga({
				bookingId: bookingId,
				// C5-6: Derive IDs securely
				patient: booking.patientId,
				doctor: req.user._id,
				diet: dietPlan
			});

			await dietYoga.save();
		}

		// Silent save — the patient is notified only when the doctor presses
		// "Notify patient" on the prescribe page (POST /bookings/:id/notify-prescription).
		return res.status(isUpdate ? 200 : 201).json({
			message: `Diet recommendations ${isUpdate ? 'updated' : 'created'} successfully`,
			dietYoga
		});

	} catch (error) {
		console.error("Error creating/updating diet:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Doctor saves a yoga plan draft. Never visible to the patient by itself --
// draft.morning/evening only overwrite the live yoga.morning/evening (which
// the patient reads) once publishYogaDraft() runs, fired by "Submit
// Prescription".
exports.prescribeYoga = async (req, res) => {
	const { bookingId, yogaPlan } = req.body;

	try {
		if (!bookingId || !yogaPlan) {
			return res.status(400).json({ error: "Booking ID and Yoga Plan are required" });
		}

		const booking = await Booking.findById(bookingId);
		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}

		if (booking.doctorId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Forbidden: You are not the assigned doctor for this booking." });
		}

		// Fill in any asana missing a doctor-supplied link before saving --
		// the doctor's own link (if provided) always wins over auto-fetch.
		const videoAutoFetched = [];
		const morning = await fillMissingVideoLinks(yogaPlan.morning, videoAutoFetched);
		const evening = await fillMissingVideoLinks(yogaPlan.evening, videoAutoFetched);

		const dietYoga = await DietYoga.findOneAndUpdate(
			{ bookingId: bookingId },
			{
				$set: {
					patient: booking.patientId, // C5-6: derive securely
					doctor: req.user._id,       // C5-6: derive securely
					"yoga.draft.morning": morning,
					"yoga.draft.evening": evening,
					"yoga.videoAutoFetched": videoAutoFetched,
					updatedAt: Date.now()
				},
				$push: {
					"yoga.history": {
						$each: [{
							changedAt: new Date(),
							changedBy: req.user._id,
							action: "edited",
							snapshot: { morning, evening },
						}],
						$slice: -10,
					}
				}
			},
			{
				new: true,
				upsert: true,
				setDefaultsOnInsert: true
			}
		);
		dietYoga.yoga.draft.updatedAt = new Date();
		await dietYoga.save();

		return res.status(200).json({
			message: "Yoga plan draft saved",
			dietYoga
		});

	} catch (error) {
		console.error("Error prescribing yoga:", error);
		return res.status(500).json({ error: "Server error", details: error.message });
	}
};

// Copies the doctor's yoga draft into the live morning/evening/status fields
// the patient reads, then clears the draft. Called by publishPrescription()
// when the doctor hits "Submit Prescription". No-op if there's no draft.
exports.publishYogaDraft = async (bookingId, doctorId) => {
	const dietYoga = await DietYoga.findOne({ bookingId });
	if (!dietYoga) return null;
	const draft = dietYoga.yoga?.draft;
	if (!draft || (!draft.morning?.length && !draft.evening?.length)) return dietYoga;

	const wasAiOrigin = dietYoga.yoga.status === "ai" || dietYoga.yoga.status === "ai_modified";
	dietYoga.yoga.morning = draft.morning || [];
	dietYoga.yoga.evening = draft.evening || [];
	dietYoga.yoga.status = wasAiOrigin ? "doctor_approved" : "doctor";
	dietYoga.yoga.draft = { morning: [], evening: [], updatedAt: undefined };
	dietYoga.yoga.history = dietYoga.yoga.history || [];
	dietYoga.yoga.history.push({
		changedAt: new Date(),
		changedBy: doctorId,
		action: "approved",
		snapshot: { morning: dietYoga.yoga.morning, evening: dietYoga.yoga.evening },
	});
	if (dietYoga.yoga.history.length > 10) dietYoga.yoga.history = dietYoga.yoga.history.slice(-10);
	await dietYoga.save();
	return dietYoga;
};

// Auto-generate a yoga recommendation using the AI model when the doctor
// hasn't provided one yet, seeded from the patient's wellness form + dosha
// assessment + reported conditions. Doctor reviews/edits/approves afterward
// via the normal prescribeYoga call.
exports.generateYogaPlan = async (req, res) => {
	const { bookingId } = req.body;
	try {
		if (!bookingId) return res.status(400).json({ error: "bookingId is required" });

		const booking = await Booking.findById(bookingId);
		if (!booking) return res.status(404).json({ error: "Booking not found" });
		if (booking.doctorId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Forbidden: You are not the assigned doctor for this booking." });
		}

		const patientId = booking.patientId;
		const [profile, dosha, patient] = await Promise.all([
			AyurvedaWellnessProfile.findOne({ patientId }),
			AyurvedaDoshaAssessment.findOne({ patientId }),
			Patient.findById(patientId),
		]);

		const conditions = [booking.patientIllness, booking.diagnosis].filter(Boolean);

		const planFields = await generateYogaPlanAi({
			profile,
			dosha,
			patient: { age: patient?.age, gender: patient?.gender },
			conditions,
		});

		// AI service returns { name, purpose, durationMinutes, link } -- only
		// name/link are persisted.
		const stripToNameLink = (list) => (list || []).map((a) => ({ name: a.name, link: a.link }));

		const videoAutoFetched = [];
		const morning = await fillMissingVideoLinks(stripToNameLink(planFields.morning), videoAutoFetched);
		const evening = await fillMissingVideoLinks(stripToNameLink(planFields.evening), videoAutoFetched);

		const dietYoga = await DietYoga.findOneAndUpdate(
			{ bookingId },
			{
				$set: {
					patient: patientId,
					doctor: req.user._id,
					"yoga.morning": morning,
					"yoga.evening": evening,
					"yoga.status": "ai",
					"yoga.aiGenerated": true,
					"yoga.aiGeneratedAt": new Date(),
					"yoga.videoAutoFetched": videoAutoFetched,
					updatedAt: Date.now(),
				},
				$push: {
					"yoga.history": {
						$each: [{
							changedAt: new Date(),
							changedBy: req.user._id,
							action: "ai_generated",
							snapshot: { morning, evening },
						}],
						$slice: -10,
					}
				}
			},
			{ new: true, upsert: true, setDefaultsOnInsert: true }
		);

		return res.status(200).json({ message: "AI yoga plan generated", dietYoga });
	} catch (error) {
		return mapYogaServiceErrorToStatus(res, error);
	}
};

// Doctor-facing preview lookup: suggest candidate videos for a single asana
// name before saving, so the doctor can pick rather than rely purely on the
// silent auto-fetch that happens at save time.
exports.suggestYogaVideo = async (req, res) => {
	const { asanaName } = req.body;
	try {
		if (!asanaName) return res.status(400).json({ error: "asanaName is required" });
		const result = await fetchYouTubeVideos(`${asanaName} yoga asana tutorial correct technique`, asanaName);
		return res.status(200).json(result);
	} catch (error) {
		console.error("Error suggesting yoga video:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Get diet and yoga recommendation by booking ID
exports.getDietYogaByBooking = async (req, res) => {
	const { bookingId } = req.params;

	try {
		const dietYoga = await DietYoga.findOne({ bookingId });

		if (!dietYoga) {
			return res.status(404).json({ message: "No diet and yoga recommendations found for this booking" });
		}
		if (req.user.role !== 'admin' && dietYoga.patient.toString() !== req.user._id.toString() && dietYoga.doctor.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Forbidden" });
		}

		return res.status(200).json({
			message: "Diet and yoga recommendations retrieved successfully",
			dietYoga
		});
	} catch (error) {
		console.error("Error fetching diet yoga:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Update diet recommendation
exports.updateDiet = async (req, res) => {
	const { id } = req.params;
	const { diet } = req.body;

	try {
		const dietYoga = await DietYoga.findById(id);

		if (!dietYoga) {
			return res.status(404).json({ error: "Diet and yoga recommendation not found" });
		}

		if (dietYoga.doctor.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Forbidden: Only the prescribing doctor can update this record." });
		}

		dietYoga.diet = diet;
		dietYoga.updatedAt = Date.now();

		await dietYoga.save();

		return res.status(200).json({
			message: "Diet recommendations updated successfully",
			dietYoga
		});
	} catch (error) {
		console.error("Error updating diet:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Update yoga recommendation
exports.updateYoga = async (req, res) => {
	const { id } = req.params;
	const { yoga } = req.body;

	try {
		const dietYoga = await DietYoga.findById(id);

		if (!dietYoga) {
			return res.status(404).json({ error: "Diet and yoga recommendation not found" });
		}

		if (dietYoga.doctor.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Forbidden: Only the prescribing doctor can update this record." });
		}

		dietYoga.yoga = yoga;
		dietYoga.updatedAt = Date.now();

		await dietYoga.save();

		return res.status(200).json({
			message: "Yoga recommendations updated successfully",
			dietYoga
		});
	} catch (error) {
		console.error("Error updating yoga:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Add this new function to fetch diet and yoga by patient email
exports.getDietYogaByPatientEmail = async (req, res) => {
	const { patientEmail } = req.params;

	try {
		const patient = await Patient.findOne({ email: patientEmail });
		if (!patient) {
			return res.status(404).json({ message: "Patient not found with the given email." });
		}

		const dietYoga = await DietYoga.findOne({ patient: patient._id });
		if (!dietYoga) {
			return res.status(404).json({ message: "No diet and yoga recommendations found for this patient." });
		}
		if (req.user.role !== 'admin' && dietYoga.patient.toString() !== req.user._id.toString() && dietYoga.doctor.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Forbidden" });
		}

		return res.status(200).json({ diet: dietYoga.diet, yoga: dietYoga.yoga });
	} catch (error) {
		console.error("Error fetching diet and yoga by patient email:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Delete diet and yoga recommendation
exports.deleteDietYoga = async (req, res) => {
	const { id } = req.params;

	try {
		const dietYoga = await DietYoga.findById(id);
		if (!dietYoga) {
			return res.status(404).json({ error: "Diet and yoga recommendation not found" });
		}

		if (dietYoga.doctor.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Forbidden: Only the prescribing doctor can delete this record." });
		}

		await DietYoga.findByIdAndDelete(id);

		return res.status(200).json({ message: "Diet and yoga recommendation deleted successfully" });
	} catch (error) {
		console.error("Error deleting diet yoga:", error);
		return res.status(500).json({ error: "Server error" });
	}
};
