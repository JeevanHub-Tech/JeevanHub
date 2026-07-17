import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./PatientList.css";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from '../../config';

// Assuming parseAppointmentDateTime is available somewhere, or we define a simple version:
const parseAppointmentDateTime = (dateString, timeSlot) => {
	const appointmentDate = new Date(dateString);
	// Guard: a booking whose slot no longer resolves has no timeSlot — fall back to
	// the date itself rather than crashing the whole screen.
	if (!timeSlot || typeof timeSlot !== "string") return appointmentDate;
	const startTimePart = timeSlot.split(" - ")[0].trim();
	let [hours, minutes] = startTimePart.split(/[:\s]/).map(Number); // Simple split
	const period = startTimePart.includes('PM') ? 'PM' : 'AM';

	if (period === "PM" && hours !== 12) {
		hours += 12;
	} else if (period === "AM" && hours === 12) {
		hours = 0;
	}

	appointmentDate.setHours(hours || 0, minutes || 0, 0, 0);
	return appointmentDate;
};

// Matches the helpers used in CurrentRequests.js / AppointmentSlots.js for a uniform look
const format12HourTime = (timeStr) => {
	if (!timeStr) return '';
	if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;
	let [hours, minutes] = timeStr.split(':');
	hours = parseInt(hours, 10);
	const ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12;
	hours = hours ? hours : 12;
	hours = hours < 10 ? '0' + hours : hours;
	return `${hours}:${minutes} ${ampm}`;
};

const timeElapsed = (dateStr) => {
	if (!dateStr) return 'Recently';
	const diff = Date.now() - new Date(dateStr).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
};


