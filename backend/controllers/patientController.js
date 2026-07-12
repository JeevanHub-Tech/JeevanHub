const Patient = require("../models/Patient");
const DietYoga = require("../models/DietYoga");
const Order = require("../models/Order");
const Medicine = require("../models/Medicine");
const cloudinary = require("../config/cloudinary");
const path = require("path");

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
		if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
			return res.status(403).json({ message: "Not authorized to view this patient's details" });
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
		const dietYogaPlan = await DietYoga.findOne({ patient: patientId });

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

// Upload previous medical history documents (for doctors' reference)
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
			url: file.path,
			publicId: file.filename,
			mimeType: file.mimetype,
			uploadedAt: new Date()
		}));

		patient.medicalHistory.push(...newDocs);
		await patient.save();

		res.status(201).json({ message: "Medical history uploaded successfully", medicalHistory: withSignedUrls(patient.medicalHistory) });
	} catch (error) {
		console.error("Error uploading medical history:", error);
		res.status(500).json({ message: "Failed to upload medical history", error: error.message });
	}
};

// Get a patient's previous medical history documents (self, admin, or a doctor reviewing the patient)
exports.getMedicalHistory = async (req, res) => {
	const { id } = req.params;

	try {
		if (req.user.role !== 'admin' && req.user.role !== 'doctor' && req.user._id.toString() !== id) {
			return res.status(403).json({ message: "Not authorized to view this patient's medical history" });
		}

		const patient = await Patient.findById(id).select('medicalHistory');
		if (!patient) {
			return res.status(404).json({ message: "Patient not found" });
		}

		res.status(200).json({ medicalHistory: withSignedUrls(patient.medicalHistory) });
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


