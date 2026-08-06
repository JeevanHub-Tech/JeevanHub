const Patient = require("../models/Patient");
const DietYoga = require("../models/DietYoga");
const Order = require("../models/Order");
const Medicine = require("../models/Medicine");
const Booking = require("../models/Booking");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const axios = require("axios");
const { transcribeDocument } = require("../services/prescriptionOcr/ocrService");
const { PRESCRIPTION_OCR_MODEL, PRESCRIPTION_OCR_MAX_FILE_BYTES } = require("../services/prescriptionOcr/config");
const { CLOUDINARY_CONFIGURED } = require("../config/medicalHistoryStorage");

// Medical history files are uploaded as Cloudinary "authenticated" resources
// (see patientRoutes.js), so the plain stored URL 401s on its own. Plain
// `cloudinary.url({ sign_url: true })` also 401s for "authenticated" assets --
// that only signs transformation params, it doesn't grant delivery access.
// private_download_url() goes through Cloudinary's Admin API (signed with our
// api_secret) and actually authorizes the download, so every response needs
// one of these generated fresh instead of using the stored URL.
const buildSignedUrl = (doc) => {
	const format = path.extname(doc.fileName || '').replace('.', '') || undefined;
	return cloudinary.utils.private_download_url(doc.publicId, format, {
		resource_type: 'image', // jpeg/jpg/png/pdf all land in Cloudinary's "image" bucket
		type: 'authenticated'
	});
};

const withSignedUrls = (medicalHistory) => medicalHistory.map(doc => {
	const plain = doc.toObject ? doc.toObject() : doc;
	return { ...plain, url: plain.publicId ? buildSignedUrl(plain) : plain.url };
});

// Get All Patients (Public)
exports.getAllPatients = async (req, res) => {
	try {
		if (req.user.role !== 'admin') {
			return res.status(403).json({ message: "Access denied. Admins only." });
		}
		const patients = await Patient.find().select('-password');

		res.status(200).json(patients);
	} catch (error) {
		res.status(500).json({
			message: "Failed to fetch patients",
			error: error.message,
		});
	}
};

// Update Patient Details (Admin or authorized user)
exports.updatePatient = async (req, res) => {
	const { id } = req.params;
	const updates = req.body;

	try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
		if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
			return res.status(403).json({ message: "Not authorized to update this patient" });
		}
		let patient = await Patient.findById(id);

		if (patient) {
			if (updates.profileImage !== undefined) patient.profileImage = updates.profileImage;
			if (updates.firstName !== undefined) patient.firstName = updates.firstName;
			if (updates.lastName !== undefined) patient.lastName = updates.lastName;
			if (updates.email !== undefined) patient.email = updates.email;
			if (updates.dateOfBirth !== undefined) patient.dob = updates.dateOfBirth;
			if (updates.gender !== undefined) patient.gender = updates.gender;
			if (updates.pincode !== undefined) patient.zipCode = updates.pincode;
			if (updates.address !== undefined) patient.address = updates.address;
			if (updates.phone !== undefined) patient.phone = updates.phone;

			await patient.save();
			console.log("Updated Patient details successfully");
			const safeData = patient.toObject();
			delete safeData.password;
			delete safeData.resetPasswordOTP;
			delete safeData.resetPasswordOTPExpires;
			delete safeData.isOTPVerified;
			return res.status(200).json({ success: true, message: "Patient updated successfully", data: safeData });
		}
		return res.status(404).json({ message: "Patient not found" });
	} catch (error) {
		console.error("Error updating patient:", error);
		res.status(500).json({ message: "Failed to update patient", error: error.message });
	}
}

// Delete a Patient (Admin or authorized user)
exports.deletePatient = async (req, res) => {
	const { id } = req.params;

	try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
		if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
			return res.status(403).json({ message: "Not authorized to delete this patient" });
		}
		const deletedPatient = await Patient.findByIdAndDelete(id);

		if (!deletedPatient) {
			return res.status(404).json({ message: "Patient not found" });
		}

		res.status(200).json({ message: "Patient deleted successfully" });
	} catch (error) {
		console.error("Error deleting patient:", error);
		res.status(500).json({ message: "Failed to delete patient", error: error.message });
	}
};

