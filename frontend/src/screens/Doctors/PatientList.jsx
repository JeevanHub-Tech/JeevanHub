import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ChevronRight } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

// A patient directory, not an appointment log -- each patient this doctor has
// actually consulted (at least one completed accepted visit) appears exactly
// once here, however many times they've booked. For a specific visit's
// details/prescription, drill into the patient (see PatientDetail.jsx).
function PatientList() {
	const navigate = useNavigate();
	const [patients, setPatients] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

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
						setPatients([]);
						setLoading(false);
						return;
					}
					throw new Error("Failed to fetch appointments");
				}

				const data = await response.json();
				const currentTime = new Date();
				const rawBookings = Array.isArray(data.bookings) ? data.bookings : [];

				// Only visits that actually happened (accepted + slot time has passed)
				// count as "previously consulted" -- an upcoming confirmed booking
				// doesn't belong in a patient directory yet.
				const consulted = rawBookings.filter((appointment) => {
					if (appointment.requestAccept !== "accepted") return false;
					const appointmentDateTime = parseAppointmentDateTime(appointment.dateOfAppointment, appointment.timeSlot);
					const endTime = new Date(appointmentDateTime);
					endTime.setMinutes(endTime.getMinutes() + 30);
					return currentTime > endTime;
				});
				consulted.sort((a, b) => new Date(b.dateOfAppointment) - new Date(a.dateOfAppointment));

				// One row per unique patient (idempotent) -- visits collapse under
				// the most recent one seen, since `consulted` is already newest-first.
				const byPatient = new Map();
				consulted.forEach((appointment) => {
					const key = appointment.patientId?._id || appointment.patientId || appointment.patientEmail;
					if (!byPatient.has(key)) {
						byPatient.set(key, { key, patientId: appointment.patientId?._id || appointment.patientId, latest: appointment, visitCount: 0 });
					}
					byPatient.get(key).visitCount += 1;
				});

				setPatients([...byPatient.values()]);
				setLoading(false);
			} catch (err) {
				setError(err.message);
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
			<DashboardPageHeader
				title="Patient List"
				description="Everyone you've previously consulted. Open a patient to see their profile, medical history, and past appointments."
			/>

			{patients.length === 0 ? (
				<p className="text-center text-muted-foreground">No previously consulted patients yet.</p>
			) : (
				<div className="flex flex-col gap-4">
					{patients.map(({ key, patientId, latest, visitCount }) => (
						<Card
							key={key}
							className="cursor-pointer p-6 transition-colors hover:border-primary"
							onClick={() => patientId && navigate(`/patient-list/${patientId}`)}
						>
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div>
									<div className="flex flex-wrap items-center gap-2">
										<h3 className="text-lg font-semibold text-foreground">{latest.patientName}</h3>
										<Badge variant="secondary" title="Total consultations with you">
											{visitCount} visit{visitCount > 1 ? "s" : ""}
										</Badge>
									</div>
									<p className="mt-1 text-sm text-muted-foreground">
										{latest.patientAge || "N/A"} yrs &bull; {latest.patientGender || "N/A"} &bull; {latest.patientEmail || "N/A"}
									</p>
									<p className="mt-2 text-xs text-muted-foreground">
										Last consulted{" "}
										{new Date(latest.dateOfAppointment).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
									</p>
									{latest.rating ? (
										<div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
											<Star className="size-3.5 fill-primary text-primary" /> {latest.rating}/5 (latest visit)
										</div>
									) : null}
								</div>

								<Button
									variant="outline"
									onClick={(e) => {
										e.stopPropagation();
										patientId && navigate(`/patient-list/${patientId}`);
									}}
								>
									View Patient <ChevronRight className="size-4" />
								</Button>
							</div>
						</Card>
					))}
				</div>
			)}
		</DashboardShell>
	);
}

export default PatientList;
