import React, { useState, useEffect, useContext } from "react";
import "./CurrentRequests.css";
import { AuthContext } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from '../../config';

function CurrentRequests() {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [denyingRequest, setDenyingRequest] = useState(null);
	const [acceptingRequest, setAcceptingRequest] = useState(null);
	const [doctorsMessage, setDoctorsMessage] = useState("");
	const [meetLink, setMeetLink] = useState("");
	const [galleryImages, setGalleryImages] = useState([]);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [selectedIllness, setSelectedIllness] = useState(null);

	const format12HourTime = (timeStr) => {
		if (!timeStr) return '';
		if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) return timeStr;
		let [hours, minutes] = timeStr.split(':');
		hours = parseInt(hours, 10);
		const ampm = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'
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

	const { auth } = useContext(AuthContext);
	const firstName = auth.user?.firstName || "Doctor";

	const email = localStorage.getItem("email");
	const role = localStorage.getItem("role");
	const doctorId = auth.user?.id;

	// Fetch data from API when component mounts
	useEffect(() => {
		const fetchRequests = async () => {
			try {
				const token = localStorage.getItem("token"); // Assuming token is stored in localStorage
				const response = await authFetch(
					`${BACKEND_URL}/api/bookings/doctor/${doctorId}`,
					{
						headers: {
							Authorization: `Bearer ${token}`
						}
					}
				);
				if (!response.ok) {
					throw new Error("Failed to fetch requests");
				}

				const data = await response.json();

				// Ensure that we are accessing the bookings array
				const requestsArray = Array.isArray(data.bookings) ? data.bookings : [];

				console.log("Fetched Requests:", requestsArray);

				// Filter the requests based on the logged-in doctor's email
				// Hide bookings requiring payment where the patient hasn't uploaded a proof yet
				const filteredRequests = requestsArray.filter(
					(request) => request.requestAccept === "pending" && (request.amountPaid === 0 || (request.paymentScreenshots && request.paymentScreenshots.length > 0))
				);

				setRequests(filteredRequests);
				setLoading(false); // Set loading to false once data is fetched
			} catch (error) {
				setError(error.message); // Capture any error that occurs during the fetch
				setLoading(false);
			}
		};

		if (doctorId) {
			fetchRequests();
		}
	}, [doctorId]);

	// Function to accept request with optional meetLink
	const acceptRequest = async (id, customMeetLink) => {
		try {
			const response = await authFetch(
				`${BACKEND_URL}/api/bookings/update/${id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("token")}`
					},
					body: JSON.stringify({ requestAccept: "accepted", meetLink: customMeetLink }),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to accept request");
			}

			// Remove the request from the state after accepting
			setRequests((prevRequests) =>
				prevRequests.filter((request) => request._id !== id)
			);

			setAcceptingRequest(null);
			setMeetLink("");
			alert(`Request accepted successfully!`);
		} catch (error) {
			console.error("Error accepting request:", error);
			alert("Error accepting the request.");
		}
	};

	const denyRequest = async (id) => {
		if (!doctorsMessage) {
			alert("Please provide a reason for denial.");
			return;
		}

		try {
			const response = await authFetch(
				`${BACKEND_URL}/api/bookings/update/${id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("token")}`
					},
					body: JSON.stringify({ requestAccept: "denied", doctorsMessage }), // Send doctorsMessage with the denial
				}
			);

			if (!response.ok) {
				throw new Error("Failed to deny request");
			}

			// Remove the request from the state after denying
			setRequests((prevRequests) =>
				prevRequests.filter((request) => request._id !== id)
			);

			setDoctorsMessage(""); // Reset the message
			setDenyingRequest(null); // Clear the denying state

			alert(`Request ${id} denied!`);
		} catch (error) {
			console.error("Error denying request:", error);
			alert("Error denying the request.");
		}
	};

	if (loading) {
		return <p style={{ marginTop: "150px", padding: "15px", background: "white", width: "max-content", borderRadius: "15px", marginLeft: "50px" }}>Loading...</p>;
	}

	if (error) {
		return <p style={{ marginTop: "150px", padding: "15px", background: "white", width: "max-content", borderRadius: "15px", marginLeft: "50px" }}>Error: {error}</p>;
	}

	return (
		<div className="requests-container">
			<h1>Current Requests for Dr. {firstName}</h1>
			{console.log(requests)}
			{requests.length > 0 ? (
				requests.map((request) => (
					<div key={request._id} className="req-card">
						<div className="req-card-grid">
							{/* Left Column: Patient Profile */}
							<div className="req-col req-patient">
								<div className="req-patient-header">
									<h3 title="Patient Name">{request.patientName}</h3>
									{request.isReturningPatient ? (
										<span className="req-badge returning" title="Has previously booked appointments with you">Returning</span>
									) : (
										<span className="req-badge new" title="First-time booking with you">New</span>
									)}
								</div>
								<p className="req-subtext" title={`Age: ${request.patientAge} yrs | Gender: ${request.patientGender} | Email: ${request.patientEmail}`}>
									{request.patientAge} yrs • {request.patientGender} • {request.patientEmail}
								</p>
								<div className="req-illness">
									<strong>Illness:</strong>{" "}
									{request.patientIllness.length > 80 ? (
										<>
											{request.patientIllness.substring(0, 80)}...
											<button className="req-btn-link" onClick={() => setSelectedIllness(request.patientIllness)}>More</button>
										</>
									) : (
										request.patientIllness
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
										<p className="req-gallery-title">Payment Proofs ({request.paymentScreenshots.length}):</p>
										<div className="req-gallery-grid">
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
									</div>
								)}
							</div>

							{/* Right Column: Actions */}
							<div className="req-col req-actions">
								{!acceptingRequest && !denyingRequest ? (
									<>
										<button className="req-btn accept" onClick={() => setAcceptingRequest(request._id)}>
											Accept Request
										</button>
										<button className="req-btn deny" onClick={() => { setDenyingRequest(request._id); setDoctorsMessage(""); }}>
											Deny Request
										</button>
									</>
								) : null}

								{acceptingRequest === request._id && (
									<div className="req-action-form">
										<p className="req-tip">
											{request.amountPaid > 0
												? "💡 Accepting confirms the payment proof above is valid."
												: "💡 Optional custom link (Zoom/Meet)."}
											<br/>Blank = Auto Jitsi.
										</p>
										<input
											type="text"
											value={meetLink}
											onChange={(e) => setMeetLink(e.target.value)}
											placeholder="Custom meeting link"
											className="req-input"
										/>
										<div className="req-btn-group">
											<button className="req-btn confirm-accept" onClick={() => acceptRequest(request._id, meetLink)}>Confirm</button>
											<button className="req-btn cancel" onClick={() => setAcceptingRequest(null)}>Cancel</button>
										</div>
									</div>
								)}

								{denyingRequest === request._id && (
									<div className="req-action-form">
										<input
											type="text"
											value={doctorsMessage}
											onChange={(e) => setDoctorsMessage(e.target.value)}
											placeholder="Provide reason for denial"
											className="req-input"
										/>
										<div className="req-btn-group">
											<button className="req-btn confirm-deny" onClick={() => denyRequest(request._id)}>Submit</button>
											<button className="req-btn cancel" onClick={() => setDenyingRequest(null)}>Cancel</button>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				))
			) : (
				<p className="noRequest">There are no current requests for you.</p>
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

export default CurrentRequests;
