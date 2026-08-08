// models/booking.js

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
	doctorId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Doctor",
		required: true,
	},
	doctorName: {
		type: String,
		required: true,
	},
	doctorEmail: {
		type: String,
		required: true,
	},
	slotId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	dateOfAppointment: {
		type: Date,
		required: true,
	},
	patientId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Patient",
		required: true,
	},
	patientEmail: {
		type: String,
		required: true,
	},
	patientName: {
		type: String,
		required: true,
	},
	patientGender: {
		type: String,
		required: true,
	},
	patientAge: {
		type: Number,
		required: true,
	},
	patientIllness: {
		type: String,
		required: true,
	},
	requestAccept: {
		type: String,
		enum: ["pending", "accepted", "denied"],
		default: "pending",
		required: true,
	},
	doctorsMessage: {
		type: String,
		required: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	meetLink: {
		type: String,
		required: true,
		default: "no",
	},
	// Daily.co room backing this booking's video call (created lazily on first
	// join). Kept separate from meetLink, which still stores the doctor's
	// optional custom Jitsi link.
	dailyRoomName: {
		type: String,
		default: "",
	},
	dailyRoomUrl: {
		type: String,
		default: "",
	},
	// The doctor's diagnosis for THIS consultation (one per visit). Shown as
	// "disease diagnosed" on the previous-prescription reference cards.
	diagnosis: {
		type: String,
		default: ""
	},
	// Medicines the doctor prescribes this visit. Each is picked from the store
	// inventory (medicineId), so we can show its image/price and add it to the
	// patient's cart. Only medicine + dosage + instructions are captured per row.
	recommendedSupplements: [
		{
			medicineId: { type: mongoose.Schema.Types.ObjectId, ref: "Medicine" },
			medicineName: { type: String, required: true }, // denormalized for display
			dosage: { type: String, default: "" },
			instructions: { type: String, default: "" },
			addedAt: { type: Date, default: Date.now },
			// Doctor saves work in-progress silently; patient only sees a row once
			// "Submit Prescription" flips it to true. Defaults true so rows that
			// existed before this field was added stay visible (no regression).
			published: { type: Boolean, default: true },
		}
	],
	rating: {
		type: Number,
		min: 1,
		max: 5,
		default: null,
	},
	review: {
		type: String,
		default: "",
	},
	amountPaid: {
		type: Number,
		required: true,
	},
	paymentScreenshots: {
		type: [String], // Array of paths to the uploaded screenshots
		default: [], 
	},
	paymentStatus: {
		type: String,
		enum: ['Pending', 'Completed'], // Can either be Pending or Completed
		default: 'Pending',
	},
	paymentDetails: {
		razorpayOrderId: { type: String },
		razorpayPaymentId: { type: String },
		razorpaySignature: { type: String },
		amount: { type: Number },
		currency: { type: String, default: "INR" },
		status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
		transferId: { type: String }
		},
		// Fairness/escrow: the doctor's payout is held until slot-end + a grace
		// window (or resolved by an admin), so a paid no-show doesn't just pay
		// out regardless. doctorJoinedAt is the technical proof-of-attendance
		// signal -- set the first time the doctor actually opens the Daily.co room.
		doctorJoinedAt: { type: Date },
		payoutStatus: {
			type: String,
			enum: ['not_applicable', 'held', 'released', 'disputed', 'refunded'],
			default: 'not_applicable'
		},
		payoutHoldUntil: { type: Date },
		dispute: {
			reason: { type: String },
			raisedAt: { type: Date },
			resolvedAt: { type: Date },
			resolution: { type: String, enum: ['released', 'refunded'] },
			resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
		},
		// Records the patient shares with the doctor ahead of / shortly after this specific
		// consultation (e.g. an external prescription photo, or a link to a prior bookings
		// prescription on this platform) so the doctor has context before prescribing here.
		patientSharedRecords: [
			{
				type: {
					type: String,
					enum: ["external_file", "platform_reference"],
					required: true
				},
				fileUrl: { type: String },
				referencedBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
				note: { type: String, default: "" },
				uploadedAt: { type: Date, default: Date.now }
			}
		]
	});

bookingSchema.index({ doctorId: 1 });
bookingSchema.index({ patientId: 1 });
bookingSchema.index({ patientEmail: 1 });
bookingSchema.index({ createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