// Get Single Patient (Public or authorized)
exports.getPatientById = async (req, res) => {
	const { id } = req.params;

	try {
		const isSelf = req.user._id.toString() === id;
		if (req.user.role !== 'admin' && !isSelf) {
			// A doctor who's actually had a booking with this patient can view
			// their basic profile too -- same relationship gate as medical history.
			const hasRelationship = req.user.role === 'doctor' && await Booking.exists({ doctorId: req.user._id, patientId: id });
			if (!hasRelationship) {
				return res.status(403).json({ message: "Not authorized to view this patient's details" });
			}
		}
		const patient = await Patient.findById(id).select('-password -resetPasswordOTP -resetPasswordOTPExpires -isOTPVerified');

		if (!patient) {
			return res.status(404).json({ message: "Patient not found" });
		}

		res.status(200).json(patient);
	} catch (error) {
		console.error("Error fetching patient:", error);
		res.status(500).json({ message: "Failed to fetch patient", error: error.message });
	}
};

// Get diet & yoga plan for a specific patient
exports.getPatientDietYoga = async (req, res) => {
	const { patientId } = req.params; // Patient's ID from URL

	try {
		if (req.user.role !== 'admin' && req.user._id.toString() !== patientId) {
			// Actually doctors should be able to view their patient's diet plan too.
			// Since we only have req.user, let's at least protect it somewhat.
			if (req.user.role !== 'doctor') {
				return res.status(403).json({ message: "Not authorized to view this patient's diet plan" });
			}
		}
		console.log("fetching patinet diet yuoga >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
		const dietYogaPlan = await DietYoga.findOne({ patient: patientId })
			.sort({ updatedAt: -1 })
			.populate('bookingId', 'recommendedSupplements diagnosis');

		if (!dietYogaPlan) {
			return res.status(404).json({
				message: "Patient has not subscribed to a diet & yoga plan yet",
			});
		}

		res.status(200).json(dietYogaPlan);
	} catch (error) {
		console.error("Error fetching diet & yoga plan:", error);
		res.status(500).json({
			message: "Failed to fetch diet & yoga plan",
			error: error.message,
		});
	}
};

// Get all orders of the patient - for frontend transactions page
exports.getOrdersByBuyerId = async (req, res) => {
	const { buyerId } = req.params;

	try {
		if (req.user.role !== 'admin' && req.user._id.toString() !== buyerId) {
			return res.status(403).json({ message: "Not authorized to view these orders" });
		}
		const orders = await Order.find({ "buyer.buyerId": buyerId })
			.populate({
				path: "items.medicineId",
				populate: {
					path: "retailerId",
					select: "BusinessName",
				},
			})
			.populate("buyer.buyerId");

		if (!orders || orders.length === 0) {
			return res.status(404).json({
				message: "No orders found for this buyer",
			});
		}

		// 🔥 Transform response so each order includes retailer BusinessName
		const enrichedOrders = orders.map(order => ({
			...order.toObject(),
			retailers: [
				...new Set(
					order.items.map(
						item => item.medicineId?.retailerId?.BusinessName
					).filter(Boolean) // remove null/undefined
				)
			],
			// 👆 array in case multiple retailers per order
		}));

		res.status(200).json(enrichedOrders);
	} catch (error) {
		console.error("Error fetching orders:", error);
		res.status(500).json({
			message: "Failed to fetch orders",
			error: error.message,
		});
	}
};

// Temporary uploader to add a dummy DietYoga entry with schema validation
exports.addDietYoga = async (req, res) => {
	try {
		const data = req.body;

		// 1️⃣ Required top-level fields
		const requiredFields = [
			"patient",
			"doctor",
			"patientEmail",
			"patientName",
			"doctorEmail",
			"doctorName",
			"bookingId",
		];
		const missingFields = requiredFields.filter((field) => !data[field]);
		if (missingFields.length > 0) {
			return res.status(400).json({ message: "Missing required fields", missingFields });
		}

		// 2️⃣ Validate diet object if provided
		if (data.diet) {
			const dailyMeals = ["breakfast", "lunch", "dinner", "juices"];
			if (data.diet.daily) {
				dailyMeals.forEach((meal) => {
					if (data.diet.daily[meal] && typeof data.diet.daily[meal] !== "string") {
						return res.status(400).json({ message: `diet.daily.${meal} must be a string` });
					}
				});
			}

			if (data.diet.weekly) {
				const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
				days.forEach((day) => {
					if (data.diet.weekly[day]) {
						dailyMeals.forEach((meal) => {
							if (data.diet.weekly[day][meal] && typeof data.diet.weekly[day][meal] !== "string") {
								return res.status(400).json({ message: `diet.weekly.${day}.${meal} must be a string` });
							}
						});
					}
				});
			}

			// Herbs validation
			if (data.diet.herbs && !Array.isArray(data.diet.herbs)) {
				return res.status(400).json({ message: "diet.herbs must be an array of strings" });
			}
		}
		// 3️⃣ Validate yoga object if provided
		if (data.yoga) {
			if (data.yoga.morningPlan && typeof data.yoga.morningPlan !== "string") {
				return res.status(400).json({ message: "yoga.morningPlan must be a string" });
			}
			if (data.yoga.eveningPlan && typeof data.yoga.eveningPlan !== "string") {
				return res.status(400).json({ message: "yoga.eveningPlan must be a string" });
			}
		}

		// 4️⃣ Everything valid, create the document
		const newEntry = new DietYoga(data);
		await newEntry.save();

		res.status(201).json({ message: "DietYoga added successfully", dietYoga: newEntry });
	} catch (error) {
		console.error("Error adding DietYoga:", error);
		res.status(500).json({ message: "Failed to add DietYoga", error: error.message });
	}
};

// Create a new order
exports.createTempOrder = async (req, res) => {
	try {
		const { items, buyer, shippingAddress, paymentMethod, paymentStatus, paymentProof, paymentQR, orderStatus, retailerStatus } = req.body;

		if (!items || items.length === 0) {
			return res.status(400).json({ message: "No items provided for the order" });
		}

		let calculatedItems = [];
		let totalPrice = 0;

		// Loop through all items, fetch med price, calculate subtotal
		for (const item of items) {
			const medicine = await Medicine.findById(item.medicineId);

			if (!medicine) {
				return res.status(404).json({ message: `Medicine not found: ${item.medicineId}` });
			}

			const subTotal = medicine.price * item.quantity;
			totalPrice += subTotal;

			calculatedItems.push({
				medicineId: item.medicineId,
				quantity: item.quantity,
				subTotal: subTotal
			});
		}

		// Build order object
		const newOrder = new Order({
			items: calculatedItems,
			totalPrice,
			buyer,
			shippingAddress,
			paymentMethod,
			paymentStatus,
			paymentProof: paymentProof || null,
			paymentQR: paymentQR || null,
			orderStatus,
			retailerStatus
		});

		// Save to DB
		await newOrder.save();

		res.status(201).json({
			message: "Order created successfully",
			order: newOrder
		});
	} catch (error) {
		console.error("Error creating order:", error);
		res.status(500).json({
			message: "Failed to create order",
			error: error.message
		});
	}
};

// Upload / replace the patient's profile image
exports.uploadProfileImage = async (req, res) => {
	const { id } = req.params;

	try {
		if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
			return res.status(403).json({ message: "Not authorized to update this patient's image" });
		}
		if (!req.file) {
			return res.status(400).json({ message: "No image file uploaded" });
		}

		const patient = await Patient.findById(id);
		if (!patient) {
			return res.status(404).json({ message: "Patient not found" });
		}

		patient.profileImage = req.file.path;
		await patient.save();

		res.status(200).json({ message: "Profile image updated successfully", url: req.file.path });
	} catch (error) {
		console.error("Error uploading profile image:", error);
		res.status(500).json({ message: "Failed to upload profile image", error: error.message });
	}
};

