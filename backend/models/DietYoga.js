// models/DietYoga.js
const mongoose = require("mongoose");
const { CONTENT_SOURCE_VALUES } = require("../constants/contentSource");

const dietYogaSchema = new mongoose.Schema({
	patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
	doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
	
	diet: {
		weekly: {
			monday: {
				breakfast: { type: String},
				lunch: { type: String},
				dinner: { type: String},
				juices: { type: String}
			},	
			tuesday: {
				breakfast: { type: String},
				lunch: { type: String},
				dinner: { type: String},
				juices: { type: String}
			},
			wednesday: {
				breakfast: { type: String},
				lunch: { type: String},
				dinner: { type: String},
				juices: { type: String}
			},
			thursday: {
				breakfast: { type: String},
				lunch: { type: String},
				dinner: { type: String},
				juices: { type: String}
			},
			friday: {
				breakfast: { type: String},
				lunch: { type: String},
				dinner: { type: String},
				juices: { type: String}
			},
			saturday: {
				breakfast: { type: String},
				lunch: { type: String},
				dinner: { type: String},
				juices: { type: String}
			},
			sunday: {
				breakfast: { type: String},
				lunch: { type: String},
				dinner: { type: String},
				juices: { type: String}
			}
		},
		herbs: [String]
	},
	// Yoga recommendations
    yoga: {
        morning: [{
            name: { type: String, required: true },
            link: { type: String, default: "" }
        }],
        evening: [{
            name: { type: String, required: true },
            link: { type: String, default: "" }
        }],
        // Defaults to 'doctor' so existing records (all doctor-authored,
        // pre-dating AI generation) keep their correct provenance.
        status: { type: String, enum: CONTENT_SOURCE_VALUES, default: "doctor" },
        aiGenerated: { type: Boolean, default: false },
        aiGeneratedAt: { type: Date },
        // Asana names whose video link came from the YouTube auto-fetch
        // rather than the doctor, for internal audit/badge purposes.
        videoAutoFetched: { type: [String], default: [] },
        // Doctor's work-in-progress edits, invisible to the patient until
        // "Submit Prescription" copies it into morning/evening/status above.
        draft: {
            morning: [{ name: String, link: String }],
            evening: [{ name: String, link: String }],
            updatedAt: { type: Date },
        },
        history: [{
            changedAt: { type: Date, default: Date.now },
            changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
            action: { type: String, enum: ["ai_generated", "edited", "approved", "replaced"] },
            snapshot: {
                morning: [{ name: String, link: String }],
                evening: [{ name: String, link: String }],
            },
        }],
    },
	// Link to the original booking
	bookingId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Booking",
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		default: Date.now,
	}
});

const DietYoga = mongoose.model("DietYoga", dietYogaSchema);
module.exports = DietYoga;
