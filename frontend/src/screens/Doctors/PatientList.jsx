import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, ChevronLeft, ChevronRight, Star, CheckCircle2, Hourglass, Pill } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const parseAppointmentDateTime = (dateString, timeSlot) => {
	const appointmentDate = new Date(dateString);
	if (!timeSlot || typeof timeSlot !== "string") return appointmentDate;
	const startTimePart = timeSlot.split(" - ")[0].trim();
	let [hours, minutes] = startTimePart.split(/[:\s]/).map(Number);
	const period = startTimePart.includes("PM") ? "PM" : "AM";

	if (period === "PM" && hours !== 12) {
		hours += 12;
	} else if (period === "AM" && hours === 12) {
		hours = 0;
	}

	appointmentDate.setHours(hours || 0, minutes || 0, 0, 0);
	return appointmentDate;
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

function PatientList() {
	const [activeTab, setActiveTab] = useState("Previous");
	const navigate = useNavigate();
	const [previousAppointments, setPreviousAppointments] = useState([]);
	const [deniedAppointments, setDeniedAppointments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

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

				const response = await authFetch(`${BACKEND_URL}/api/bookings/doctor/${doctorId}`);

				if (!response.ok) {
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
					if (appointment.requestAccept === "denied") {
						denied.push(appointment);
						return;
					}

					if (appointment.requestAccept === "accepted") {
						const appointmentDateTime = parseAppointmentDateTime(appointment.dateOfAppointment, appointment.timeSlot);

						const endTime = new Date(appointmentDateTime);
						endTime.setMinutes(endTime.getMinutes() + 30);

						if (currentTime > endTime) {
							previous.push(appointment);
						}
					}
				});

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
	}, [doctorId]);

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
			<DashboardPageHeader title="Patient List" />

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="mb-6">
					<TabsTrigger value="Previous">Previous Appointments</TabsTrigger>
					<TabsTrigger value="Denied">Denied Requests</TabsTrigger>
				</TabsList>

				<TabsContent value="Previous">
					{previousAppointments.length === 0 ? (
						<p className="text-center text-muted-foreground">No previous appointments found.</p>
					) : (
						<div className="flex flex-col gap-5">
							{previousAppointments.map((appointment) => {
								const hasScreenshots = appointment.paymentScreenshots && appointment.paymentScreenshots.length > 0;
								const isPendingPayment = appointment.amountPaid > 0 && appointment.paymentStatus === "Pending";
								const supplementCount = appointment.recommendedSupplements?.length || 0;

								return (
									<Card key={appointment._id} className="p-6">
										<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
											<div>
												<div className="flex flex-wrap items-center gap-2">
													<h3 className="text-lg font-semibold text-foreground">{appointment.patientName}</h3>
													{appointment.isReturningPatient ? (
														<Badge variant="secondary" title="Has previously booked appointments with you">
															Returning
														</Badge>
													) : (
														<Badge title="First-time booking with you">New</Badge>
													)}
												</div>
												<p
													className="mt-1 text-sm text-muted-foreground"
													title={`Age: ${appointment.patientAge} yrs | Gender: ${appointment.patientGender} | Email: ${appointment.patientEmail}`}
												>
													{appointment.patientAge || "N/A"} yrs &bull; {appointment.patientGender || "N/A"} &bull;{" "}
													{appointment.patientEmail || "N/A"}
												</p>
												<div className="mt-3 text-sm text-foreground/80">
													<strong className="text-foreground">Illness:</strong>{" "}
													{appointment.patientIllness && appointment.patientIllness.length > 80 ? (
														<>
															{appointment.patientIllness.substring(0, 80)}...
															<button
																className="ml-1 text-primary underline hover:no-underline"
																onClick={() => setSelectedIllness(appointment.patientIllness)}
															>
																More
															</button>
														</>
													) : (
														appointment.patientIllness || "No illness information"
													)}
												</div>
												{appointment.rating ? (
													<div
														className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"
														title="Patient's feedback for this consultation"
													>
														<Star className="size-3.5 fill-primary text-primary" /> {appointment.rating}/5
														{appointment.review ? ` — "${appointment.review}"` : ""}
													</div>
												) : (
													<div className="mt-3 text-xs text-muted-foreground">No review submitted yet</div>
												)}
											</div>

											<div>
												<div className="flex flex-wrap items-center justify-between gap-3">
													<div className="flex flex-col gap-1 text-sm text-foreground/80">
														<span className="flex items-center gap-1.5" title="Date of Appointment">
															<Calendar className="size-4 text-muted-foreground" />
															{new Date(appointment.dateOfAppointment).toLocaleDateString("en-GB", {
																weekday: "short",
																day: "numeric",
																month: "short",
																year: "numeric",
															})}
														</span>
														<span className="flex items-center gap-1.5" title="Time of Appointment">
															<Clock className="size-4 text-muted-foreground" />
															{format12HourTime(appointment.timeSlot)}
														</span>
													</div>
													<Badge variant={appointment.amountPaid === 0 ? "secondary" : "default"} title="Consultation Fee">
														{appointment.amountPaid === 0 ? "Free" : `₹${appointment.amountPaid}`}
													</Badge>
												</div>

												{appointment.paymentStatus === "Completed" ? (
													<p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary">
														<CheckCircle2 className="size-4" /> Payment Verified
													</p>
												) : null}

												{hasScreenshots ? (
													<div className="mt-3">
														<p className="mb-2 text-xs font-medium text-muted-foreground">
															Payment Proofs ({appointment.paymentScreenshots.length}):
														</p>
														<div className="flex flex-wrap gap-2">
															{appointment.paymentScreenshots.map((proof, index) => {
																const imgUrl = proof.startsWith("http")
																	? proof
																	: `${BACKEND_URL || "http://localhost:8080"}/${proof}`;
																return (
																	<img
																		key={index}
																		src={imgUrl}
																		alt={`Payment Proof ${index + 1}`}
																		className="size-16 cursor-pointer rounded-md border border-border object-cover"
																		onClick={() => {
																			setGalleryImages(appointment.paymentScreenshots);
																			setCurrentImageIndex(index);
																		}}
																	/>
																);
															})}
														</div>
													</div>
												) : null}

												{isPendingPayment && !hasScreenshots ? (
													<p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
														<Hourglass className="size-3.5" /> Awaiting payment proof
													</p>
												) : null}

												{supplementCount > 0 ? (
													<p className="mt-3 flex items-center gap-1.5 border-t border-dashed border-border pt-3 text-xs font-medium text-muted-foreground">
														<Pill className="size-3.5" /> {supplementCount} medicine{supplementCount > 1 ? "s" : ""} prescribed
													</p>
												) : null}
											</div>

											<div>
												<Button onClick={() => navigate(`/doctorsprescribe/${appointment._id}`)}>
													Prescribe Medicine & Diet - Yoga Plan
												</Button>
											</div>
										</div>
									</Card>
								);
							})}
						</div>
					)}
				</TabsContent>

				<TabsContent value="Denied">
					{deniedAppointments.length === 0 ? (
						<p className="text-center text-muted-foreground">No denied requests found.</p>
					) : (
						<div className="flex flex-col gap-5">
							{deniedAppointments.map((appointment) => (
								<Card key={appointment._id} className="p-6">
									<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
										<div>
											<div className="flex flex-wrap items-center gap-2">
												<h3 className="text-lg font-semibold text-foreground">{appointment.patientName}</h3>
												<Badge variant="destructive" title="This request was denied">
													Denied
												</Badge>
												{appointment.isReturningPatient ? (
													<Badge variant="secondary" title="Has previously booked appointments with you">
														Returning
													</Badge>
												) : (
													<Badge title="First-time booking with you">New</Badge>
												)}
											</div>
											<p
												className="mt-1 text-sm text-muted-foreground"
												title={`Age: ${appointment.patientAge} yrs | Gender: ${appointment.patientGender} | Email: ${appointment.patientEmail}`}
											>
												{appointment.patientAge || "N/A"} yrs &bull; {appointment.patientGender || "N/A"} &bull;{" "}
												{appointment.patientEmail || "N/A"}
											</p>
											<div className="mt-3 text-sm text-foreground/80">
												<strong className="text-foreground">Illness:</strong>{" "}
												{appointment.patientIllness && appointment.patientIllness.length > 80 ? (
													<>
														{appointment.patientIllness.substring(0, 80)}...
														<button
															className="ml-1 text-primary underline hover:no-underline"
															onClick={() => setSelectedIllness(appointment.patientIllness)}
														>
															More
														</button>
													</>
												) : (
													appointment.patientIllness || "No illness information"
												)}
											</div>
											<div
												className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"
												title="Time since the appointment was requested"
											>
												<Clock className="size-3.5" /> Requested {timeElapsed(appointment.createdAt)}
											</div>
										</div>

										<div>
											<div className="flex flex-wrap items-center justify-between gap-3">
												<div className="flex flex-col gap-1 text-sm text-foreground/80">
													<span className="flex items-center gap-1.5" title="Requested Date">
														<Calendar className="size-4 text-muted-foreground" />
														{new Date(appointment.dateOfAppointment).toLocaleDateString("en-GB", {
															weekday: "short",
															day: "numeric",
															month: "short",
															year: "numeric",
														})}
													</span>
													<span className="flex items-center gap-1.5" title="Requested Time">
														<Clock className="size-4 text-muted-foreground" />
														{format12HourTime(appointment.timeSlot)}
													</span>
												</div>
												<Badge variant={appointment.amountPaid === 0 ? "secondary" : "default"} title="Consultation Fee">
													{appointment.amountPaid === 0 ? "Free" : `₹${appointment.amountPaid}`}
												</Badge>
											</div>
											<div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
												<strong className="block">Reason for Denial</strong>
												{appointment.doctorsMessage || "No reason was provided."}
											</div>
										</div>
									</div>
								</Card>
							))}
						</div>
					)}
				</TabsContent>
			</Tabs>

			{/* Payment Proof Image Gallery Modal */}
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

export default PatientList;
