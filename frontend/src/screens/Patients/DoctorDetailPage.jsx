import React, { useState, useContext, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import "./DoctorDetailPage.css"; // Ensure this path matches the location of your CSS file
import { AuthContext } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import defaultProfilePic from '../../media/default-profile.png';
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from '../../config';

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
	const [doctorUpiId, setDoctorUpiId] = useState(doctor.upiId || "");
	const [paymentModalOpen, setPaymentModalOpen] = useState(false);
	const [currentBooking, setCurrentBooking] = useState(null);
	const [screenshotFiles, setScreenshotFiles] = useState([]);
	const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
	const [uploadAlert, setUploadAlert] = useState(null);
	const [timeLeft, setTimeLeft] = useState(600);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [showAllSlots, setShowAllSlots] = useState(false);
	const [zoomImage, setZoomImage] = useState(false);
	const [carouselStartDate, setCarouselStartDate] = useState(getLocalDateString());

	useEffect(() => {
		if (!paymentModalOpen || !currentBooking) return;
		
		const bookingTime = new Date(currentBooking.createdAt).getTime();
		const updateTimer = () => {
			const now = new Date().getTime();
			const diffInSeconds = Math.floor((bookingTime + 10 * 60 * 1000 - now) / 1000);
			if (diffInSeconds <= 0) {
				setTimeLeft(0);
				handleCancelPayment(true); // pass flag for auto-cancel
			} else {
				setTimeLeft(diffInSeconds);
			}
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, [paymentModalOpen, currentBooking]);

	const filteredSlots = useMemo(() => {
		let slots = availableSlots || [];
		if (!doctorUpiId) {
			slots = slots.filter(slot => {
				const fee = slot.fee !== undefined ? slot.fee : (doctor.pricepoint || doctor.price || 0);
				return fee <= 0;
			});
		}
		return slots;
	}, [availableSlots, doctorUpiId, doctor.pricepoint, doctor.price]);
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

	const fetchSlots = async () => {
		if (!dateOfAppointment) return;
		setLoadingSlots(true);
		try {
			const token = localStorage.getItem("token");
			const res = await authFetch(`${BACKEND_URL}/api/doctors/${doctor.id || doctor._id}/slots/${dateOfAppointment}`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			const data = await res.json();
			if (res.ok) {
				setAvailableSlots(data.slots || []);
				if (data.upiId !== undefined) {
					setDoctorUpiId(data.upiId);
				}
			}
		} catch (e) {
			console.error("Error fetching slots", e);
		} finally {
			setLoadingSlots(false);
		}
	};

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
				slotId: selectedTime._id,
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
				const response = await authFetch(`${BACKEND_URL}/api/bookings`, {
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
					if (bookingData.amountPaid > 0) {
						setCurrentBooking(result.booking);
						setPaymentModalOpen(true);
					} else {
						alert("Appointment booked successfully!");
					}
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

	const handleUploadProof = async (e) => {
		e.preventDefault();
		if (screenshotFiles.length === 0) {
			alert("Please choose at least one screenshot file to upload.");
			return;
		}

		setUploadingScreenshot(true);
		const formData = new FormData();
		screenshotFiles.forEach(file => {
			formData.append("paymentScreenshots", file);
		});

		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/bookings/${currentBooking._id}/payment`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});

			const result = await response.json();
			if (response.ok) {
				setPaymentModalOpen(false);
				setCurrentBooking(null);
				setScreenshotFiles([]);
				alert("Payment proof uploaded successfully! Your appointment request is sent for verification.");
				fetchSlots(); // Refresh slots to update UI
			} else {
				alert(result.error || "Failed to upload payment proof.");
			}
		} catch (error) {
			console.error("Error uploading payment proof:", error);
			alert("Failed to upload payment proof.");
		} finally {
			setUploadingScreenshot(false);
		}
	};

	const handleCancelPayment = async (autoCancel = false) => {
		if (!autoCancel && !window.confirm("Are you sure you want to cancel booking? The held slot will be released immediately.")) return;
		
		const bookingIdToCancel = currentBooking._id;

		// Immediately close the modal to avoid infinite setInterval loops
		setPaymentModalOpen(false);
		setCurrentBooking(null);
		setScreenshotFiles([]);

		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/bookings/delete/${bookingIdToCancel}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (response.ok) {
				if (autoCancel) {
					alert("Your 10-minute payment window has expired. The slot has been released.");
				} else {
					alert("Booking cancelled. The slot has been released.");
				}
				fetchSlots(); // Refresh slots to update UI
			} else {
				const result = await response.json();
				if (autoCancel) {
					alert("Your 10-minute payment window has expired.");
				} else {
					alert(result.error || "Failed to release the slot.");
				}
			}
		} catch (error) {
			console.error("Error cancelling booking:", error);
			if (autoCancel) {
				alert("Your 10-minute payment window has expired.");
			} else {
				alert("Failed to cancel booking.");
			}
		}
	};

	useEffect(() => {
		const fetchReviews = async () => {
			try {
				const res = await fetch(`${BACKEND_URL}/api/bookings/reviews/${doctor.email}`);
				const data = await res.json();
				setReviews(data);
			} catch (err) {
				console.error("Error fetching reviews:", err);
			}
		};
		fetchReviews();
	}, [doctor.email]);

	useEffect(() => {
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
						) : filteredSlots.length > 0 ? (
							(showAllSlots ? filteredSlots : filteredSlots.slice(0, 4)).map((slot, idx) => {
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
											<div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
												<span style={{ fontSize: '16px', fontWeight: 'bold', color: isDisabled ? '#94a3b8' : '#0f172a' }}>
													{formatTime12Hour(slot.startTime)}
												</span>
												<span style={{ fontSize: '14px', color: isDisabled ? '#94a3b8' : '#cbd5e1' }}>|</span>
												<span style={{ fontSize: '12px', fontWeight: '600', color: isDisabled ? '#94a3b8' : '#64748b' }}>
													{slot.duration} min
												</span>
											</div>
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
					
					{!loadingSlots && filteredSlots.length > 4 && (
						<div style={{ textAlign: 'center', marginBottom: '10px' }}>
							<button 
								onClick={() => setShowAllSlots(!showAllSlots)} 
								style={{ background: 'none', border: 'none', padding: 0, color: '#64748b', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
							>
								{showAllSlots ? (
									<>Show Less <span>▲</span></>
								) : (
									<>Show {filteredSlots.length - 4} More <span>▼</span></>
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

			{/* UPI P2P Payment & Hold Modal */}
			{paymentModalOpen && currentBooking && (
				<div className="upi-payment-overlay">
					<div className="upi-payment-modal" onClick={(e) => e.stopPropagation()}>
						<div className="upi-modal-body">
							{/* Left Pane: Summary and Info */}
							<div className="upi-modal-left-pane">
								<div className="upi-modal-header">
									<h3>Secure UPI Payment</h3>
									<p className="upi-hold-warning">⚠️ Your slot is temporarily locked for you. Complete payment now to confirm.</p>
								</div>
								
								<div className="upi-payment-summary">
									<div className="summary-item">
										<span>Doctor</span>
										<strong>Dr. {doctor.firstName} {doctor.lastName}</strong>
									</div>
									<div className="summary-item">
										<span>Consultation Fee</span>
										<strong className="fee-amt">₹{currentBooking.amountPaid}</strong>
									</div>
								</div>

								<div className="upi-left-actions">
									<button 
										type="button" 
										className="cancel-booking-btn desktop-cancel"
										onClick={handleCancelPayment}
										disabled={uploadingScreenshot}
									>
										Cancel Booking & Release Slot
									</button>
								</div>
							</div>

							{/* Right Pane: Payment Actions */}
							<div className="upi-modal-right-pane">
								<div className="upi-payment-options">
									{/* Mobile Option: Click to Launch UPI Deep Link */}
									<div className="upi-option-section mobile-only-intent">
										<button 
											className="upi-intent-btn"
											onClick={() => {
												const upiUrl = `upi://pay?pa=${doctorUpiId}&pn=Dr.%20${doctor.firstName}%20${doctor.lastName}&am=${currentBooking.amountPaid}&cu=INR&tn=AyuHub-${currentBooking._id}`;
												window.open(upiUrl, "_self");
											}}
										>
											Pay Using Any UPI App (Mobile)
										</button>
										<span className="or-divider">OR</span>
									</div>

									{/* Desktop Option: QR Code Scan */}
									<div className="upi-option-section qr-section">
										<div className="timer-pill">
											<span className="timer-icon">⏳</span>
											<span className="timer-text" style={{ color: timeLeft < 60 ? '#ef4444' : 'inherit' }}>
												{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
											</span>
											<span className="timer-label">remaining to complete payment</span>
										</div>
										<p className="qr-title">Scan QR Code to Pay</p>
										<div className="qr-image-container">
											<img 
												src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${doctorUpiId}&pn=Dr.%20${doctor.firstName}%20${doctor.lastName}&am=${currentBooking.amountPaid}&cu=INR&tn=AyuHub-${currentBooking._id}`)}`}
												alt="UPI Payment QR Code"
												className="payment-qr-img"
											/>
										</div>
									</div>
								</div>

								{/* Screenshot Upload Form */}
								<form className="upi-proof-form" onSubmit={handleUploadProof}>
									<div className="proof-input-group">
										<label>Upload Payment Screenshots (Max 5)</label>
										<p className="proof-tip">💡 Tip: Upload screenshots of the successful transaction. You can add multiple images.</p>
										
										<div className="upload-grid">
											{screenshotFiles.map((file, index) => (
												<div key={index} className="upload-preview-box">
													{file.type.startsWith("image/") ? (
														<img src={URL.createObjectURL(file)} alt={`preview-${index}`} />
													) : (
														<div className="pdf-preview">PDF</div>
													)}
													<button 
														type="button" 
														className="remove-file-btn" 
														onClick={() => setScreenshotFiles(prev => prev.filter((_, i) => i !== index))}
													>
														×
													</button>
												</div>
											))}
											{screenshotFiles.length < 5 && (
												<div className="upload-add-box" onClick={() => document.getElementById("multi-screenshot-input").click()}>
													<span>+</span>
												</div>
											)}
										</div>
										<input 
											type="file" 
											id="multi-screenshot-input" 
											multiple
											accept="image/*,application/pdf" 
											style={{ display: "none" }}
											onChange={(e) => {
												const files = Array.from(e.target.files);
												const availableSpace = 5 - screenshotFiles.length;
												
												if (files.length > availableSpace) {
													const discardedFiles = files.slice(availableSpace);
													const discardedNames = discardedFiles.map(f => f.name);
													setUploadAlert({
														message: "Maximum 5 files allowed. The following files were discarded:",
														files: discardedNames
													});
												}
												
												const newFiles = [...screenshotFiles, ...files];
												setScreenshotFiles(newFiles.slice(0, 5));
												e.target.value = null;
											}}
										/>
									</div>
									<div className="upi-modal-actions">
										<button 
											type="submit" 
											className="submit-proof-btn"
											disabled={uploadingScreenshot}
										>
											{uploadingScreenshot ? "Uploading..." : "Submit Payment Proof"}
										</button>
										<button 
											type="button" 
											className="cancel-booking-btn mobile-cancel"
											onClick={handleCancelPayment}
											disabled={uploadingScreenshot}
										>
											Cancel Booking & Release Slot
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Custom Upload Alert Modal */}
			{uploadAlert && (
				<div className="upload-alert-overlay" onClick={() => setUploadAlert(null)}>
					<div className="upload-alert-modal" onClick={e => e.stopPropagation()}>
						<div className="upload-alert-icon">⚠️</div>
						<p className="upload-alert-text">{uploadAlert.message}</p>
						<div className="discarded-files-list">
							{uploadAlert.files.map((name, i) => (
								<span key={i} className="discarded-file-pill">{name}</span>
							))}
						</div>
						<button className="upload-alert-btn" onClick={() => setUploadAlert(null)}>OK</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default DoctorDetail;