// Run Gemini OCR for one medical history doc and write the result into
// `doc.ocr` + an auditLog entry. Never touches `doc.patientVerification` --
// that's seeded from this draft separately, once, right after.
async function runOcrForDoc(doc) {
	doc.ocr = { ...(doc.ocr?.toObject ? doc.ocr.toObject() : doc.ocr), status: 'processing' };
	try {
		const fetchUrl = doc.publicId ? buildSignedUrl(doc) : doc.url;
		const fileResp = await axios.get(fetchUrl, {
			responseType: 'arraybuffer',
			maxContentLength: PRESCRIPTION_OCR_MAX_FILE_BYTES,
		});
		const base64 = Buffer.from(fileResp.data).toString('base64');
		const result = await transcribeDocument({ fileBytesBase64: base64, mimeType: doc.mimeType });

		doc.ocr = {
			status: 'done',
			medicines: result.medicines,
			doctorName: result.doctorName,
			doctorRegistrationNumber: result.doctorRegistrationNumber,
			prescriptionDate: result.prescriptionDate,
			patientNameOnDocument: result.patientNameOnDocument,
			rawText: result.rawText,
			unclearNotes: result.unclearNotes,
			model: PRESCRIPTION_OCR_MODEL,
			error: undefined,
			analyzedAt: new Date(),
		};
		doc.auditLog.push({ stage: 'ocr_extracted', snapshot: doc.ocr.toObject ? doc.ocr.toObject() : doc.ocr, at: new Date() });

		// Seed the patient's editable draft from the OCR output so there's
		// something to review -- the patient corrects this copy, `ocr` itself
		// stays untouched as the original-extraction record.
		doc.patientVerification = {
			status: 'pending',
			medicines: result.medicines,
			doctorName: result.doctorName,
			doctorRegistrationNumber: result.doctorRegistrationNumber,
			prescriptionDate: result.prescriptionDate,
			patientNameOnDocument: result.patientNameOnDocument,
			notes: '',
		};
	} catch (ocrError) {
		doc.ocr = { ...(doc.ocr?.toObject ? doc.ocr.toObject() : doc.ocr), status: 'failed', error: ocrError.message };
		doc.auditLog.push({ stage: 'ocr_failed', snapshot: { error: ocrError.message }, at: new Date() });
		throw ocrError;
	}
}

