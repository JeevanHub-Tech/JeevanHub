import React, { useState, useEffect } from "react";
import "./AppointedDoctor.css";
import RatingModal from "./RatingModal";
import AppointmentTab from "./AppointmentTab";
import { fetchDoctorData, fetchSupplements } from "./AppointmentUtils";
import { useNavigate } from 'react-router-dom';
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from '../../../config';

function AppointedDoctor() {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("Upcoming");
	const [pendingDoctors, setPendingDoctors] = useState([]);
	const [upcomingAppointments, setUpcomingAppointments] = useState([]);
	const [deniedDoctors, setDeniedDoctors] = useState([]);
	const [previousAppointments, setPreviousAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [supplements, setSupplements] = useState({});
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
	const [rating, setRating] = useState(0);
	const [review, setReview] = useState("");

	const email = localStorage.getItem("email");

	const handleRatingSubmit = async () => {
		if (!currentAppointmentId || !rating) {
			alert("Please provide a rating before submitting.");
			return;
		}

		try {
			const response = await authFetch(
				`${BACKEND_URL}/api/bookings/rating-review/${currentAppointmentId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("token")}`
					},
					body: JSON.stringify({ rating, review }),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to submit rating and review");
			}

			// Update the local state to reflect the new rating and review
			const updatedAppointments = upcomingAppointments.map((appointment) =>
				appointment._id === currentAppointmentId
					? { ...appointment, rating, review }
					: appointment
			);
			setUpcomingAppointments(updatedAppointments);

			const updatedPreviousAppointments = previousAppointments.map(
				(appointment) =>
					appointment._id === currentAppointmentId
						? { ...appointment, rating, review }
						: appointment
			);
			setPreviousAppointments(updatedPreviousAppointments);

			// Close the modal and reset the state
			setIsModalOpen(false);
			setRating(0);
			setReview("");
		} catch (error) {
			console.error("Error submitting rating and review:", error);
			alert("Failed to submit rating and review. Please try again.");
		}
	};

	useEffect(() => {
		const loadData = async () => {
			try {
				const data = await fetchDoctorData();
				// Filter bookings for the logged-in patient
				const patientBookings = data.bookings;
				console.log("Patient Bookings:", patientBookings);

				const currentDate = new Date();

				// Sort bookings into upcoming, past, pending, and denied
				const sortedBookings = patientBookings.reduce(
					(acc, booking) => {
						const appointmentDate = new Date(booking.dateOfAppointment);
						const isPastAppointment = appointmentDate < currentDate;
						// const isWithinOneDayAfterAppointment =
						// 	appointmentDate < currentDate &&
						// 	currentDate - appointmentDate <= 24 * 60 * 60 * 1000;

						const status = booking.requestAccept?.toLowerCase();
						// values like "accepted" | "pending" | "denied"

						// Past appointments (but not within 1 day after)
						// if (isPastAppointment && !isWithinOneDayAfterAppointment) {
						if (isPastAppointment) {

							let appointmentWithSource = { ...booking };

							if (status === "accepted") {
								appointmentWithSource.source = "Completed";
								acc.previous.push(appointmentWithSource);
							} else if (status === "denied") {
								appointmentWithSource.source = "Denied";
								acc.denied.push(appointmentWithSource);
							} else if (status === "pending") {
								appointmentWithSource.source = "Pending";
								acc.pending.push(appointmentWithSource);
							}
						}
						// Upcoming / Pending / Denied
						// else if (!isPastAppointment || isWithinOneDayAfterAppointment) {
						else if (!isPastAppointment) {
							let appointmentWithSource = { ...booking };
							if (status === "pending") {
								appointmentWithSource.source = "Pending";
								acc.pending.push(appointmentWithSource);
							} else if (status === "accepted") {
								appointmentWithSource.source = "Upcoming";
								acc.upcoming.push(appointmentWithSource);
							} else if (status === "denied") {
								appointmentWithSource.source = "Denied";
								acc.denied.push(appointmentWithSource);
							}
						}


						return acc;
					},
					{ pending: [], upcoming: [], denied: [], previous: [] }
				);


				setPendingDoctors(sortedBookings.pending);
				setUpcomingAppointments(sortedBookings.upcoming);
				setDeniedDoctors(sortedBookings.denied);
				setPreviousAppointments(sortedBookings.previous);
				setLoading(false);

				// Fetch supplements for completed upcoming and previous appointments
				[...sortedBookings.upcoming, ...sortedBookings.previous].forEach(
					(appointment) => {
						if (
							appointment.source === "Completed" ||
							appointment.requestAccept === "accepted"
						) {
							fetchSupplementsForAppointment(appointment._id);
						}
					}
				);
			} catch (error) {
				console.error("Error fetching doctor data:", error);
				setError(error.message);
				setLoading(false);
			}
		};

		loadData();
	}, [email]);

	// The illness/reason-for-visit is only editable on upcoming appointments,
	// so this only ever needs to patch that one array.
	const handleIllnessUpdated = (appointmentId, newIllness) => {
		setUpcomingAppointments((prev) =>
			prev.map((a) => (a._id === appointmentId ? { ...a, patientIllness: newIllness } : a))
		);
	};

	// A cancelled pending request is deleted outright on the backend — drop it
	// from local state so it disappears without waiting for a refetch.
	const handleRequestCancelled = (appointmentId) => {
		setPendingDoctors((prev) => prev.filter((a) => a._id !== appointmentId));
	};

	const fetchSupplementsForAppointment = async (appointmentId) => {
		const supplementsData = await fetchSupplements(appointmentId);
		setSupplements((prev) => ({
			...prev,
			[appointmentId]: supplementsData || [],
		}));
	};

	const handlePayFees = async (doctorId, bookingId) => {
		try {
			const response = await authFetch(`${BACKEND_URL}/api/doctors/${doctorId}/qr-code`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`
				}
			});
			const data = await response.json();

			if (!data.qrCode || !data.price) {
				throw new Error("Incomplete doctor payment data");
			}

			// ✅ Open payment page with both qrCode and price in query
			const query = new URLSearchParams({
				qrCode: data.qrCode,
				price: data.price,
				bookingId: bookingId,
			}).toString();

			navigate(`/payment2?${query}`, "_blank");
		} catch (error) {
			console.error("Error fetching QR code:", error);
			alert("Failed to fetch QR code. Please try again later.");
		}
	};




	// if (loading) {
	// 	return <p style={{marginTop:"150px",padding:"15px", background:"white", width:"max-content", borderRadius:"15px", marginLeft:"50px"}}>Loading...</p>;
	// }

	// if (error) {
	// 	return <p style={{marginTop:"150px",padding:"15px", background:"white", width:"max-content", borderRadius:"15px", marginLeft:"50px"}}>Error: {error}</p>;
	// }

	return (
		<>
			<div className="appointed-container">
				{/* Tabs for Upcoming, Pending, Denied, and Previous Appointments */}
				<div className="tabs">
					<button
						onClick={() => setActiveTab("Upcoming")}
						className={`tab ${activeTab === "Upcoming" ? "active" : ""}`}
					>
						Upcoming <span className="tab-count">{upcomingAppointments.length}</span>
					</button>
					<button
						onClick={() => setActiveTab("Pending")}
						className={`tab ${activeTab === "Pending" ? "active" : ""}`}
					>
						Pending <span className="tab-count">{pendingDoctors.length}</span>
					</button>
					<button
						onClick={() => setActiveTab("Denied")}
						className={`tab ${activeTab === "Denied" ? "active" : ""}`}
					>
						Denied <span className="tab-count">{deniedDoctors.length}</span>
					</button>
					<button
						onClick={() => setActiveTab("Previous")}
						className={`tab ${activeTab === "Previous" ? "active" : ""}`}
					>
						Previous <span className="tab-count">{previousAppointments.length}</span>
					</button>
				</div>

				<AppointmentTab
					activeTab={activeTab}
					upcomingAppointments={upcomingAppointments}
					pendingDoctors={pendingDoctors}
					deniedDoctors={deniedDoctors}
					previousAppointments={previousAppointments}
					supplements={supplements}
					handlePayFees={handlePayFees}
					onRatingClick={(appointmentId) => {
						setCurrentAppointmentId(appointmentId);
						setIsModalOpen(true);
					}}
					onIllnessUpdated={handleIllnessUpdated}
					onRequestCancelled={handleRequestCancelled}
				/>

				{/* Rating Modal */}
				<RatingModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					onSubmit={handleRatingSubmit}
					rating={rating}
					setRating={setRating}
					review={review}
					setReview={setReview}
				/>
			</div>
		</>
	);
}

export default AppointedDoctor;
