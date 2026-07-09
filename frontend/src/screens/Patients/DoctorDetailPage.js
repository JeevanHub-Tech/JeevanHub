import React, { useState, useContext, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import "./DoctorDetailPage.css"; // Ensure this path matches the location of your CSS file
import { AuthContext } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import defaultProfilePic from '../../media/default-profile.png';

const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function DoctorDetail() {
	const location = useLocation();
	const { doctor } = location.state;
	
	const specializations = Array.isArray(doctor.specialization) 
		? doctor.specialization 
		: (doctor.specialization || "").toString().split(',').map(s => s.trim()).filter(Boolean);

	const { auth } = useContext(AuthContext);
	const patientFirstName = auth.user?.firstName || "Patient";
	const patientLastName = auth.user?.lastName || "";
	const patientGender = auth.user?.gender;
	const patientAge = auth.user?.age;

	const patientName = patientFirstName + " " + patientLastName;

	const [selectedTime, setSelectedTime] = useState(null); // Track selected slot object
	const [patientIllness, setPatientIllness] = useState("");

	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);
	const [dateOfAppointment, setDateOfAppointment] = useState(getLocalDateString()); // Default to today
	const [availableSlots, setAvailableSlots] = useState([]);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [showAllSlots, setShowAllSlots] = useState(false);
	const [zoomImage, setZoomImage] = useState(false);
	const [carouselStartDate, setCarouselStartDate] = useState(getLocalDateString());
	const dates = useMemo(() => {
		const d = [];
		const [year, month, day] = carouselStartDate.split("-").map(Number);
		for (let i = 0; i < 14; i++) {
			const date = new Date(year, month - 1, day);
			date.setDate(date.getDate() + i);
			d.push(date);
		}
		return d;
	}, [carouselStartDate]);
	const [reviews, setReviews] = useState([]);
	const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });

	// Helper function to decode and extract patient ID from JWT token
	const getPatientIdFromToken = () => {
		const token = localStorage.getItem("token");
		if (token) {
			try {
				const decoded = jwtDecode(token);
				// Assuming your token payload includes the MongoDB user ID field, often named 'id' or 'userId'
				return decoded.id || decoded.userId || null;
			} catch (e) {
				console.error("Failed to decode token:", e);
				return null;
			}
		}
		return null;
	};

	const patientId = getPatientIdFromToken();

	const handleTimeSlotClick = (time) => {
		setSelectedTime(time); // Set the selected time slot
	};

	const handleBookAppointment = async () => {
		if (selectedTime && patientIllness && dateOfAppointment) {
			const email = localStorage.getItem("email");
			const role = localStorage.getItem("role");

			const convertTo24Hour = (timeStr) => {
				let [time, modifier] = timeStr.split(" ");
				let [hours, minutes] = time.split(":");

				if (modifier === "PM" && hours !== "12") {
					hours = parseInt(hours, 10) + 12;
				}
				if (modifier === "AM" && hours === "12") {
					hours = "00";
				}

				return `${hours}:${minutes}`;
			};

			const time24 = convertTo24Hour(selectedTime.startTime);
			const [year, month, day] = dateOfAppointment.split("-");
			const [hours, minutes] = time24.split(":");

			const appointmentDateTime = new Date(
				year,
				month - 1,
				day,
				hours,
				minutes
			);

			const now = new Date();

			const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

			if (appointmentDateTime <= oneHourLater) {
				setStatusMessage({
					message: "Please select a time at least 1 hour from now.",
					type: "error"
				});
				return;
			}

			console.log(`Selected time: ${selectedTime.startTime}`);
			console.log(`Patient Illness: ${patientIllness}`);
			console.log(`User Email: ${email}`);
			console.log(`User Role: ${role}`);

			// Ensure patientId is available
			if (!patientId) {
				setStatusMessage({ message: "Authentication failed. Please log in again.", type: 'error' });
				return;
			}

			if (role !== "patient") {
				setStatusMessage({ message: "Only patients can book appointments.", type: 'error' });
				return;
			}

			const patientEmail = localStorage.getItem("email");

			// Data to be sent to the backend
			let bookingData = {
				doctorId: doctor.id || doctor._id,
				doctorName: doctor.name,
				doctorEmail: doctor.email,
				timeSlot: selectedTime.startTime,
				dateOfAppointment: dateOfAppointment,
				patientId: patientId,
				patientEmail: patientEmail,
				email: email,
				patientName: patientName,
				patientGender: patientGender,
				patientAge: patientAge,
				patientIllness: patientIllness,
				amountPaid: selectedTime.fee !== undefined ? selectedTime.fee : (doctor.pricepoint || 0),
				meetLink: "no",
			};

			// Include email only if the role is 'patient'
			if (role === "patient") {
				bookingData.email = email; // Add email to bookingData
				console.log(`User Email: ${email}`);
			} else {
				// If the role is not 'patient', alert the user
				alert("Only patients can book appointments.");
				return; // Exit the function
			}

			try {
				const token = localStorage.getItem("token");
				const response = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/bookings`, {
					// Replace with your API URL
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${token}`,
					},
					body: JSON.stringify(bookingData), // Send the doctor and slot data
				});

				const result = await response.json();

				if (response.ok) {
					alert("Appointment request sent successfully!");
					console.log("Booking response:", result); // Optional: log the server response
				} else {
					alert(result.error || "Failed to book appointment");
				}
			} catch (error) {
				console.error("Error booking appointment:", error);
			}
		} else {
			setStatusMessage({
				message: "Please fill all fields and select a time slot.",
				type: "error"
			});
		}
	};

	useEffect(() => {
		const fetchReviews = async () => {
			try {
				const res = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/bookings/reviews/${doctor.email}`);
				const data = await res.json();
				setReviews(data);
			} catch (err) {
				console.error("Error fetching reviews:", err);
			}
		};
		fetchReviews();
	}, [doctor.email]);

	useEffect(() => {
		const fetchSlots = async () => {
			if (!dateOfAppointment) return;
			setLoadingSlots(true);
			try {
				const token = localStorage.getItem("token");
				const res = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/doctors/${doctor.id || doctor._id}/slots/${dateOfAppointment}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				const data = await res.json();
				if (res.ok) {
					setAvailableSlots(data.slots || []);
				}
			} catch (e) {
				console.error("Error fetching slots", e);
			} finally {
				setLoadingSlots(false);
			}
		};
		fetchSlots();
	}, [dateOfAppointment, doctor._id, doctor.id]);

	const formatDateLabel = (dateObj) => {
		const today = new Date();
		const tomorrow = new Date();
		tomorrow.setDate(today.getDate() + 1);
		
		const dateStr = dateObj.toLocaleDateString();
		if (dateStr === today.toLocaleDateString()) return "Today";
		if (dateStr === tomorrow.toLocaleDateString()) return "Tomorrow";
		return dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
	};

	const isSlotPassed = (timeStr) => {
		if (dateOfAppointment !== getLocalDateString()) return false;
		const [time, modifier] = timeStr.split(" ");
		let [hours, minutes] = time.split(":").map(Number);
		if (modifier === "PM" && hours !== 12) hours += 12;
		if (modifier === "AM" && hours === 12) hours = 0;
		const slotTime = new Date();
		slotTime.setHours(hours, minutes, 0, 0);
		return slotTime <= new Date(); 
	};

	const currentProfilePic = (doctor.profileImage && doctor.profileImage !== "undefined" && doctor.profileImage !== "null") 
		? doctor.profileImage 
		: defaultProfilePic;

	return (
		<div className="doctor-detail-container">
			<div className="left-section">
				<div className="doctor-profile-card">
					<div className="doctor-profile-header">
						<div className="doctor-image">
							<img 
								src={currentProfilePic} 
								alt="Doctor" 
								style={{ cursor: 'zoom-in' }}
								onClick={() => setZoomImage(true)}
							/>
						</div>
						<div className="doctor-primary-info" style={{ minWidth: 0, flex: 1 }}>
							<h1>{doctor.name.replace(/^Dr\.?\s*/i, '')}</h1>
							<p className="doctor-experience">{parseInt(doctor.experience) || doctor.experience} Years Experience</p>
							<div className="specializations-tags" style={{ display: 'flex', overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '8px', gap: '8px', width: '100%' }}>
								{specializations.map((spec, idx) => (
									<span key={idx} className="spec-tag" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{spec}</span>
								))}
							</div>
						</div>
					</div>

					<div className="doctor-details-stack" style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
						<div className="detail-item">
							<span className="detail-label">Education</span>
							<span className="detail-value" style={{ lineHeight: '1.4' }}>{doctor.education}</span>
						</div>
					</div>
				</div>

				<div className="reviews-section">
					<h2>Patient Reviews</h2>
					{reviews.length > 0 ? (
						reviews.map((r, i) => (
							<div key={i} className="review-card">
								<p><strong>{r.patientName}</strong> rated: {r.rating}★</p>
								<p className="review-text">{r.review}</p>
								<p className="review-date">{new Date(r.dateOfAppointment).toLocaleDateString()}</p>
							</div>
						))
					) : (
						<p>No reviews yet for this doctor.</p>
					)}
				</div>
			</div>

			<div className="right-section">
				<div className="consultation-info">
					<div className="date-input" style={{ marginBottom: '20px', maxWidth: '100%', overflow: 'hidden' }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
							<label style={{ fontWeight: 'bold', margin: 0, whiteSpace: 'nowrap' }}>Select Date:</label>
							<input 
								type="date"
								min={getLocalDateString()}
								value={carouselStartDate}
								onChange={(e) => {
									if (e.target.value) {
										setCarouselStartDate(e.target.value);
										setDateOfAppointment(e.target.value);
										setSelectedTime(null);
										setShowAllSlots(false);
									}
								}}
								style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', outline: 'none' }}
							/>
						</div>
						<div className="date-carousel" style={{ display: 'flex', overflowX: 'auto', gap: '10px', paddingBottom: '10px', width: '100%' }}>
							{dates.map((d, i) => {
								const dateStr = getLocalDateString(d);
								const isSelected = dateOfAppointment === dateStr;
								return (
									<button
										key={dateStr}
										onClick={() => {
											setDateOfAppointment(dateStr);
											setSelectedTime(null);
											setShowAllSlots(false);
										}}
										style={{
											padding: '10px 15px',
											borderRadius: '8px',
											border: isSelected ? '2px solid #3b82f6' : '1px solid #cbd5e1',
											background: isSelected ? '#eff6ff' : 'white',
											minWidth: '120px',
											whiteSpace: 'nowrap',
											cursor: 'pointer',
											fontWeight: 'bold',
											color: isSelected ? '#1d4ed8' : '#475569',
											transition: 'all 0.2s ease'
										}}
									>
										{formatDateLabel(d)}
									</button>
								)
							})}
						</div>
					</div>

					<p style={{ fontWeight: 'bold' }}>Available Slots:</p>
					<div className="availability-slots" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px', marginBottom: '8px' }}>
						{loadingSlots ? (
							<p>Loading slots...</p>
						) : availableSlots.length > 0 ? (
							(showAllSlots ? availableSlots : availableSlots.slice(0, 4)).map((slot, idx) => {
								const isBooked = slot.remainingCapacity <= 0;
								const isPast = isSlotPassed(slot.startTime);
								const isDisabled = isBooked || isPast;
								const isSelected = selectedTime?.startTime === slot.startTime;

								const formatTime12Hour = (time24) => {
									if (!time24) return '';
									const [hours, minutes] = time24.split(':');
									const h = parseInt(hours, 10);
									const ampm = h >= 12 ? 'PM' : 'AM';
									const h12 = h % 12 || 12;
									return `${h12}:${minutes} ${ampm}`;
								};

								return (
									<button
										key={idx}
										disabled={isDisabled}
										onClick={() => setSelectedTime(slot)}
										style={{
											padding: '8px 10px',
											borderRadius: '8px',
											border: isSelected ? '2px solid #3b82f6' : '1px solid #cbd5e1',
											background: isDisabled ? '#f1f5f9' : (isSelected ? '#eff6ff' : 'white'),
											cursor: isDisabled ? 'not-allowed' : 'pointer',
											textAlign: 'left',
											opacity: isDisabled ? 0.6 : 1,
											position: 'relative',
											display: 'flex',
											flexDirection: 'column',
											gap: '2px',
											transition: 'all 0.2s ease'
										}}
									>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
											<span style={{ fontSize: '16px', fontWeight: 'bold', color: isDisabled ? '#94a3b8' : '#0f172a' }}>
												{formatTime12Hour(slot.startTime)}
											</span>
											<span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
												₹{slot.fee !== undefined ? slot.fee : doctor.pricepoint}
											</span>
										</div>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
											<span style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
												{slot.consultationType === 'Both' ? 'Online/In-Person' : slot.consultationType}
											</span>
											{slot.sessionType === 'Group' && (
												<span style={{ fontSize: '10px', background: '#e0e7ff', color: '#4338ca', padding: '1px 4px', borderRadius: '4px', whiteSpace: 'nowrap', marginLeft: '4px' }}>
													Group: {slot.remainingCapacity} left
												</span>
											)}
										</div>
										{isBooked && (
											<div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '10px', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
												FULL
											</div>
										)}
									</button>
								)
							})
						) : (
							<p>No slots available on this date.</p>
						)}
					</div>
					
					{!loadingSlots && availableSlots.length > 4 && (
						<div style={{ textAlign: 'center', marginBottom: '10px' }}>
							<button 
								onClick={() => setShowAllSlots(!showAllSlots)} 
								style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
							>
								{showAllSlots ? (
									<>Show Less <span>▲</span></>
								) : (
									<>Show {availableSlots.length - 4} More <span>▼</span></>
								)}
							</button>
						</div>
					)}

					<div className="illness-input">
						<label htmlFor="patientIllness">Describe your illness: </label>
						<textarea
							className="patientIllness"
							value={patientIllness}
							onChange={(e) => setPatientIllness(e.target.value)}
							onFocus={(e) => {
								e.target.scrollIntoView({ behavior: 'smooth', block: 'end' });
							}}
							onClick={(e) => {
								e.target.scrollIntoView({ behavior: 'smooth', block: 'end' });
							}}
							style={{ scrollMarginBottom: '130px' }}
							placeholder="Explain in detail about the illness"
							rows="3"
							wrap="soft"
							required
						/>
					</div>

					<div style={{ marginTop: '20px', paddingBottom: '10px' }}>
						<p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
							<b>Note: </b> Once you see the message: "Appointment Booked
							Successfully!", please check the "Your Appointed Doctor" section on
							the home page to see if the doctor has approved your request.
						</p>
					</div>

					<div className="booking-action-bar" style={{ position: 'sticky', bottom: 0, background: 'white', padding: '15px 0 20px 0', borderTop: '1px solid #e2e8f0', zIndex: 10 }}>
						<button className="book-appointment" onClick={handleBookAppointment} style={{ width: '100%', margin: 0 }}>
							Book Appointment
						</button>

						{statusMessage.message && (
							<p className={statusMessage.type === "error" ? "error-msg" : "success-msg"} style={{ marginTop: '10px' }}>
								{statusMessage.message}
							</p>
						)}
					</div>
				</div>
			</div>
			
			{/* Zoom Modal */}
			{zoomImage && (
				<div 
					className="image-zoom-overlay" 
					onClick={() => setZoomImage(false)}
					style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out' }}
				>
					<img 
						src={currentProfilePic} 
						alt="Enlarged Profile" 
						style={{ maxWidth: '90%', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', objectFit: 'contain' }}
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}
		</div>
	);
}

export default DoctorDetail;