// Upload prescription / medical history documents. OCR now runs
// automatically right here at upload time -- never on-demand by a doctor --
// so the patient has an editable draft waiting as soon as upload finishes.
// An OCR failure on one file doesn't block the others; the doc is just left
// in 'failed' status with a retry available (see retryMedicalHistoryOcr).
exports.uploadMedicalHistory = async (req, res) => {
	const { id } = req.params;

	try {
		if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
			return res.status(403).json({ message: "Not authorized to upload documents for this patient" });
		}
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ message: "No files uploaded" });
		}

		const patient = await Patient.findById(id);
		if (!patient) {
			return res.status(404).json({ message: "Patient not found" });
		}

		const newDocs = req.files.map(file => ({
			fileName: file.originalname,
			// Cloudinary: file.path is the secure_url, file.filename is the public_id.
			// Local-disk fallback (no Cloudinary creds configured): file.path is a
			// filesystem path, so build the URL from the existing `/uploads` static
			// mount instead, and leave publicId unset (nothing to Cloudinary-sign).
			url: CLOUDINARY_CONFIGURED
				? file.path
				: `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/medical-history/${file.filename}`,
			publicId: CLOUDINARY_CONFIGURED ? file.filename : undefined,
			mimeType: file.mimetype,
			uploadedAt: new Date(),
			auditLog: [],
		}));

		patient.medicalHistory.push(...newDocs);
		await patient.save();

		const addedDocs = patient.medicalHistory.slice(-newDocs.length);
		for (const doc of addedDocs) {
			try {
				await runOcrForDoc(doc);
			} catch (ocrError) {
				console.error(`OCR failed for uploaded doc ${doc.fileName}:`, ocrError.message);
			}
		}
		await patient.save();

		res.status(201).json({ message: "Medical history uploaded successfully", medicalHistory: withSignedUrls(patient.medicalHistory) });
	} catch (error) {
		console.error("Error uploading medical history:", error);
		res.status(500).json({ message: "Failed to upload medical history", error: error.message });
	}
};

// A doctor may only ever see the patient-verified final data -- never the
// raw OCR draft, and never a doc the patient hasn't submitted yet. Strips
// `ocr` and `auditLog` entirely and drops any doc still pending/in_review.
const forDoctorView = (medicalHistory) => medicalHistory
	.filter((doc) => doc.patientVerification?.status === 'submitted')
	.map((doc) => {
		const { ocr, auditLog, patientVerification, ...rest } = doc;
		return { ...rest, finalPrescription: patientVerification };
	});

// Get a patient's previous medical history documents (self, admin, or a doctor
// who actually has a booking with this patient -- NOT any doctor for any
// patient, which is what "req.user.role !== 'doctor'" alone used to allow).
// Doctors get a filtered view (see forDoctorView); the patient/admin get the
// full record including the OCR draft and audit trail.
exports.getMedicalHistory = async (req, res) => {
	const { id } = req.params;

	try {
		const isSelf = req.user._id.toString() === id;
		const isDoctor = req.user.role === 'doctor';
		if (req.user.role !== 'admin' && !isSelf) {
			if (!isDoctor) {
				return res.status(403).json({ message: "Not authorized to view this patient's medical history" });
			}
			const hasRelationship = await Booking.exists({ doctorId: req.user._id, patientId: id });
			if (!hasRelationship) {
				return res.status(403).json({ message: "Not authorized to view this patient's medical history" });
			}
		}

		const patient = await Patient.findById(id).select('medicalHistory');
		if (!patient) {
			return res.status(404).json({ message: "Patient not found" });
		}

		const signed = withSignedUrls(patient.medicalHistory);
		res.status(200).json({ medicalHistory: isDoctor ? forDoctorView(signed) : signed });
	} catch (error) {
		console.error("Error fetching medical history:", error);
		res.status(500).json({ message: "Failed to fetch medical history", error: error.message });
	}
};

