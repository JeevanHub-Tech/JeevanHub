import { useState, useEffect, useContext } from "react";
import { Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
		if (!timeStr) return "";
		if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) return timeStr;
		let [hours, minutes] = timeStr.split(":");
		hours = parseInt(hours, 10);
		const ampm = hours >= 12 ? "PM" : "AM";
		hours = hours % 12;
		hours = hours ? hours : 12;
		hours = hours < 10 ? "0" + hours : hours;
		return `${hours}:${minutes} ${ampm}`;
	};

	const timeElapsed = (dateStr) => {
		if (!dateStr) return "Recently";
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
	const doctorId = auth.user?.id;

	useEffect(() => {
		const fetchRequests = async () => {
			try {
				const token = localStorage.getItem("token");
				const response = await authFetch(`${BACKEND_URL}/api/bookings/doctor/${doctorId}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				if (!response.ok) {
					throw new Error("Failed to fetch requests");
				}

				const data = await response.json();
				const requestsArray = Array.isArray(data.bookings) ? data.bookings : [];

				const filteredRequests = requestsArray.filter(
					(request) =>
						request.requestAccept === "pending" &&
						(request.amountPaid === 0 || (request.paymentScreenshots && request.paymentScreenshots.length > 0))
				);

				setRequests(filteredRequests);
				setLoading(false);
			} catch (error) {
				setError(error.message);
				setLoading(false);
			}
		};

		if (doctorId) {
			fetchRequests();
		}
	}, [doctorId]);

	const acceptRequest = async (id, customMeetLink) => {
		try {
			const response = await authFetch(`${BACKEND_URL}/api/bookings/update/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: JSON.stringify({ requestAccept: "accepted", meetLink: customMeetLink }),
			});

			if (!response.ok) {
				throw new Error("Failed to accept request");
			}

			setRequests((prevRequests) => prevRequests.filter((request) => request._id !== id));

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
			const response = await authFetch(`${BACKEND_URL}/api/bookings/update/${id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: JSON.stringify({ requestAccept: "denied", doctorsMessage }),
			});

			if (!response.ok) {
				throw new Error("Failed to deny request");
			}

			setRequests((prevRequests) => prevRequests.filter((request) => request._id !== id));

			setDoctorsMessage("");
			setDenyingRequest(null);

			alert(`Request ${id} denied!`);
		} catch (error) {
			console.error("Error denying request:", error);
			alert("Error denying the request.");
		}
	};

	if (loading) {
		return (
			<DashboardShell>
				<p className="text-muted-foreground">Loading...</p>
			</DashboardShell>
		);
	}

	if (error) {
		return (
			<DashboardShell>
				<p className="text-destructive">Error: {error}</p>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<DashboardPageHeader title={`Current Requests for Dr. ${firstName}`} />

			{requests.length > 0 ? (
				<div className="flex flex-col gap-5">
					{requests.map((request) => (
						<Card key={request._id} className="p-6">
							<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
								<div>
									<div className="flex flex-wrap items-center gap-2">
										<h3 className="text-lg font-semibold text-foreground">{request.patientName}</h3>
										{request.isReturningPatient ? (
											<Badge variant="secondary" title="Has previously booked appointments with you">
												Returning
											</Badge>
										) : (
											<Badge title="First-time booking with you">New</Badge>
										)}
									</div>
									<p
										className="mt-1 text-sm text-muted-foreground"
										title={`Age: ${request.patientAge} yrs | Gender: ${request.patientGender} | Email: ${request.patientEmail}`}
									>
										{request.patientAge} yrs &bull; {request.patientGender} &bull; {request.patientEmail}
									</p>
									<div className="mt-3 text-sm text-foreground/80">
										<strong className="text-foreground">Illness:</strong>{" "}
										{request.patientIllness.length > 80 ? (
											<>
												{request.patientIllness.substring(0, 80)}...
												<button
													className="ml-1 text-primary underline hover:no-underline"
													onClick={() => setSelectedIllness(request.patientIllness)}
												>
													More
												</button>
											</>
										) : (
											request.patientIllness
										)}
									</div>
									<div
										className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"
										title="Time since the appointment was requested"
									>
										<Clock className="size-3.5" /> Requested {timeElapsed(request.createdAt)}
									</div>
								</div>

								<div>
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div className="flex flex-col gap-1 text-sm text-foreground/80">
											<span className="flex items-center gap-1.5" title="Date of Appointment">
												<Calendar className="size-4 text-muted-foreground" />
												{new Date(request.dateOfAppointment).toLocaleDateString("en-GB", {
													weekday: "short",
													day: "numeric",
													month: "short",
													year: "numeric",
												})}
											</span>
											<span className="flex items-center gap-1.5" title="Time of Appointment">
												<Clock className="size-4 text-muted-foreground" />
												{format12HourTime(request.timeSlot)}
											</span>
										</div>
										<Badge variant={request.amountPaid === 0 ? "secondary" : "default"} title="Consultation Fee">
											{request.amountPaid === 0 ? "Free" : `₹${request.amountPaid}`}
										</Badge>
									</div>
									{request.amountPaid > 0 && request.paymentScreenshots && request.paymentScreenshots.length > 0 ? (
										<div className="mt-4">
											<p className="mb-2 text-xs font-medium text-muted-foreground">
												Payment Proofs ({request.paymentScreenshots.length}):
											</p>
											<div className="flex flex-wrap gap-2">
												{request.paymentScreenshots.map((proof, idx) => {
													const imgUrl = proof.startsWith("http") ? proof : `${BACKEND_URL || "http://localhost:8080"}/${proof}`;
													return (
														<img
															key={idx}
															src={imgUrl}
															alt={`Proof ${idx + 1}`}
															className="size-16 cursor-pointer rounded-md border border-border object-cover"
															onClick={() => {
																setGalleryImages(request.paymentScreenshots);
																setCurrentImageIndex(idx);
															}}
														/>
													);
												})}
											</div>
										</div>
									) : null}
								</div>

								<div className="flex flex-col gap-2">
									{!acceptingRequest && !denyingRequest ? (
										<>
											<Button onClick={() => setAcceptingRequest(request._id)}>Accept Request</Button>
											<Button
												variant="destructive"
												onClick={() => {
													setDenyingRequest(request._id);
													setDoctorsMessage("");
												}}
											>
												Deny Request
											</Button>
										</>
									) : null}

									{acceptingRequest === request._id ? (
										<div className="flex flex-col gap-2">
											<p className="text-xs text-muted-foreground">
												{request.amountPaid > 0
													? "Accepting confirms the payment proof above is valid."
													: "Optional custom link (Zoom/Meet)."}
												<br />
												Blank = Auto Jitsi.
											</p>
											<Input
												value={meetLink}
												onChange={(e) => setMeetLink(e.target.value)}
												placeholder="Custom meeting link"
											/>
											<div className="flex gap-2">
												<Button size="sm" onClick={() => acceptRequest(request._id, meetLink)}>
													Confirm
												</Button>
												<Button size="sm" variant="outline" onClick={() => setAcceptingRequest(null)}>
													Cancel
												</Button>
											</div>
										</div>
									) : null}

									{denyingRequest === request._id ? (
										<div className="flex flex-col gap-2">
											<Input
												value={doctorsMessage}
												onChange={(e) => setDoctorsMessage(e.target.value)}
												placeholder="Provide reason for denial"
											/>
											<div className="flex gap-2">
												<Button size="sm" variant="destructive" onClick={() => denyRequest(request._id)}>
													Submit
												</Button>
												<Button size="sm" variant="outline" onClick={() => setDenyingRequest(null)}>
													Cancel
												</Button>
											</div>
										</div>
									) : null}
								</div>
							</div>
						</Card>
					))}
				</div>
			) : (
				<p className="text-center text-muted-foreground">There are no current requests for you.</p>
			)}

			{/* Image Gallery Modal */}
			<Dialog open={galleryImages.length > 0} onOpenChange={(open) => !open && setGalleryImages([])}>
				<DialogContent className="max-w-2xl">
					<div className="relative flex items-center justify-center">
						{galleryImages.length > 1 ? (
							<button
								className="absolute left-0 z-10 rounded-full bg-muted p-2 text-foreground"
								onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
							>
								<ChevronLeft className="size-5" />
							</button>
						) : null}

						<img
							src={
								galleryImages[currentImageIndex]?.startsWith("http")
									? galleryImages[currentImageIndex]
									: `${BACKEND_URL || "http://localhost:8080"}/${galleryImages[currentImageIndex]}`
							}
							alt="Enlarged Proof"
							className="max-h-[70vh] w-full rounded-lg object-contain"
						/>

						{galleryImages.length > 1 ? (
							<button
								className="absolute right-0 z-10 rounded-full bg-muted p-2 text-foreground"
								onClick={() => setCurrentImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
							>
								<ChevronRight className="size-5" />
							</button>
						) : null}
					</div>

					{galleryImages.length > 1 ? (
						<div className="flex justify-center gap-2">
							{galleryImages.map((_, idx) => (
								<span
									key={idx}
									onClick={() => setCurrentImageIndex(idx)}
									className={
										idx === currentImageIndex
											? "size-2 cursor-pointer rounded-full bg-primary"
											: "size-2 cursor-pointer rounded-full bg-muted-foreground/30"
									}
								/>
							))}
						</div>
					) : null}
				</DialogContent>
			</Dialog>

			{/* Illness Modal */}
			<Dialog open={!!selectedIllness} onOpenChange={(open) => !open && setSelectedIllness(null)}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Patient's Illness Details</DialogTitle>
					</DialogHeader>
					<p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{selectedIllness}</p>
				</DialogContent>
			</Dialog>
		</DashboardShell>
	);
}

export default CurrentRequests;
