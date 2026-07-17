import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./AppointmentSlots.css"; // We copied CurrentRequests.css logic here
import SlotManagement from "../../components/SlotManagement";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from '../../config';

function AppointmentSlots() {
	const [appointments, setAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showManageSlots, setShowManageSlots] = useState(false);

	const [galleryImages, setGalleryImages] = useState([]);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [selectedIllness, setSelectedIllness] = useState(null);
	const [expandedProofs, setExpandedProofs] = useState({}); // To track which booking's proofs are visible

	const { auth } = useContext(AuthContext);
	const doctorId = auth.user?.id;
	const email = localStorage.getItem("email");
	const navigate = useNavigate();

	const toggleProofs = (id) => {
		setExpandedProofs(prev => ({ ...prev, [id]: !prev[id] }));
	};

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

	const parseAppointmentDateTime = (dateString, timeSlot) => {
		const appointmentDate = new Date(dateString);
		// Guard: a booking whose slot no longer resolves has no timeSlot — fall back to
		// the date itself rather than crashing the whole screen.
		if (!timeSlot || typeof timeSlot !== "string") return appointmentDate;
		const startTimePart = timeSlot.split(" - ")[0].trim();
		const [time, period] = startTimePart.split(" ");
		let [hours, minutes] = time.split(":").map(Number);

		if (period === "PM" && hours !== 12) hours += 12;
		else if (period === "AM" && hours === 12) hours = 0;

		appointmentDate.setHours(hours || 0, minutes || 0, 0, 0);
		return appointmentDate;
	};

	useEffect(() => {
		const fetchAppointments = async () => {
			try {
				if (!doctorId) {
					setLoading(false);
					setError("Error: Doctor ID not found.");
					return;
				}

				const response = await authFetch(
					`${BACKEND_URL}/api/bookings/doctor/${doctorId}`,
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`
						}
					}
				);

				if (!response.ok) throw new Error("Failed to fetch appointments");

				const data = await response.json();
				const currentTime = new Date();
				const cutoffTime = new Date(currentTime);
				cutoffTime.setMinutes(cutoffTime.getMinutes() - 30);

				const rawBookings = Array.isArray(data.bookings) ? data.bookings : [];

				const filteredAppointments = rawBookings
					.filter((appointment) => {
						if (appointment.requestAccept !== "accepted") return false;
						if (appointment.doctorEmail !== email) return false;

						const appointmentDateTime = parseAppointmentDateTime(
							appointment.dateOfAppointment,
							appointment.timeSlot
						);

						return appointmentDateTime >= cutoffTime;
					})
					.sort((a, b) => {
						const dateA = parseAppointmentDateTime(a.dateOfAppointment, a.timeSlot);
						const dateB = parseAppointmentDateTime(b.dateOfAppointment, b.timeSlot);
						return dateA.getTime() - dateB.getTime();
					});

				setAppointments(filteredAppointments);
				setLoading(false);
			} catch (error) {
				setError(error.message);
				setLoading(false);
			}
		};

		fetchAppointments();
		const intervalId = setInterval(fetchAppointments, 60000);
		return () => clearInterval(intervalId);
	}, [doctorId, email]);

	const handleJoinMeet = (link) => {
		if (link && link !== "no") {
			window.open(link, "_blank");
		} else {
			alert("Meeting link is not available for this appointment.");
		}
	};

	const isAppointmentActive = (appointment) => {
		const now = new Date();
		const startTime = parseAppointmentDateTime(appointment.dateOfAppointment, appointment.timeSlot);
		const endTime = new Date(startTime);
		endTime.setMinutes(endTime.getMinutes() + 30);
		return now >= startTime && now <= endTime;
	};

	if (loading) return <p style={{ marginTop: "150px", padding: "15px", background: "white", width: "max-content", borderRadius: "15px", marginLeft: "50px" }}>Loading...</p>;
	if (error) return <p style={{ marginTop: "150px", padding: "15px", background: "white", width: "max-content", borderRadius: "15px", marginLeft: "50px" }}>Error: {error}</p>;

	return (
		<div className="appointments-container">
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 10px' }}>
				<h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>My Appointment Slots</h1>
				<button 
					onClick={() => setShowManageSlots(!showManageSlots)}
					style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
				>
					{showManageSlots ? 'Close Manage Slots' : 'Manage Slots'}
				</button>
			</div>

			{showManageSlots && (
				<div style={{ marginBottom: '30px' }}>
					<SlotManagement doctorId={doctorId} token={auth.token} defaultPrice={auth.user?.price || 500} />
				</div>
			)}

			<p style={{ padding: '0 10px', color: '#64748b', marginBottom: '20px' }}>Showing upcoming appointments and those from the past 30 minutes.</p>
			
			{appointments.length === 0 ? (
				<p className="noRequest" style={{ marginLeft: '10px' }}>No upcoming appointments found.</p>
			) : (
				appointments.map((request) => {
					const isActive = isAppointmentActive(request);
					const hasMeetLink = request.meetLink && request.meetLink !== "no";

					return (
						<div key={request._id} className="req-card" style={{ borderColor: isActive ? '#3b82f6' : '#e2e8f0', boxShadow: isActive ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : undefined }}>
							<div className="req-card-grid">
								{/* Left Column: Patient Profile */}
								<div className="req-col req-patient">
									<div className="req-patient-header">
										<h3 title="Patient Name">{request.patientName}</h3>
										{isActive && (
											<span className="req-badge" style={{ background: '#3b82f6', color: 'white', border: 'none' }} title="Appointment is currently ongoing">Active Now</span>
										)}
										{!isActive && request.isReturningPatient ? (
											<span className="req-badge returning" title="Has previously booked appointments with you">Returning</span>
										) : !isActive ? (
											<span className="req-badge new" title="First-time booking with you">New</span>
										) : null}
									</div>
									<p className="req-subtext" title={`Age: ${request.patientAge} yrs | Gender: ${request.patientGender} | Email: ${request.patientEmail}`}>
										{request.patientAge || 'N/A'} yrs • {request.patientGender || 'N/A'} • {request.patientEmail || 'N/A'}
									</p>
									<div className="req-illness">
										<strong>Illness:</strong>{" "}
										{request.patientIllness && request.patientIllness.length > 80 ? (
											<>
												{request.patientIllness.substring(0, 80)}...
												<button className="req-btn-link" onClick={() => setSelectedIllness(request.patientIllness)}>More</button>
											</>
										) : (
											request.patientIllness || "No illness information"
										)}
									</div>
									<div className="req-time" title="Time since the appointment was requested">
										⏱ Requested {timeElapsed(request.createdAt)}
									</div>
								</div>

								{/* Middle Column: Appointment & Payment */}
								<div className="req-col req-appointment">
									<div className="req-schedule">
										<div className="req-date-time-col">
											<div className="req-date" title="Date of Appointment">
												📅 {new Date(request.dateOfAppointment).toLocaleDateString("en-GB", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
											</div>
											<div className="req-time-slot" title="Time of Appointment">
												⏰ {format12HourTime(request.timeSlot)}
											</div>
										</div>
										<div className="req-price-wrapper">
											<div className="req-price-badge" title="Consultation Fee">
												{request.amountPaid === 0 ? (
													<span className="req-badge free">Free</span>
												) : (
													<span className="req-badge paid">₹{request.amountPaid}</span>
												)}
											</div>
										</div>
									</div>
									{request.amountPaid > 0 && request.paymentScreenshots && request.paymentScreenshots.length > 0 && (
										<div className="req-gallery">
											<div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => toggleProofs(request._id)}>
												<p className="req-gallery-title" style={{ margin: 0, color: '#4f46e5', fontWeight: '600' }}>
													View Payment Proofs ({request.paymentScreenshots.length})
												</p>
												<span style={{ fontSize: '12px', color: '#4f46e5', transition: 'transform 0.2s', transform: expandedProofs[request._id] ? 'rotate(180deg)' : 'rotate(0deg)' }}>
													▼
												</span>
											</div>
											{expandedProofs[request._id] && (
												<div className="req-gallery-grid" style={{ marginTop: '12px' }}>
													{request.paymentScreenshots.map((proof, idx) => {
														const imgUrl = proof.startsWith("http") ? proof : `${BACKEND_URL || 'http://localhost:8080'}/${proof}`;
														return (
															<img 
																key={idx}
																src={imgUrl} 
																alt={`Proof ${idx + 1}`} 
																className="req-thumb"
																onClick={() => {
																	setGalleryImages(request.paymentScreenshots);
																	setCurrentImageIndex(idx);
																}}
															/>
														);
													})}
												</div>
											)}
										</div>
									)}
								</div>

								{/* Right Column: Actions */}
								<div className="req-col req-actions">
									{hasMeetLink ? (
										<button className="req-btn accept" style={{ background: '#10b981', border: 'none' }} onClick={() => handleJoinMeet(request.meetLink)}>
											Join Meet
										</button>
									) : (
										<button className="req-btn" style={{ background: '#94a3b8', color: 'white', border: 'none', cursor: 'not-allowed' }} disabled>
											Meeting Link Pending
										</button>
									)}
									
									<button 
										className="req-btn" 
										style={{ background: '#3b82f6', color: 'white', border: 'none' }} 
										onClick={() => navigate(`/doctorsprescribe/${request._id}`)}
									>
										Prescribe Medicine & Diet - Yoga Plan
									</button>
								</div>
							</div>
						</div>
					);
				})
			)}

			{/* Image Gallery Modal */}
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

export default AppointmentSlots;