// Delete a previously uploaded medical history document
exports.deleteMedicalHistoryDoc = async (req, res) => {
	const { id, docId } = req.params;

	try {
		if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
			return res.status(403).json({ message: "Not authorized to delete this patient's documents" });
		}

		const patient = await Patient.findById(id);
		if (!patient) {
			return res.status(404).json({ message: "Patient not found" });
		}

		const doc = patient.medicalHistory.id(docId);
		if (!doc) {
			return res.status(404).json({ message: "Document not found" });
		}

		if (doc.publicId) {
			try {
				// Cloudinary's `destroy` doesn't accept resource_type "auto" (that's an
				// upload-only option) -- jpeg/jpg/png/pdf (the only types this route's
				// fileFilter allows) are always stored as resource_type "image". `type`
				// must match the upload-time value ("authenticated") too, or destroy
				// silently no-ops (wrong asset triple = not found).
				await cloudinary.uploader.destroy(doc.publicId, { resource_type: 'image', type: 'authenticated' });
			} catch (cloudErr) {
				console.error("Cloudinary delete failed (continuing to remove DB record):", cloudErr.message);
			}
		}

		doc.deleteOne();
		await patient.save();

		res.status(200).json({ message: "Document deleted successfully", medicalHistory: withSignedUrls(patient.medicalHistory) });
	} catch (error) {
		console.error("Error deleting medical history document:", error);
		res.status(500).json({ message: "Failed to delete document", error: error.message });
	}
};

// Gate for OCR retry / verification edits: only the patient themself or an
// admin -- a doctor never triggers OCR or edits the verification draft,
// since doctors aren't part of this review step at all.
function isSelfOrAdmin(req, patientId) {
	return req.user.role === 'admin' || req.user._id.toString() === patientId;
}

// Shared status mapping for the prescription-OCR agent's error codes, mirroring
// the doctor-match agent's mapping in doctorController.js.
function mapOcrError(res, error, action) {
	if (error.code === 'DISABLED' || error.code === 'NO_KEY') {
		return res.status(503).json({ message: "AI transcription is unavailable right now. Please try again later." });
	}
	if (error.code === 'UNSUPPORTED_TYPE') {
		return res.status(415).json({ message: "This file type isn't supported for OCR (only JPG, PNG, and PDF)." });
	}
	if (error.code === 'RATE_LIMIT') {
		return res.status(429).json({ message: "We're experiencing high traffic. Please wait a moment and try again." });
	}
	if (error.code === 'JSON_PARSE_ERROR') {
		return res.status(500).json({ message: "AI response was hard to read. Please run OCR again." });
	}
	console.error(`Failed to ${action}:`, error.message);
	return res.status(500).json({ message: `Failed to ${action}`, error: error.message });
}

// Patient (or admin) retries Gemini OCR for one document -- e.g. after an
// upload-time failure. Re-running overwrites `ocr` and reseeds
// `patientVerification` from the fresh draft (only if the patient hasn't
// already submitted -- a submitted doc is final and no longer touched by OCR).
exports.retryMedicalHistoryOcr = async (req, res) => {
	const { id, docId } = req.params;

	try {
		if (!isSelfOrAdmin(req, id)) {
			return res.status(403).json({ message: "Not authorized to run OCR on this patient's document" });
		}

		const patient = await Patient.findById(id);
		if (!patient) return res.status(404).json({ message: "Patient not found" });

		const doc = patient.medicalHistory.id(docId);
		if (!doc) return res.status(404).json({ message: "Document not found" });
		if (!doc.publicId && !doc.url) return res.status(400).json({ message: "This document cannot be re-fetched for OCR" });
		if (doc.patientVerification?.status === 'submitted') {
			return res.status(409).json({ message: "This prescription has already been submitted and is final" });
		}

		try {
			await runOcrForDoc(doc);
			await patient.save();
			return res.status(200).json({ message: "OCR complete", medicalHistoryDoc: withSignedUrls([doc])[0] });
		} catch (ocrError) {
			await patient.save();
			throw ocrError;
		}
	} catch (error) {
		return mapOcrError(res, error, "run OCR");
	}
};