function PatientList() {
	const [activeTab, setActiveTab] = useState("Previous");
	const navigate = useNavigate();
	// State for categorized appointments
	const [previousAppointments, setPreviousAppointments] = useState([]);
	const [deniedAppointments, setDeniedAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Payment proof gallery/lightbox + illness modal state (matches CurrentRequests.js / AppointmentSlots.js)
	const [galleryImages, setGalleryImages] = useState([]);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [selectedIllness, setSelectedIllness] = useState(null);

	const { auth } = useContext(AuthContext);
	const doctorId = auth.user?.id;

	useEffect(() => {
		const fetchAppointments = async () => {
			try {
				if (!doctorId) {
					setLoading(false);
					setError("Error: Doctor ID not found.");
					return;
				}

				const response = await authFetch(
					// Fetch ALL bookings for the doctor ID
					`${BACKEND_URL}/api/bookings/doctor/${doctorId}`
				);

				if (!response.ok) {
					// Handle 404 gracefully if no data exists
					if (response.status === 404) {
						setPreviousAppointments([]);
						setDeniedAppointments([]);
						setLoading(false);
						return;
					}
					throw new Error("Failed to fetch appointments");
				}

				const data = await response.json();
				const currentTime = new Date();
				const rawBookings = Array.isArray(data.bookings) ? data.bookings : [];

				const previous = [];
				const denied = [];

				rawBookings.forEach((appointment) => {
					// 1. Classify Denied Requests
					if (appointment.requestAccept === "denied") {
						denied.push(appointment);
						return; // Move to the next booking
					}

					// 2. Classify Previous/Completed Appointments
					// Only check accepted appointments for completion status
					if (appointment.requestAccept === "accepted") {

						// Parse date/time to determine if the appointment is in the past
						const appointmentDateTime = parseAppointmentDateTime(
							appointment.dateOfAppointment,
							appointment.timeSlot
						);

						// Define completion as 30 minutes AFTER the scheduled start time
						const endTime = new Date(appointmentDateTime);
						endTime.setMinutes(endTime.getMinutes() + 30);

						if (currentTime > endTime) {
							previous.push(appointment);
						}
					}
					// Note: Appointments that are 'accepted' but still in the future 
					// will be ignored by this component (they belong in CurrentRequests).
				});

				// Sort previous appointments by date (most recent first)
				previous.sort((a, b) => new Date(b.dateOfAppointment) - new Date(a.dateOfAppointment));
				denied.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


				setPreviousAppointments(previous);
				setDeniedAppointments(denied);
				setLoading(false);

			} catch (error) {
				setError(error.message);
				setLoading(false);
			}
		};

		fetchAppointments();
	}, [doctorId]); // Removed redundant 'email', using doctorId only

	if (loading) {
		return <p style={{ marginTop: "150px", padding: "15px", background: "white", width: "max-content", borderRadius: "15px", marginLeft: "50px" }}>Loading...</p>;
	}

	if (error) {
		return <p style={{ marginTop: "150px", padding: "15px", background: "white", width: "max-content", borderRadius: "15px", marginLeft: "50px" }}>Error: {error}</p>;
	}

	return (
		<div className="patient-list-container">
			<h1>Patient List</h1>

			{/* Tabs for Previous Appointments and Denied Requests */}
			<div className="tabs">
				<button
					onClick={() => setActiveTab("Previous")}
					className={`tab ${activeTab === "Previous" ? "active" : ""}`}
				>
					Previous Appointments
				</button>
				<button
					onClick={() => setActiveTab("Denied")}
					className={`tab ${activeTab === "Denied" ? "active" : ""}`}
				>
					Denied Requests
				</button>
			</div>

			{/* Previous Appointments Section */}
			{activeTab === "Previous" && (
				<div className="appointment-list">
					{previousAppointments.length === 0 ? (
						<p className="noRequest">No previous appointments found.</p>
					) : (
						previousAppointments.map((appointment) => {
							const hasScreenshots = appointment.paymentScreenshots && appointment.paymentScreenshots.length > 0;
							const isPendingPayment = appointment.amountPaid > 0 && appointment.paymentStatus === "Pending";
							const supplementCount = appointment.recommendedSupplements?.length || 0;

							return (
								<div key={appointment._id} className="req-card">
									<div className="req-card-grid">
										{/* Left Column: Patient Profile */}
										<div className="req-col req-patient">
											<div className="req-patient-header">
												<h3 title="Patient Name">{appointment.patientName}</h3>
												{appointment.isReturningPatient ? (
													<span className="req-badge returning" title="Has previously booked appointments with you">Returning</span>
												) : (
													<span className="req-badge new" title="First-time booking with you">New</span>
												)}
											</div>
											<p className="req-subtext" title={`Age: ${appointment.patientAge} yrs | Gender: ${appointment.patientGender} | Email: ${appointment.patientEmail}`}>
												{appointment.patientAge || 'N/A'} yrs • {appointment.patientGender || 'N/A'} • {appointment.patientEmail || 'N/A'}
											</p>
											<div className="req-illness">
												<strong>Illness:</strong>{" "}
												{appointment.patientIllness && appointment.patientIllness.length > 80 ? (
													<>
														{appointment.patientIllness.substring(0, 80)}...
														<button className="req-btn-link" onClick={() => setSelectedIllness(appointment.patientIllness)}>More</button>
													</>
												) : (
													appointment.patientIllness || "No illness information"
												)}
											</div>
											{appointment.rating ? (
												<div className="req-time" title="Patient's feedback for this consultation">
													⭐ {appointment.rating}/5{appointment.review ? ` — "${appointment.review}"` : ''}
												</div>
											) : (
												<div className="req-time">No review submitted yet</div>
											)}
										</div>

										{/* Middle Column: Appointment & Payment */}
										<div className="req-col req-appointment">
											<div className="req-schedule">
												<div className="req-date-time-col">
													<div className="req-date" title="Date of Appointment">
														📅 {new Date(appointment.dateOfAppointment).toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
													</div>
													<div className="req-time-slot" title="Time of Appointment">
														⏰ {format12HourTime(appointment.timeSlot)}
													</div>
												</div>
												<div className="req-price-wrapper">
													<div className="req-price-badge" title="Consultation Fee">
														{appointment.amountPaid === 0 ? (
															<span className="req-badge free">Free</span>
														) : (
															<span className="req-badge paid">₹{appointment.amountPaid}</span>
														)}
													</div>
												</div>
											</div>

											{appointment.paymentStatus === "Completed" && (
												<p style={{ marginTop: '12px', color: '#15803d', fontWeight: '700', fontSize: '14px' }}>✅ Payment Verified</p>
											)}

											{hasScreenshots && (
												<div className="req-gallery">
													<p className="req-gallery-title">Payment Proofs ({appointment.paymentScreenshots.length}):</p>
													<div className="req-gallery-grid">
														{appointment.paymentScreenshots.map((proof, index) => {
															const imgUrl = proof.startsWith("http") ? proof : `${BACKEND_URL || 'http://localhost:8080'}/${proof}`;
															return (
																<img
																	key={index}
																	src={imgUrl}
																	alt={`Payment Proof ${index + 1}`}
																	className="req-thumb"
																	onClick={() => {
																		setGalleryImages(appointment.paymentScreenshots);
																		setCurrentImageIndex(index);
																	}}
																/>
															);
														})}
													</div>
												</div>
											)}

											{isPendingPayment && !hasScreenshots && (
												<p style={{ marginTop: '12px', color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>⏳ Awaiting payment proof</p>
											)}

											{supplementCount > 0 && (
												<p className="req-gallery-title" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1' }}>
													💊 {supplementCount} medicine{supplementCount > 1 ? 's' : ''} prescribed
												</p>
											)}
										</div>

										{/* Right Column: Actions */}
										<div className="req-col req-actions">
											<button
												className="req-btn"
												style={{ background: '#3b82f6', color: 'white' }}
												onClick={() => navigate(`/doctorsprescribe/${appointment._id}`)}
											>
												Prescribe Medicine & Diet - Yoga Plan
											</button>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			)}

			{/* Denied Requests Section */}
			{activeTab === "Denied" && (
				<div className="appointment-list">
					{deniedAppointments.length === 0 ? (
						<p className="noRequest">No denied requests found.</p>
					) : (
						deniedAppointments.map((appointment) => (
							<div key={appointment._id} className="req-card denied">
								<div className="req-card-grid two-col">
									{/* Left Column: Patient Profile */}
									<div className="req-col req-patient">
										<div className="req-patient-header">
											<h3 title="Patient Name">{appointment.patientName}</h3>
											<span className="req-badge denied-badge" title="This request was denied">Denied</span>
											{appointment.isReturningPatient ? (
												<span className="req-badge returning" title="Has previously booked appointments with you">Returning</span>
											) : (
												<span className="req-badge new" title="First-time booking with you">New</span>
											)}
										</div>
										<p className="req-subtext" title={`Age: ${appointment.patientAge} yrs | Gender: ${appointment.patientGender} | Email: ${appointment.patientEmail}`}>
											{appointment.patientAge || 'N/A'} yrs • {appointment.patientGender || 'N/A'} • {appointment.patientEmail || 'N/A'}
										</p>
										<div className="req-illness">
											<strong>Illness:</strong>{" "}
											{appointment.patientIllness && appointment.patientIllness.length > 80 ? (
												<>
													{appointment.patientIllness.substring(0, 80)}...
													<button className="req-btn-link" onClick={() => setSelectedIllness(appointment.patientIllness)}>More</button>
												</>
											) : (
												appointment.patientIllness || "No illness information"
											)}
										</div>
										<div className="req-time" title="Time since the appointment was requested">
											⏱ Requested {timeElapsed(appointment.createdAt)}
										</div>
									</div>

									{/* Right Column: Requested Appointment & Denial Reason */}
									<div className="req-col req-appointment">
										<div className="req-schedule">
											<div className="req-date-time-col">
												<div className="req-date" title="Requested Date">
													📅 {new Date(appointment.dateOfAppointment).toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
												</div>
												<div className="req-time-slot" title="Requested Time">
													⏰ {format12HourTime(appointment.timeSlot)}
												</div>
											</div>
											<div className="req-price-wrapper">
												<div className="req-price-badge" title="Consultation Fee">
													{appointment.amountPaid === 0 ? (
														<span className="req-badge free">Free</span>
													) : (
														<span className="req-badge paid">₹{appointment.amountPaid}</span>
													)}
												</div>
											</div>
										</div>
										<div className="req-denial">
											<strong>Reason for Denial</strong>
											{appointment.doctorsMessage || "No reason was provided."}
										</div>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			)}

			{/* Payment Proof Image Gallery Modal */}
			{galleryImages.length > 0 && (
				<div className="gallery-overlay" onClick={() => setGalleryImages([])}>
					<div className="gallery-modal" onClick={e => e.stopPropagation()}>
						<button className="gallery-close" onClick={() => setGalleryImages([])}>×</button>

						{galleryImages.length > 1 && (
							<button
								className="gallery-nav prev"
								onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
							>
								&#10094;
							</button>
						)}

						<img
							src={galleryImages[currentImageIndex]?.startsWith("http") ? galleryImages[currentImageIndex] : `${BACKEND_URL || 'http://localhost:8080'}/${galleryImages[currentImageIndex]}`}
							alt="Enlarged Proof"
							className="gallery-image-large"
						/>

						{galleryImages.length > 1 && (
							<button
								className="gallery-nav next"
								onClick={() => setCurrentImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
							>
								&#10095;
							</button>
						)}

						{galleryImages.length > 1 && (
							<div className="gallery-dots">
								{galleryImages.map((_, idx) => (
									<span
										key={idx}
										className={`gallery-dot ${idx === currentImageIndex ? 'active' : ''}`}
										onClick={() => setCurrentImageIndex(idx)}
									></span>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Illness Modal */}
			{selectedIllness && (
				<div className="gallery-overlay" onClick={() => setSelectedIllness(null)}>
					<div className="gallery-modal" style={{ padding: '32px', maxWidth: '600px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
						<button className="gallery-close" style={{ color: '#1e293b', background: '#f1f5f9' }} onClick={() => setSelectedIllness(null)}>×</button>
						<h3 style={{ marginTop: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Patient's Illness Details</h3>
						<p style={{ lineHeight: '1.6', color: '#334155', fontSize: '15px', margin: 0, whiteSpace: 'pre-wrap' }}>{selectedIllness}</p>
					</div>
				</div>
			)}
		</div>
	);
}

export default PatientList;
