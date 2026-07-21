import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import SlotManagement from "../../components/SlotManagement";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function AppointmentSlots() {
	const [appointments, setAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showManageSlots, setShowManageSlots] = useState(false);

	const [galleryImages, setGalleryImages] = useState([]);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [selectedIllness, setSelectedIllness] = useState(null);
	const [expandedProofs, setExpandedProofs] = useState({});

	const { auth } = useContext(AuthContext);
	const doctorId = auth.user?.id;
	const email = localStorage.getItem("email");
	const navigate = useNavigate();

	const toggleProofs = (id) => {
		setExpandedProofs((prev) => ({ ...prev, [id]: !prev[id] }));
	};

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

	const parseAppointmentDateTime = (dateString, timeSlot) => {
		const appointmentDate = new Date(dateString);
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

				const response = await authFetch(`${BACKEND_URL}/api/bookings/doctor/${doctorId}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				});

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

						const appointmentDateTime = parseAppointmentDateTime(appointment.dateOfAppointment, appointment.timeSlot);

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
			<DashboardPageHeader
				title="My Appointment Slots"
				description="Showing upcoming appointments and those from the past 30 minutes."
				actions={
					<Button onClick={() => setShowManageSlots(!showManageSlots)}>
						{showManageSlots ? "Close Manage Slots" : "Manage Slots"}
					</Button>
				}
			/>

			{showManageSlots ? (
				<div className="mb-8">
					<SlotManagement doctorId={doctorId} token={auth.token} defaultPrice={auth.user?.price || 500} />
				</div>
			) : null}

			{appointments.length === 0 ? (
				<p className="text-center text-muted-foreground">No upcoming appointments found.</p>
			) : (
				<div className="flex flex-col gap-5">
					{appointments.map((request) => {
						const isActive = isAppointmentActive(request);
						const hasMeetLink = request.meetLink && request.meetLink !== "no";

						return (
							<Card key={request._id} className={isActive ? "ring-2 ring-primary p-6" : "p-6"}>
								<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
									<div>
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="text-lg font-semibold text-foreground">{request.patientName}</h3>
											{isActive ? (
												<Badge title="Appointment is currently ongoing">Active Now</Badge>
											) : request.isReturningPatient ? (
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
											{request.patientAge || "N/A"} yrs &bull; {request.patientGender || "N/A"} &bull;{" "}
											{request.patientEmail || "N/A"}
										</p>
										<div className="mt-3 text-sm text-foreground/80">
											<strong className="text-foreground">Illness:</strong>{" "}
											{request.patientIllness && request.patientIllness.length > 80 ? (
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
												request.patientIllness || "No illness information"
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
												<button
													type="button"
													className="flex items-center gap-2 font-semibold text-primary"
													onClick={() => toggleProofs(request._id)}
												>
													View Payment Proofs ({request.paymentScreenshots.length})
													<ChevronDown
														className={
															expandedProofs[request._id] ? "size-4 rotate-180 transition-transform" : "size-4 transition-transform"
														}
													/>
												</button>
												{expandedProofs[request._id] ? (
													<div className="mt-3 flex flex-wrap gap-2">
														{request.paymentScreenshots.map((proof, idx) => {
															const imgUrl = proof.startsWith("http")
																? proof
																: `${BACKEND_URL || "http://localhost:8080"}/${proof}`;
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
												) : null}
											</div>
										) : null}
									</div>

									<div className="flex flex-col gap-2">
										{hasMeetLink ? (
											<Button onClick={() => handleJoinMeet(request.meetLink)}>Join Meet</Button>
										) : (
											<Button variant="secondary" disabled>
												Meeting Link Pending
											</Button>
										)}

										<Button variant="outline" onClick={() => navigate(`/doctorsprescribe/${request._id}`)}>
											Prescribe Medicine & Diet - Yoga Plan
										</Button>
									</div>
								</div>
							</Card>
						);
					})}
				</div>
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

export default AppointmentSlots;