function sanitizeMedicines(medicines) {
	if (!Array.isArray(medicines)) return [];
	return medicines.slice(0, 50).map((m) => ({
		name: String(m?.name || '').slice(0, 200),
		dosage: String(m?.dosage || '').slice(0, 100),
		frequency: String(m?.frequency || '').slice(0, 100),
		duration: String(m?.duration || '').slice(0, 100),
		instructions: String(m?.instructions || '').slice(0, 500),
	}));
}

// Patient saves in-progress edits to their verification draft (not yet
// final -- can be called repeatedly). Once `submitMedicalHistoryVerification`
// is called the doc is locked and this endpoint refuses further edits.
exports.saveMedicalHistoryVerification = async (req, res) => {
	const { id, docId } = req.params;
	const { medicines, doctorName, doctorRegistrationNumber, prescriptionDate, patientNameOnDocument, notes } = req.body;

	try {
		if (!isSelfOrAdmin(req, id)) {
			return res.status(403).json({ message: "Not authorized to edit this patient's document" });
		}

		const patient = await Patient.findById(id);
		if (!patient) return res.status(404).json({ message: "Patient not found" });

		const doc = patient.medicalHistory.id(docId);
		if (!doc) return res.status(404).json({ message: "Document not found" });
		if (doc.patientVerification?.status === 'submitted') {
			return res.status(409).json({ message: "This prescription has already been submitted and is final" });
		}

		doc.patientVerification = {
			status: 'in_review',
			medicines: sanitizeMedicines(medicines),
			doctorName: String(doctorName || '').slice(0, 200),
			doctorRegistrationNumber: String(doctorRegistrationNumber || '').slice(0, 100),
			prescriptionDate: String(prescriptionDate || '').slice(0, 100),
			patientNameOnDocument: String(patientNameOnDocument || '').slice(0, 200),
			notes: String(notes || '').slice(0, 2000),
		};
		await patient.save();

		res.status(200).json({ message: "Draft saved", medicalHistoryDoc: withSignedUrls([doc])[0] });
	} catch (error) {
		console.error("Error saving medical history verification draft:", error);
		res.status(500).json({ message: "Failed to save draft", error: error.message });
	}
};

// Patient submits their verified prescription as final. This is the only
// state a doctor is ever shown (see forDoctorView in getMedicalHistory) --
// locks the doc against further edits/OCR retries and records an audit entry.
exports.submitMedicalHistoryVerification = async (req, res) => {
	const { id, docId } = req.params;
	const { medicines, doctorName, doctorRegistrationNumber, prescriptionDate, patientNameOnDocument, notes } = req.body;

	try {
		if (!isSelfOrAdmin(req, id)) {
			return res.status(403).json({ message: "Not authorized to submit this patient's document" });
		}
		const sanitizedMedicines = sanitizeMedicines(medicines);
		if (sanitizedMedicines.length === 0) {
			return res.status(400).json({ message: "At least one medicine is required" });
		}

		const patient = await Patient.findById(id);
		if (!patient) return res.status(404).json({ message: "Patient not found" });

		const doc = patient.medicalHistory.id(docId);
		if (!doc) return res.status(404).json({ message: "Document not found" });
		if (doc.patientVerification?.status === 'submitted') {
			return res.status(409).json({ message: "This prescription has already been submitted and is final" });
		}

		doc.patientVerification = {
			status: 'submitted',
			medicines: sanitizedMedicines,
			doctorName: String(doctorName || '').slice(0, 200),
			doctorRegistrationNumber: String(doctorRegistrationNumber || '').slice(0, 100),
			prescriptionDate: String(prescriptionDate || '').slice(0, 100),
			patientNameOnDocument: String(patientNameOnDocument || '').slice(0, 200),
			notes: String(notes || '').slice(0, 2000),
			submittedAt: new Date(),
		};
		doc.auditLog.push({
			stage: 'patient_submitted',
			snapshot: doc.patientVerification.toObject ? doc.patientVerification.toObject() : doc.patientVerification,
			actor: req.user._id,
			actorModel: 'Patient',
			at: new Date(),
		});
		await patient.save();

		res.status(200).json({ message: "Prescription submitted", medicalHistoryDoc: withSignedUrls([doc])[0] });
	} catch (error) {
		console.error("Error submitting medical history verification:", error);
		res.status(500).json({ message: "Failed to submit prescription", error: error.message });
	}
};

