const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { uploadPaymentScreenshot } = require("../controllers/bookingController");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");
const {
  createBooking,
  getAllBookings,
  getNotifications,
  updateBookingStatus,
  updateMeetLink,
  deleteBooking,
  getRecommendedSupplements,
  updateRatingAndReview,
  getRatingAndReview,

  getBookingsByPatientId,
  getBookingsByDoctorId,
  getReviewedBookingsByPatientId,
  getReviewedBookingsForDoctorId,
  getBookingById,
  getDoctorPatientHistory,
  addSharedRecord,
  getOwnBookingsForSharing,
  addSupplement,
  updateSupplement,
  deleteSupplement,
  updateDiagnosis,
  notifyPrescription,
  updatePatientIllness
} = require("../controllers/bookingController");

// POST route to book an appointment
router.post("/", auth, createBooking);

// Route to fetch all bookings
router.get("/bookings", auth, getAllBookings);

// Route to fetch all notifications
router.get("/notifications", auth, getNotifications);

// PUT route to update booking requestAccept status
router.put("/update/:id", auth, updateBookingStatus);

router.put("/update/meet-link/:id", auth, updateMeetLink);

// DELETE route to delete a booking by ID
router.delete("/delete/:id", auth, deleteBooking);

// Route to get recommended supplements
router.get("/supplements/:id", auth, getRecommendedSupplements);

// Realtime prescription editing (doctor): add / edit / delete a medicine row,
// set the visit diagnosis, and explicitly notify the patient when finished.
router.post("/:id/supplements", auth, addSupplement);
router.put("/:id/supplements/:supplementId", auth, updateSupplement);
router.delete("/:id/supplements/:supplementId", auth, deleteSupplement);
router.put("/:id/diagnosis", auth, updateDiagnosis);
router.post("/:id/notify-prescription", auth, notifyPrescription);

// Patient edits their own reason-for-visit on an upcoming (accepted) booking
router.put("/:id/illness", auth, updatePatientIllness);

// Route to update rating and review
router.put("/rating-review/:id", auth, updateRatingAndReview);

// Route to get rating and review
router.get("/rating-review/:id", auth, getRatingAndReview);

router.get("/reviews/:doctorEmail", async (req, res) => {
  const { doctorEmail } = req.params;
  try {
    const reviews = await Booking.find({
      doctorEmail,
      rating: { $ne: null },
      review: { $ne: "" },
    }).select("patientName rating review dateOfAppointment");
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/:id/payment", auth, bookingController.uploadPaymentScreenshot);

// Stream notifications for doctor dashboard (SSE)
router.get("/stream-notifications/:doctorId", auth, bookingController.streamNotifications);

// Get bookings by patient ID
router.get("/patient/:patientId", auth, getBookingsByPatientId);

// Get bookings by doctor ID
router.get("/doctor/:doctorId", auth, getBookingsByDoctorId);

// Get reviewed bookings by patient ID
router.get("/patient/reviews/:patientId", auth, getReviewedBookingsByPatientId);

// Get reviewed bookings by doctor ID
router.get("/doctor/reviews/:doctorId", auth, getReviewedBookingsForDoctorId);

// Doctor's own prescription history with a specific patient (not other doctors' bookings)
router.get("/history/patient/:patientId", auth, getDoctorPatientHistory);

// Patient shares a record (external file or a reference to their own past booking) onto a booking
router.post("/:id/shared-records", auth, addSharedRecord);

// Patient's own past bookings that have a prescription, to pick from when sharing
router.get("/sharing/own-bookings", auth, getOwnBookingsForSharing);

// Get a single booking by ID — kept LAST so it doesn't shadow the more specific routes above
router.get("/:id", auth, getBookingById);

module.exports = router;
