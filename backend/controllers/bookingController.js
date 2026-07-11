const Booking = require("../models/Booking");
const Doctor = require("../models/Doctor");
const Medicine = require("../models/Medicine");
const Cart = require("../models/Cart");
const Notification = require("../models/Notification");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

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

		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
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
						{ paymentScreenshot: { $exists: true, $ne: "" } },
						{ createdAt: { $gte: fiveMinutesAgo } }
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
}).single("paymentScreenshot");

exports.uploadPaymentScreenshot = (req, res) => {
	upload(req, res, async function (err) {
		if (err instanceof multer.MulterError) {
			return res.status(400).json({ error: err.message });
		} else if (err) {
			return res.status(400).json({ error: err.message });
		}

		console.log("🟡 Uploading payment screenshot...");
		console.log(req.file);

		const { id } = req.params;

		if (!req.file) {
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

			booking.paymentScreenshot = req.file.path;
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

// Verify Payment Proof (Doctor)
exports.verifyPaymentProof = async (req, res) => {
	const { id } = req.params;
	try {
		if (req.user.role !== 'doctor') {
			return res.status(403).json({ error: "Access denied. Only doctors can verify payments." });
		}
		const booking = await Booking.findById(id);
		if (!booking) {
			return res.status(404).json({ error: "Booking not found" });
		}
		if (booking.doctorId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Not authorized to verify payment for this booking" });
		}
		if (!booking.paymentScreenshot) {
			return res.status(400).json({ error: "No payment screenshot has been uploaded" });
		}

		booking.paymentStatus = "Completed";
		await booking.save();
		
		notifyDoctor(booking.doctorId);

		res.status(200).json({ message: "Booking status updated successfully", booking });
	} catch (error) {
		console.error("Error verifying payment:", error);
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

        // Logic to generate Jitsi link if the request is accepted
        if (requestAccept === "accepted") {
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

exports.prescribeMedicine = async (req, res) => {
	const {
		bookingId,
		medicineData
	} = req.body;

	try {
		// 1. Validate Input
		if (!bookingId || !medicineData) {
			return res.status(400).json({ error: "Booking ID and Medicine Data are required." });
		}

		// 2. Fetch the Booking first (We need patientId & doctorId for Cart/Notifs)
		const booking = await Booking.findById(bookingId);
		if (!booking) {
			return res.status(404).json({ error: "Booking not found." });
		}
		
		if (booking.doctorId.toString() !== req.user._id.toString()) {
		    return res.status(403).json({ error: "Not authorized to prescribe medicine for this booking" });
		}

		if (!medicineData.startDate || !medicineData.endDate) {
		    return res.status(400).json({ error: "Start date and End date are required." });
		}

		// --- STEP A: Update Booking (Prescription Logic) ---
		const newSupplement = {
			medicineName: medicineData.medicineName,
			reason: medicineData.reason,
			dosage: medicineData.dosage,
			instructions: medicineData.instructions,
			duration: `${medicineData.startDate} to ${medicineData.endDate}`,
			startDate: new Date(medicineData.startDate),
			endDate: new Date(medicineData.endDate),
			externalLink: medicineData.externalLink || ""
		};

		booking.recommendedSupplements.push(newSupplement);
		await booking.save();

		// --- STEP B: Check Inventory & Update Cart ---
		// 1. Search for the medicine in your DB (Case insensitive search, escaping regex)
		const escapedName = medicineData.medicineName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const medicineInStock = await Medicine.findOne({
			name: { $regex: new RegExp(`^${escapedName}$`, "i") }
		});

		let cartMessage = "";

		if (medicineInStock) {
			let cart = await Cart.findOne({ patientId: booking.patientId });

			// Calculate item details
			const itemToAdd = {
				medicineId: medicineInStock._id,
				quantity: 1, // Default to 1, or parse from dosage if you have logic for that
				price: medicineInStock.price
			};

			if (!cart) {
				// Create new cart if none exists
				cart = new Cart({
					patientId: booking.patientId,
					doctorId: booking.doctorId, // Linking to this specific doctor
					items: [itemToAdd],
					totalPrice: medicineInStock.price
				});
			} else {
				// Append to existing cart

				// Check if item already exists to avoid duplicates (Optional, but good UX)
				const existingItemIndex = cart.items.findIndex(
					item => item.medicineId.toString() === medicineInStock._id.toString()
				);

				if (existingItemIndex > -1) {
					// Item exists, just increase quantity
					cart.items[existingItemIndex].quantity += 1;
				} else {
					// Item does not exist, push new
					cart.items.push(itemToAdd);
				}

				// Recalculate Total Price
				cart.totalPrice += medicineInStock.price;
				cart.updatedAt = Date.now();
			}

			await cart.save();
			cartMessage = `and has been automatically added to your cart.`;
		} else {
			cartMessage = `but is currently unavailable in our store. Please purchase it externally.`;
		}

		// --- STEP C: Create Notification ---

		// Use doctorName from booking schema if available, otherwise "Your Doctor"
		const doctorName = booking.doctorName || "Your Doctor";

		const notificationMessage = `Dr. ${doctorName} prescribed ${medicineData.medicineName}. It has been added to your prescription list ${cartMessage}`;

		const newNotification = new Notification({
			userId: booking.patientId,
			role: 'patient',
			orderId: bookingId, // Linking to booking ID as reference
			type: 'system',
			message: notificationMessage,
			isRead: false
		});

		await newNotification.save();

		// --- Final Response ---

		return res.status(200).json({
			message: "Prescription added and cart processed successfully",
			currentPrescriptions: booking.recommendedSupplements,
			cartUpdated: !!medicineInStock
		});

	} catch (error) {
		console.error("Error prescribing medicine:", error);
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
		const processedBookings = bookings.map(booking => {
			const bookingObj = booking.toObject ? booking.toObject() : booking;
			const doctor = booking.doctorId;
			
			// Resolve the current startTime for the booking based on base template
			if (doctor && doctor.availableSlots) {
				const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(booking.dateOfAppointment).getDay()];
				const baseSlots = doctor.availableSlots[dayName] || [];
				const baseSlot = baseSlots.find(s => s._id.toString() === booking.slotId.toString());
				if (baseSlot) {
					bookingObj.timeSlot = baseSlot.startTime;
				}
			}

			if (doctor && Array.isArray(doctor.scheduleOverrides)) {
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
			return bookingObj;
		});

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

		const doctor = await Doctor.findById(doctorId);
		let processedBookings = bookings;
		if (doctor) {
			processedBookings = bookings.map(booking => {
				const bookingObj = booking.toObject ? booking.toObject() : booking;
				
				if (doctor.availableSlots) {
					const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(booking.dateOfAppointment).getDay()];
					const baseSlots = doctor.availableSlots[dayName] || [];
					const baseSlot = baseSlots.find(s => s._id.toString() === booking.slotId.toString());
					if (baseSlot) {
						bookingObj.timeSlot = baseSlot.startTime;
					}
				}

				// Process bookings with doctor schedule overrides (cancellations and reschedules)
				if (Array.isArray(doctor.scheduleOverrides)) {
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
				return bookingObj;
			});
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
