import React, { useState, useEffect, useContext } from "react";
import "./CurrentRequests.css";
import { AuthContext } from "../../context/AuthContext";

function CurrentRequests() {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [denyingRequest, setDenyingRequest] = useState(null);
	const [acceptingRequest, setAcceptingRequest] = useState(null);
	const [doctorsMessage, setDoctorsMessage] = useState("");
	const [meetLink, setMeetLink] = useState("");

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
				const response = await fetch(
					`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/bookings/doctor/${doctorId}`,
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
					(request) => request.requestAccept === "pending" && (request.amountPaid === 0 || request.paymentScreenshot)
				);

				setRequests(filteredRequests);
				setLoading(false); // Set loading to false once data is fetched
			} catch (error) {
				setError(error.message); // Capture any error that occurs during the fetch
				setLoading(false);
			}
		};

		fetchRequests();
	}, [doctorId]);

	// Function to accept request with optional meetLink
	const acceptRequest = async (id, customMeetLink) => {
		try {
			const response = await fetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/bookings/update/${id}`,
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
			const response = await fetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/bookings/update/${id}`,
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
					<div key={request._id} className="request-card">
						<div className="line">
							<p>
								<strong>Date:</strong>{" "}
								{new Date(request.dateOfAppointment).toLocaleDateString(
									"en-GB"
								)}{" "}
								(dd/mm/yyyy)
							</p>
							<p className="centered">
								<strong>Time Slot:</strong> {request.timeSlot}
							</p>
						</div>
						<div className="line">
							<p>
								<strong>Patient Name:</strong> {request.patientName}
							</p>
							<p className="centered">
								<strong>Patient Email:</strong> {request.patientEmail}
							</p>
						</div>
						<div className="line">
							<p>
								<strong>Patient Gender:</strong> {request.patientGender}
							</p>
							<p className="centered">
								<strong>Patient Age:</strong> {request.patientAge}
							</p>
						</div>
						<p>
							<strong>Patient's Illness:</strong> {request.patientIllness}
						</p>
						{request.amountPaid > 0 && request.paymentScreenshot && (
							<div className="payment-proof-preview">
								<strong>Payment Proof:</strong>
								<div className="proof-image-box">
									<a href={request.paymentScreenshot} target="_blank" rel="noreferrer">
										<img 
											src={request.paymentScreenshot} 
											alt="Payment Proof Screenshot" 
											className="proof-thumbnail"
										/>
									</a>
								</div>
							</div>
						)}

						<div className="action-buttons">
							<button onClick={() => { setAcceptingRequest(request._id); setDenyingRequest(null); setMeetLink(""); }}>
								Accept Request
							</button>

							{/* Show the deny button */}
							<button
								onClick={() => { setDenyingRequest(request._id); setAcceptingRequest(null); setDoctorsMessage(""); }} // Set the denying request state
								className="deny-button"
							>
								Deny Request
							</button>
						</div>

						{/* Show the input field if acceptingRequest matches this request's ID */}
						{acceptingRequest === request._id && (
							<div className="inline-action-form accept-link-form">
								<p className="form-tip">💡 You can optionally paste your custom Google Meet, Zoom, or other consultation link below. If left blank, a secure Jitsi link will be generated automatically.</p>
								<div className="input-with-button">
									<input
										type="text"
										value={meetLink}
										onChange={(e) => setMeetLink(e.target.value)}
										placeholder="Custom meeting link (Google Meet, Zoom, etc.)"
									/>
									<button className="confirm-accept-btn" onClick={() => acceptRequest(request._id, meetLink)}>
										Confirm Accept
									</button>
									<button className="cancel-action-btn" onClick={() => setAcceptingRequest(null)}>
										Cancel
									</button>
								</div>
							</div>
						)}

						{/* Show the input field if denyingRequest matches this request's ID */}
						{denyingRequest === request._id && (
							<div className="inline-action-form denial-reason">
								<div className="input-with-button">
									<input
										type="text"
										value={doctorsMessage}
										onChange={(e) => setDoctorsMessage(e.target.value)} // Update the doctor's message state
										placeholder="Provide reason for denial"
									/>
									<button className="confirm-deny-btn" onClick={() => denyRequest(request._id)}>
										Submit Denial
									</button>
									<button className="cancel-action-btn" onClick={() => setDenyingRequest(null)}>
										Cancel
									</button>
								</div>
							</div>
						)}
					</div>
				))
			) : (
				<p className="noRequest">There are no current requests for you.</p>
			)}
		</div>
	);
}

export default CurrentRequests;
