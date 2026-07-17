const Booking = require("../models/Booking");
const Doctor = require("../models/Doctor");
const Medicine = require("../models/Medicine");
const Cart = require("../models/Cart");
const Notification = require("../models/Notification");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

// A pending request "expires" once its slot's start time has passed without the
// doctor acting on it — from that point on it's treated the same as an explicit
// denial. timeSlot here is always the doctor's 24h "HH:MM" startTime string,
// resolved live from Doctor.availableSlots (never persisted on the Booking itself).
const AUTO_DENY_MESSAGE = "Automatically denied — the requested slot passed without a response.";
const hasSlotTimePassed = (dateOfAppointment, timeSlot) => {
	if (!timeSlot || typeof timeSlot !== 'string' || !timeSlot.includes(':')) return false;
	const [hours, minutes] = timeSlot.split(':').map(Number);
	if (Number.isNaN(hours)) return false;
	const slotDateTime = new Date(dateOfAppointment);
	slotDateTime.setHours(hours, minutes || 0, 0, 0);
	return new Date() > slotDateTime;
};

// Global registry for SSE doctor connections
const doctorConnections = new Map();

// Export the connections so we can theoretically emit from other controllers if needed
exports.doctorConnections = doctorConnections;

// Add or update rating and review
exports.updateRatingAndReview = async (req, res) => {
	const { id } = req.params;
	const { rating, review } = req.body;

	try {
		if (rating && (rating < 1 || rating > 5)) {
			return res.status(400).json({ error: "Rating must be between 1 and 5" });
		}

		const booking = await Booking.findById(id);
		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}
		if (booking.patientId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Not authorized to update this booking" });
		}

		const updatedBooking = await Booking.findByIdAndUpdate(
			id,
			{ rating, review },
			{ new: true }
		);

		if (!updatedBooking) {
			return res.status(404).json({ error: "Booking not found" });
		}

		return res.status(200).json({
			message: "Rating and review updated successfully",
			booking: updatedBooking,
		});
	} catch (error) {
		console.error("Error updating rating and review:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Get rating and review for a booking
exports.getRatingAndReview = async (req, res) => {
	const { id } = req.params;

	try {
		const booking = await Booking.findById(id);

		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}
		if (req.user.role !== 'admin' && booking.patientId.toString() !== req.user._id.toString() && booking.doctorId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Not authorized" });
		}

		return res.status(200).json({
			message: "Rating and review retrieved successfully",
			rating: booking.rating,
			review: booking.review,
		});
	} catch (error) {
		console.error("Error retrieving rating and review:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Controller function to handle booking creation
exports.createBooking = async (req, res) => {
	if (req.user.role !== 'patient') {
		return res.status(403).json({ error: "Access denied. Only patients can create bookings." });
	}
	const {
		doctorName,
		doctorId,
		doctorEmail,
		slotId,
		dateOfAppointment,
		email,
		patientName,
		patientGender,
		patientAge,
		patientIllness,
		meetLink,
		amountPaid,
	} = req.body; // Destructure the request body
	const patientId = req.user._id; // Enforce ownership

	if (!doctorName) {
		return res.status(400).json({ error: "Doctor name are required" });
	} else if (!slotId) {
		return res.status(400).json({ error: "Slot ID is required" });
	} else if (!email) {
		return res.status(400).json({ error: "Patient email is required" });
	}

	try {
		const doctor = await Doctor.findOne({ email: doctorEmail });
		if (!doctor) {
			return res.status(404).json({ error: "Doctor not found" });
		}
		// Check slot availability considering overrides and active bookings (max capacity)
		const dateObj = new Date(dateOfAppointment);
		const startOfDay = new Date(dateObj);
		startOfDay.setHours(0,0,0,0);
		const endOfDay = new Date(dateObj);
		endOfDay.setHours(23,59,59,999);

		const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
		const activeBookings = await Booking.find({
			doctorId: doctor._id,
			dateOfAppointment: { $gte: startOfDay, $lte: endOfDay },
			$or: [
				{ requestAccept: 'accepted' },
				{ requestAccept: 'pending', amountPaid: 0 },
				{ 
					requestAccept: 'pending', 
					amountPaid: { $gt: 0 },
					$or: [
						{ 'paymentScreenshots.0': { $exists: true } },
						{ createdAt: { $gte: tenMinutesAgo } }
					]
				}
			]
		});

		const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
		let baseSlots = [...(doctor.availableSlots[dayName] || [])].map(s => s.toObject ? s.toObject() : s);
		const dateOverrides = doctor.scheduleOverrides.filter(o => new Date(o.date).toDateString() === dateObj.toDateString());
		
		if (dateOverrides.some(o => o.type === 'cancelled' && !o.targetSlotId)) {
			return res.status(400).json({ error: "Doctor is unavailable on this date." });
		}

		for (const override of dateOverrides) {
			if (override.type === 'cancelled' && override.targetSlotId) {
				baseSlots = baseSlots.filter(s => s.isOverride || s._id.toString() !== override.targetSlotId.toString());
			} else if (override.type === 'rescheduled' && override.targetSlotId) {
				const idx = baseSlots.findIndex(s => !s.isOverride && s._id.toString() === override.targetSlotId.toString());
				if (idx !== -1) {
					baseSlots[idx] = {
                        ...baseSlots[idx],
                        startTime: override.newStartTime || baseSlots[idx].startTime,
                        maxCapacity: override.newMaxCapacity || baseSlots[idx].maxCapacity,
                        isOverride: true,
                    };
				}
			} else if (override.type === 'added') {
				baseSlots.push({
					_id: override._id,
					startTime: override.newStartTime,
					maxCapacity: override.newMaxCapacity || 1,
					isOverride: true
				});
			}
		}

		const foundSlot = baseSlots.find(s => s._id.toString() === slotId.toString());
		if (!foundSlot) {
			return res.status(400).json({ error: "Invalid or cancelled time slot." });
		}
		
		const slotBookings = activeBookings.filter(b => b.slotId.toString() === slotId.toString());
		if (slotBookings.length >= (foundSlot.maxCapacity || 1)) {
			return res.status(400).json({ error: "This time slot is already booked for the selected doctor. Please Choose a different date or time slot." });
		}

		// Create a new booking
		const newBooking = new Booking({
			doctorId: doctor._id,
			doctorName,
			doctorEmail,
			slotId,
			patientId,
			dateOfAppointment,
			patientEmail: email,
			patientName,
			patientGender,
			patientAge,
			patientIllness,
			meetLink,
			amountPaid: amountPaid !== undefined ? amountPaid : (doctor.price || 0),
		});

		// Save the booking to the database
		await newBooking.save();

		// Notify doctor of new pending booking
		notifyDoctor(doctor._id);

		return res.status(201).json({
			message: "Appointment booked successfully",
			booking: newBooking,
		});
	} catch (error) {
		console.error("Error creating booking:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Controller function to get all bookings
exports.getAllBookings = async (req, res) => {
	try {
		if (req.user.role !== 'admin') {
			return res.status(403).json({ message: "Access denied. Admins only." });
		}
		// Fetch all bookings from the database
		const bookings = await Booking.find();

		// Check if any bookings exist
		if (bookings.length === 0) {
			return res.status(404).json({ message: "No bookings found" });
		}

		// Return all bookings in the response
		return res.status(200).json({
			message: "Bookings retrieved successfully",
			bookings,
		});
	} catch (error) {
		console.error("Error fetching bookings:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "jeevanhub/payments",
      resource_type: "auto",
      public_id: Date.now() + "-" + file.originalname.split('.')[0]
    };
  },
});

const fileFilter = (req, file, cb) => {
	const filetypes = /jpeg|jpg|png|pdf/;
	const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
	const mimetype = filetypes.test(file.mimetype);

	if (mimetype && extname) {
		return cb(null, true);
	} else {
		cb(new Error("Only jpeg, jpg, png, and pdf files are allowed"));
	}
};

const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
}).array("paymentScreenshots", 5);

exports.uploadPaymentScreenshot = (req, res) => {
	upload(req, res, async function (err) {
		if (err instanceof multer.MulterError) {
			return res.status(400).json({ error: err.message });
		} else if (err) {
			return res.status(400).json({ error: err.message });
		}

		console.log("🟡 Uploading payment screenshots...");
		console.log(req.files);

		const { id } = req.params;

		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ error: "Payment screenshot is required" });
		}

		try {
			const booking = await Booking.findById(id);
			if (!booking) {
				return res.status(404).json({ error: "Booking not found" });
			}
			if (booking.patientId.toString() !== req.user._id.toString()) {
				return res.status(403).json({ error: "Not authorized" });
			}

			// Save all uploaded file paths
			booking.paymentScreenshots = req.files.map(file => file.path);
			// C5-1: Server dictates status, not client
			booking.paymentStatus = "Pending";

			await booking.save();

			// Notify doctor of new screenshot upload
			notifyDoctor(booking.doctorId);

			return res.status(200).json({
				message: "Payment screenshot uploaded and booking updated",
				booking,
			});
		} catch (error) {
			console.error("❌ Error uploading payment screenshot:", error);
			return res.status(500).json({ error: "Server error" });
		}
	});
};

const sharedRecordStorage = new CloudinaryStorage({
	cloudinary: cloudinary,
	params: async (req, file) => {
		return {
			folder: "jeevanhub/shared-records",
			resource_type: "auto",
			public_id: Date.now() + "-" + file.originalname.split('.')[0]
		};
	},
});

const uploadSharedRecord = multer({
	storage: sharedRecordStorage,
	fileFilter: fileFilter,
}).single("file");

// Helper: is this booking still within the window where a patient may share records
// for it — any time up to the appointment, or within 24h after it.
const isWithinSharingWindow = (dateOfAppointment) => {
	const now = new Date();
	const appointmentTime = new Date(dateOfAppointment);
	if (appointmentTime >= now) return true;
	const hoursSinceAppointment = (now - appointmentTime) / (1000 * 60 * 60);
	return hoursSinceAppointment <= 24;
};

// ✅ Patient shares a record (external file upload OR a reference to one of their own
// past bookings on this platform) onto a specific upcoming/recent booking.
exports.addSharedRecord = (req, res) => {
	uploadSharedRecord(req, res, async function (err) {
		if (err) {
			return res.status(400).json({ error: err.message });
		}

		const { id } = req.params;
		const { referencedBookingId, note } = req.body;

		try {
			if (req.user.role !== 'patient') {
				return res.status(403).json({ error: "Only patients can share records." });
			}

			const booking = await Booking.findById(id);
			if (!booking) {
				return res.status(404).json({ error: "Booking not found" });
			}
			if (booking.patientId.toString() !== req.user._id.toString()) {
				return res.status(403).json({ error: "Not authorized to share records on this booking" });
			}

			if (!isWithinSharingWindow(booking.dateOfAppointment)) {
				return res.status(400).json({ error: "This booking is outside the window for sharing records (up to 24 hours after the appointment)." });
			}

			let newRecord;
			if (req.file) {
				newRecord = {
					type: "external_file",
					fileUrl: req.file.path,
					note: note || ""
				};
			} else if (referencedBookingId) {
				const refBooking = await Booking.findById(referencedBookingId);
				if (!refBooking) {
					return res.status(404).json({ error: "Referenced booking not found" });
				}
				if (refBooking.patientId.toString() !== req.user._id.toString()) {
					return res.status(403).json({ error: "You can only reference your own bookings" });
				}
				newRecord = {
					type: "platform_reference",
					referencedBookingId,
					note: note || ""
				};
			} else {
				return res.status(400).json({ error: "Either a file or a referencedBookingId is required" });
			}

			booking.patientSharedRecords.push(newRecord);
			await booking.save();

			notifyDoctor(booking.doctorId);

			return res.status(201).json({
				message: "Record shared successfully",
				booking
			});
		} catch (error) {
			console.error("Error adding shared record:", error);
			return res.status(500).json({ error: "Server error" });
		}
	});
};

// ✅ List the patient's own past accepted bookings that actually have a prescription,
// so they can pick one to reference (platform_reference) into the current booking.
exports.getOwnBookingsForSharing = async (req, res) => {
	try {
		if (req.user.role !== 'patient') {
			return res.status(403).json({ error: "Access denied" });
		}

		const { excludeBookingId } = req.query;
		const filter = {
			patientId: req.user._id,
			requestAccept: 'accepted',
			'recommendedSupplements.0': { $exists: true }
		};
		if (excludeBookingId) {
			filter._id = { $ne: excludeBookingId };
		}

		const bookings = await Booking.find(filter)
			.select('doctorName dateOfAppointment recommendedSupplements')
			.sort({ dateOfAppointment: -1 });

		return res.status(200).json({ bookings });
	} catch (error) {
		console.error("Error fetching patient's own bookings for sharing:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

exports.getNotifications = async (req, res) => {
	const { email } = req.query;
	console.log(email);
	if (!email) {
		return res.status(400).json({ error: "User email is required" });
	}
	if (req.user.role !== 'admin' && req.user.email !== email) {
		return res.status(403).json({ error: "Not authorized to view notifications for this email" });
	}

	try {
		// Fetch bookings for the specified user email
		const bookings = await Booking.find({ patientEmail: email }).sort({
			createdAt: -1,
		});

		// Map bookings to notification-like format
		const notifications = bookings.map((booking) => ({
			message: `Your appointment with Dr. ${booking.doctorName} is confirmed for ${booking.timeSlot}.`,
			date: booking.createdAt,
		}));

		return res.status(200).json({
			message: "Notifications retrieved successfully",
			notifications,
		});
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// New controller function to update booking requestAccept status
exports.updateBookingStatus = async (req, res) => {
    const { id } = req.params; 
    const { requestAccept, doctorsMessage } = req.body; 

    try {
        // Prepare the update object
        let updateData = { 
            requestAccept, 
            doctorsMessage 
        };

        // Accepting a request is the doctor's verification of the payment proof shown
        // alongside it in Current Requests — there is no separate verification step.
        if (requestAccept === "accepted") {
            updateData.paymentStatus = "Completed";

            // Logic to generate Jitsi link if the request is accepted
            if (req.body.meetLink && req.body.meetLink.trim() !== "") {
                updateData.meetLink = req.body.meetLink.trim();
            } else {
                // Create a unique room name using the booking ID and a short random string
                // Jitsi rooms are accessed via: https://meet.jit.si/RoomName
                const uniqueRoomName = `AyuHub-${id}-${Math.random().toString(36).substring(7)}`;
                updateData.meetLink = `https://meet.jit.si/${uniqueRoomName}`;
            }
        }

        // Find the booking by ID and update the fields, ensuring doctor owns it
        const updatedBooking = await Booking.findOneAndUpdate(
            { _id: id, doctorId: req.user._id },
            updateData,
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        
        notifyDoctor(updatedBooking.doctorId);

        return res.status(200).json({
            message: `Booking ${requestAccept === "accepted" ? "accepted" : "denied"} successfully`,
            booking: updatedBooking,
        });
    } catch (error) {
        console.error("Error updating booking:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

// New controller function to update the meetLink
exports.updateMeetLink = async (req, res) => {
	const { id } = req.params; // Get booking ID from the URL params
	const { meetLink } = req.body; // Get the meetLink from the request body
	console.log(meetLink);
	if (!meetLink || meetLink.trim() === "") {
		return res.status(400).json({ error: "Meet link is required" });
	}

	try {
		// Find the booking by ID and update the meetLink field, ensuring doctor owns it
		const updatedBooking = await Booking.findOneAndUpdate(
			{ _id: id, doctorId: req.user._id },
			{ meetLink },
			{ new: true }
		);

		if (!updatedBooking) {
			return res.status(404).json({ error: "Booking not found" });
		}

		return res.status(200).json({
			message: "Meet link updated successfully",
			booking: updatedBooking,
		});
	} catch (error) {
		console.error("Error updating meet link:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// New controller function to delete a booking
exports.deleteBooking = async (req, res) => {
	const { id } = req.params;

	try {
		// Find the booking by ID and delete it, ensuring patient owns it
		const deletedBooking = await Booking.findOneAndDelete({ _id: id, patientId: req.user._id });

		if (!deletedBooking) {
			return res.status(404).json({ message: "Booking not found or not authorized to delete" });
		}
		
		notifyDoctor(deletedBooking.doctorId);

		return res.status(200).json({ message: "Booking deleted successfully" });
	} catch (error) {
		console.error("Error deleting booking:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Helper: add one unit of a medicine to the patient's cart FOR THIS DOCTOR
// (find-or-create) — never touches the patient's own default cart or another
// doctor's cart.
const addMedicineToCart = async (patientId, doctorId, medicine) => {
	let cart = await Cart.findOne({ patientId, doctorId });
	if (!cart) {
		cart = new Cart({
			patientId,
			doctorId,
			items: [{ medicineId: medicine._id, quantity: 1, price: medicine.price }],
			totalPrice: medicine.price
		});
	} else {
		const idx = cart.items.findIndex(i => i.medicineId.toString() === medicine._id.toString());
		if (idx > -1) {
			cart.items[idx].quantity += 1;
		} else {
			cart.items.push({ medicineId: medicine._id, quantity: 1, price: medicine.price });
		}
		cart.totalPrice += medicine.price;
		cart.updatedAt = Date.now();
	}
	await cart.save();
};

// Helper: remove a medicine entirely from this doctor's cart for this patient
// (used when a prescribed medicine is deleted). No-op if the cart or item is
// gone (e.g. already purchased). Deletes the cart doc if it ends up empty.
const removeMedicineFromCart = async (patientId, doctorId, medicineId) => {
	if (!medicineId) return;
	const cart = await Cart.findOne({ patientId, doctorId });
	if (!cart) return;
	const item = cart.items.find(i => i.medicineId.toString() === medicineId.toString());
	if (!item) return;
	cart.items = cart.items.filter(i => i.medicineId.toString() !== medicineId.toString());

	if (cart.items.length === 0) {
		await Cart.deleteOne({ _id: cart._id });
		return;
	}

	cart.totalPrice = Math.max(0, cart.totalPrice - (item.price * item.quantity));
	cart.updatedAt = Date.now();
	await cart.save();
};

// Helper: load a booking and confirm the requesting doctor owns it.
const loadOwnedBooking = async (bookingId, req, res) => {
	const booking = await Booking.findById(bookingId);
	if (!booking) {
		res.status(404).json({ error: "Booking not found." });
		return null;
	}
	if (req.user.role !== 'doctor' || booking.doctorId.toString() !== req.user._id.toString()) {
		res.status(403).json({ error: "Not authorized to modify this prescription." });
		return null;
	}
	return booking;
};

// ✅ Add one prescribed medicine (picked from inventory) to a booking. Silent — the
// patient is notified only when the doctor presses "Notify patient". Also adds the
// medicine to the patient's cart. Returns the created row (with its _id).
exports.addSupplement = async (req, res) => {
	const { id } = req.params;
	const { medicineId, dosage, instructions } = req.body;

	try {
		if (!medicineId) {
			return res.status(400).json({ error: "A medicine must be selected." });
		}

		const booking = await loadOwnedBooking(id, req, res);
		if (!booking) return;

		const medicine = await Medicine.findById(medicineId);
		if (!medicine) {
			return res.status(404).json({ error: "Selected medicine not found in inventory." });
		}

		booking.recommendedSupplements.push({
			medicineId: medicine._id,
			medicineName: medicine.name,
			dosage: dosage || "",
			instructions: instructions || ""
		});
		await booking.save();

		await addMedicineToCart(booking.patientId, booking.doctorId, medicine);

		const created = booking.recommendedSupplements[booking.recommendedSupplements.length - 1];
		return res.status(201).json({ message: "Medicine added to prescription.", supplement: created });
	} catch (error) {
		console.error("Error adding supplement:", error);
		return res.status(500).json({ error: "Server error", details: error.message });
	}
};

// ✅ Edit an existing prescribed medicine's dosage / instructions (realtime, silent).
exports.updateSupplement = async (req, res) => {
	const { id, supplementId } = req.params;
	const { dosage, instructions } = req.body;

	try {
		const booking = await loadOwnedBooking(id, req, res);
		if (!booking) return;

		const supplement = booking.recommendedSupplements.id(supplementId);
		if (!supplement) {
			return res.status(404).json({ error: "Prescribed medicine not found." });
		}

		if (dosage !== undefined) supplement.dosage = dosage;
		if (instructions !== undefined) supplement.instructions = instructions;
		await booking.save();

		return res.status(200).json({ message: "Prescription updated.", supplement });
	} catch (error) {
		console.error("Error updating supplement:", error);
		return res.status(500).json({ error: "Server error", details: error.message });
	}
};

// ✅ Remove a prescribed medicine (realtime). Also removes it from the patient's cart.
exports.deleteSupplement = async (req, res) => {
	const { id, supplementId } = req.params;

	try {
		const booking = await loadOwnedBooking(id, req, res);
		if (!booking) return;

		const supplement = booking.recommendedSupplements.id(supplementId);
		if (!supplement) {
			return res.status(404).json({ error: "Prescribed medicine not found." });
		}

		const medicineId = supplement.medicineId;
		supplement.deleteOne();
		await booking.save();

		await removeMedicineFromCart(booking.patientId, booking.doctorId, medicineId);

		return res.status(200).json({ message: "Medicine removed from prescription." });
	} catch (error) {
		console.error("Error deleting supplement:", error);
		return res.status(500).json({ error: "Server error", details: error.message });
	}
};

// ✅ Set the doctor's diagnosis for this consultation (realtime, silent).
exports.updateDiagnosis = async (req, res) => {
	const { id } = req.params;
	const { diagnosis } = req.body;

	try {
		const booking = await loadOwnedBooking(id, req, res);
		if (!booking) return;

		booking.diagnosis = diagnosis || "";
		await booking.save();

		return res.status(200).json({ message: "Diagnosis saved.", diagnosis: booking.diagnosis });
	} catch (error) {
		console.error("Error updating diagnosis:", error);
		return res.status(500).json({ error: "Server error", details: error.message });
	}
};

// ✅ Patient edits their own reason-for-visit on an upcoming (accepted, not yet
// denied) booking — e.g. to add detail they forgot at booking time.
exports.updatePatientIllness = async (req, res) => {
	const { id } = req.params;
	const { patientIllness } = req.body;

	try {
		if (!patientIllness || !patientIllness.trim()) {
			return res.status(400).json({ error: "Description cannot be empty." });
		}

		const booking = await Booking.findById(id);
		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}
		if (booking.patientId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Not authorized" });
		}
		if (booking.requestAccept !== "accepted") {
			return res.status(400).json({ error: "Only upcoming (accepted) appointments can be edited." });
		}

		booking.patientIllness = patientIllness.trim();
		await booking.save();

		return res.status(200).json({ message: "Description updated.", patientIllness: booking.patientIllness });
	} catch (error) {
		console.error("Error updating patient illness:", error);
		return res.status(500).json({ error: "Server error", details: error.message });
	}
};

// ✅ Send the patient one notification that their prescription / treatment plan is ready.
// Called explicitly by the doctor when they're done (realtime edits stay silent).
exports.notifyPrescription = async (req, res) => {
	const { id } = req.params;

	try {
		const booking = await loadOwnedBooking(id, req, res);
		if (!booking) return;

		await new Notification({
			userId: booking.patientId,
			role: 'patient',
			orderId: id,
			type: 'system',
			message: `Dr. ${booking.doctorName || "Your Doctor"} has updated your prescription and treatment plan. Tap to view.`,
			isRead: false
		}).save();

		return res.status(200).json({ message: "Patient notified successfully." });
	} catch (error) {
		console.error("Error notifying patient:", error);
		return res.status(500).json({ error: "Server error", details: error.message });
	}
};

// Get all supplements for a booking
exports.getRecommendedSupplements = async (req, res) => {
	const { id } = req.params;

	try {
		const booking = await Booking.findById(id);

		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}
		if (req.user.role !== 'admin' && booking.patientId.toString() !== req.user._id.toString() && booking.doctorId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Not authorized" });
		}

		return res.status(200).json({
			message: "Recommended supplements retrieved successfully",
			supplements: booking.recommendedSupplements,
		});
	} catch (error) {
		console.error("Error retrieving supplements:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// 🔹 Temporary uploader (to push dummy JSON from Postman) removed due to security vulnerability

// ✅ Get bookings by patientId
exports.getBookingsByPatientId = async (req, res) => {
	const { patientId } = req.params;

	if (!patientId) {
		return res.status(400).json({ error: "Patient ID is required" });
	}
	if (req.user.role !== 'admin' && req.user._id.toString() !== patientId) {
		return res.status(403).json({ error: "Not authorized" });
	}

	try {
		const bookings = await Booking.find({ patientId }).populate('doctorId').sort({ createdAt: -1 });

		if (!bookings || bookings.length === 0) {
			return res.status(200).json({ bookings: [] });
		}

		// Process bookings with doctor schedule overrides (cancellations and reschedules)
		const expiredIds = [];
		const processedBookings = bookings.map(booking => {
			const bookingObj = booking.toObject ? booking.toObject() : booking;
			const doctor = booking.doctorId;

			// Resolve the current startTime for the booking based on base template.
			// Older/malformed bookings can have a missing slotId (or one that no
			// longer matches any base slot) -- guard the .toString() calls so a
			// single bad record doesn't 500 the whole list.
			if (doctor && doctor.availableSlots && booking.slotId) {
				const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(booking.dateOfAppointment).getDay()];
				const baseSlots = doctor.availableSlots[dayName] || [];
				const baseSlot = baseSlots.find(s => s._id.toString() === booking.slotId.toString());
				if (baseSlot) {
					bookingObj.timeSlot = baseSlot.startTime;
				}
			}

			if (doctor && Array.isArray(doctor.scheduleOverrides) && booking.slotId) {
				const bookingDateStr = new Date(booking.dateOfAppointment).toDateString();
				const override = doctor.scheduleOverrides.find(o => {
					return new Date(o.date).toDateString() === bookingDateStr &&
						   o.targetSlotId && o.targetSlotId.toString() === booking.slotId.toString();
				});

				if (override) {
					if (override.type === 'cancelled') {
						bookingObj.isCancelledByDoctor = true;
						bookingObj.requestAccept = "denied"; // Render as denied/cancelled
						bookingObj.doctorsMessage = override.newReason || "This slot was cancelled by the doctor.";
					} else if (override.type === 'rescheduled') {
						bookingObj.isRescheduledByDoctor = true;
						bookingObj.rescheduledTimeSlot = override.newStartTime;
						bookingObj.originalTimeSlot = bookingObj.timeSlot;
						bookingObj.timeSlot = override.newStartTime; // Dynamically show new time
					}
				}
			}

			// A still-pending request whose slot time has already passed is
			// auto-denied — mirrors the same check on the doctor's side.
			if (bookingObj.requestAccept === 'pending' && hasSlotTimePassed(bookingObj.dateOfAppointment, bookingObj.timeSlot)) {
				bookingObj.requestAccept = 'denied';
				bookingObj.doctorsMessage = bookingObj.doctorsMessage || AUTO_DENY_MESSAGE;
				expiredIds.push(booking._id);
			}

			return bookingObj;
		});

		if (expiredIds.length > 0) {
			await Booking.updateMany(
				{ _id: { $in: expiredIds } },
				{ requestAccept: 'denied', doctorsMessage: AUTO_DENY_MESSAGE }
			);
		}

		return res.status(200).json({
			message: "Bookings retrieved successfully for patient",
			bookings: processedBookings,
		});
	} catch (error) {
		console.error("❌ Error fetching bookings by patient ID:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// ✅ Get bookings by doctorId
exports.getBookingsByDoctorId = async (req, res) => {
	const { doctorId } = req.params;

	if (!doctorId) {
		return res.status(400).json({ error: "Doctor ID is required" });
	}
	if (req.user.role !== 'admin' && req.user._id.toString() !== doctorId) {
		return res.status(403).json({ error: "Not authorized" });
	}

	try {
		const bookings = await Booking.find({ doctorId }).sort({ createdAt: -1 });

		if (!bookings || bookings.length === 0) {
			return res.status(200).json({ bookings: [] });
		}

		// Pre-calculate returning patients (any accepted booking in the past)
		const pastAcceptedBookings = await Booking.find({ doctorId, requestAccept: 'accepted' }, 'patientEmail');
		const returningEmails = new Set(pastAcceptedBookings.map(b => b.patientEmail).filter(Boolean));

		const doctor = await Doctor.findById(doctorId);
		let processedBookings = bookings;
		const expiredIds = [];
		if (doctor) {
			processedBookings = bookings.map(booking => {
				const bookingObj = booking.toObject ? booking.toObject() : booking;

				// Bookings with a missing/legacy slotId can't be matched against the
				// doctor's current slot templates -- skip that resolution instead of
				// letting a bad record crash the whole list with a 500.
				if (doctor.availableSlots && booking.slotId) {
					const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(booking.dateOfAppointment).getDay()];
					const baseSlots = doctor.availableSlots[dayName] || [];
					const baseSlot = baseSlots.find(s => s._id.toString() === booking.slotId.toString());
					if (baseSlot) {
						bookingObj.timeSlot = baseSlot.startTime;
					}
				}

				// Process bookings with doctor schedule overrides (cancellations and reschedules)
				if (Array.isArray(doctor.scheduleOverrides) && booking.slotId) {
					const bookingDateStr = new Date(booking.dateOfAppointment).toDateString();
					const override = doctor.scheduleOverrides.find(o => {
						return new Date(o.date).toDateString() === bookingDateStr &&
							   o.targetSlotId && o.targetSlotId.toString() === booking.slotId.toString();
					});

					if (override) {
						if (override.type === 'cancelled') {
							bookingObj.isCancelledByDoctor = true;
							bookingObj.requestAccept = "denied"; // Render as denied/cancelled
							bookingObj.doctorsMessage = override.newReason || "This slot was cancelled by you.";
						} else if (override.type === 'rescheduled') {
							bookingObj.isRescheduledByDoctor = true;
							bookingObj.rescheduledTimeSlot = override.newStartTime;
							bookingObj.originalTimeSlot = bookingObj.timeSlot;
							bookingObj.timeSlot = override.newStartTime; // Dynamically show new time
						}
					}
				}

				// A still-pending request whose slot time has already passed is
				// auto-denied — the doctor never gets to act on a stale request.
				if (bookingObj.requestAccept === 'pending' && hasSlotTimePassed(bookingObj.dateOfAppointment, bookingObj.timeSlot)) {
					bookingObj.requestAccept = 'denied';
					bookingObj.doctorsMessage = bookingObj.doctorsMessage || AUTO_DENY_MESSAGE;
					expiredIds.push(booking._id);
				}

				// Tag returning patient status
				if (booking.patientEmail && returningEmails.has(booking.patientEmail)) {
					bookingObj.isReturningPatient = true;
				} else {
					bookingObj.isReturningPatient = false;
				}

				return bookingObj;
			});
		}

		if (expiredIds.length > 0) {
			await Booking.updateMany(
				{ _id: { $in: expiredIds } },
				{ requestAccept: 'denied', doctorsMessage: AUTO_DENY_MESSAGE }
			);
		}

		return res.status(200).json({
			message: "Bookings retrieved successfully for doctor",
			bookings: processedBookings,
		});
	} catch (error) {
		console.error("❌ Error fetching bookings by doctor ID:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// ✅ Get reviewed bookings by patientId
exports.getReviewedBookingsByPatientId = async (req, res) => {
	const { patientId } = req.params;

	if (!patientId) {
		return res.status(400).json({ error: "Patient ID is required" });
	}
	if (req.user.role !== 'admin' && req.user._id.toString() !== patientId) {
		return res.status(403).json({ error: "Not authorized" });
	}

	try {
		const bookings = await Booking.find({
			patientId,
			review: { $exists: true, $nin: [null, ""] },
		}).sort({ createdAt: -1 });

		if (!bookings || bookings.length === 0) {
			return res.status(404).json({
				message: "No reviewed bookings found for this patient",
			});
		}

		return res.status(200).json({
			message: "Reviewed bookings retrieved successfully for patient",
			bookings,
		});

	} catch (error) {
		console.error("❌ Error fetching reviewed bookings by patient ID:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// ✅ Get reviewed bookings by doctorId
exports.getReviewedBookingsForDoctorId = async (req, res) => {
	const { doctorId } = req.params;

	if (!doctorId) {
		return res.status(400).json({ error: "Doctor ID is required" });
	}
	if (req.user.role !== 'admin' && req.user._id.toString() !== doctorId) {
		return res.status(403).json({ error: "Not authorized" });
	}

	try {
		const bookings = await Booking.find({
			doctorId,
			review: { $exists: true, $nin: [null, ""] },
		}).sort({ createdAt: -1 });

		if (!bookings || bookings.length === 0) {
			return res.status(404).json({
				message: "No reviewed bookings found for this doctor",
			});
		}

		return res.status(200).json({
			message: "Reviewed bookings retrieved successfully for doctor",
			bookings,
		});
	} catch (error) {
		console.error("❌ Error fetching reviewed bookings by doctor ID:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Helper function to emit events to a doctor's open SSE connections
const notifyDoctor = (doctorId) => {
	const doctorConns = doctorConnections.get(doctorId.toString());
	if (doctorConns) {
		doctorConns.forEach((res) => {
			res.write(`data: {"type": "booking_update"}\n\n`);
		});
	}
};

// ✅ Get a single booking by ID — single source of truth for the Prescribe page.
// Scoped to the assigned doctor, the patient themselves, or an admin.
exports.getBookingById = async (req, res) => {
	const { id } = req.params;

	try {
		const booking = await Booking.findById(id)
			.populate('patientId', 'firstName lastName email phone gender age zipCode address profileImage')
			.populate('patientSharedRecords.referencedBookingId', 'doctorName dateOfAppointment recommendedSupplements');

		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}

		const isOwnerDoctor = req.user.role === 'doctor' && booking.doctorId.toString() === req.user._id.toString();
		const isOwnerPatient = req.user.role === 'patient' && booking.patientId._id.toString() === req.user._id.toString();

		if (req.user.role !== 'admin' && !isOwnerDoctor && !isOwnerPatient) {
			return res.status(403).json({ error: "Not authorized to view this booking" });
		}

		return res.status(200).json({ booking });
	} catch (error) {
		console.error("Error fetching booking by ID:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// ✅ Get this doctor's own past accepted bookings with a specific patient
// (used for the Prescription History section — deliberately NOT other doctors' bookings).
exports.getDoctorPatientHistory = async (req, res) => {
	const { patientId } = req.params;

	if (!patientId) {
		return res.status(400).json({ error: "Patient ID is required" });
	}

	try {
		if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
			return res.status(403).json({ error: "Access denied" });
		}
		const doctorId = req.user.role === 'admin' ? req.query.doctorId : req.user._id;
		if (!doctorId) {
			return res.status(400).json({ error: "Doctor ID is required" });
		}

		const bookings = await Booking.find({
			doctorId,
			patientId,
			requestAccept: 'accepted'
		}).sort({ dateOfAppointment: -1 });

		return res.status(200).json({ bookings });
	} catch (error) {
		console.error("Error fetching doctor-patient history:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

exports.streamNotifications = (req, res) => {
	const { doctorId } = req.params;

	// Set headers for SSE
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.flushHeaders(); // flush the headers to establish connection

	// Add the connection to our map
	if (!doctorConnections.has(doctorId.toString())) {
		doctorConnections.set(doctorId.toString(), new Set());
	}
	doctorConnections.get(doctorId.toString()).add(res);

	// Send an initial connected message
	res.write('data: {"type": "connected"}\n\n');

	// Remove connection when client closes it
	req.on('close', () => {
		const doctorConns = doctorConnections.get(doctorId.toString());
		if (doctorConns) {
			doctorConns.delete(res);
			if (doctorConns.size === 0) {
				doctorConnections.delete(doctorId.toString());
			}
		}
	});
};
