import { useState, useEffect } from "react";
import { CalendarClock, History as HistoryIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";

const Appointments = ({ doctorId }) => {
	const [doctorBookings, setDoctorBookings] = useState([]);
	const [loadingBookings, setLoadingBookings] = useState(true);
	const [upcomingAppointments, setUpcomingAppointments] = useState([]);
	const [pastAppointments, setPastAppointments] = useState([]);

	useEffect(() => {
		const fetchDoctorBookings = async () => {
			try {
				const token = localStorage.getItem("token");
				const res = await authFetch(`${BACKEND_URL}/api/bookings/doctor/${doctorId}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!res.ok) {
					if (res.status === 404) {
						setDoctorBookings([]);
						return;
					}
					throw new Error("Failed to fetch doctor bookings");
				}

				const data = await res.json();
				setDoctorBookings(data.bookings || []);
			} catch (error) {
				console.error("Error fetching doctor bookings:", error);
			} finally {
				setLoadingBookings(false);
			}
		};

		if (doctorId) fetchDoctorBookings();
	}, [doctorId]);

	useEffect(() => {
		const now = new Date();

		const upcoming = doctorBookings
			.filter((b) => new Date(b.dateOfAppointment) >= now)
			.sort((a, b) => new Date(a.dateOfAppointment) - new Date(b.dateOfAppointment))
			.map((b) => ({
				id: b._id,
				patient: b.patientName,
				date: b.dateOfAppointment,
				time: b.timeSlot,
				reason: b.patientIllness,
			}));

		const past = doctorBookings
			.filter((b) => new Date(b.dateOfAppointment) < now)
			.sort((a, b) => new Date(b.dateOfAppointment) - new Date(a.dateOfAppointment))
			.map((b) => ({
				id: b._id,
				patient: b.patientName,
				date: b.dateOfAppointment,
				time: b.timeSlot,
				reason: b.doctorsMessage,
			}));

		setUpcomingAppointments(upcoming);
		setPastAppointments(past);
	}, [doctorBookings]);

	return (
		<Card className="p-6">
			<h3 className="flex items-center gap-2 border-b border-border pb-4 text-xl font-semibold text-foreground">
				<CalendarClock className="size-5" /> My Appointments
			</h3>

			<div className="mt-5">
				<h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-muted-foreground">
					<CalendarClock className="size-4" /> Upcoming Schedule
				</h4>
				<div className="flex flex-col gap-3">
					{loadingBookings ? (
						<p className="text-sm text-muted-foreground">Loading appointments...</p>
					) : upcomingAppointments.length > 0 ? (
						upcomingAppointments.map((appt) => (
							<div
								key={appt.id}
								className="flex items-center gap-5 rounded-lg border border-border bg-muted/40 p-4 transition-transform hover:-translate-y-0.5 hover:shadow-md"
							>
								<div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-primary py-2 text-center font-bold text-primary-foreground">
									<span className="text-2xl leading-none">
										{new Date(appt.date).toLocaleDateString("en-US", { day: "numeric" })}
									</span>
									<span className="text-xs uppercase">
										{new Date(appt.date).toLocaleDateString("en-US", { month: "short" })}
									</span>
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-foreground">Patient: {appt.patient}</p>
									<p className="mt-1 text-sm text-muted-foreground">Illness: {appt.reason}</p>
								</div>
								<div className="shrink-0 font-bold text-primary">{appt.time}</div>
							</div>
						))
					) : (
						<p className="rounded-lg py-5 text-center italic text-muted-foreground">
							No upcoming appointments scheduled.
						</p>
					)}
				</div>
			</div>

			<div className="mt-5">
				<h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-muted-foreground">
					<HistoryIcon className="size-4" /> Past Visits
				</h4>
				<div className="flex flex-col gap-4 pl-2">
					{loadingBookings ? (
						<p className="text-sm text-muted-foreground">Loading past visits...</p>
					) : pastAppointments.length > 0 ? (
						pastAppointments.map((visit) => (
							<div key={visit.id} className="rounded-lg border border-border bg-muted/40 p-4">
								<div className="flex flex-wrap items-center justify-between gap-1">
									<p className="font-bold text-foreground">Patient: {visit.patient}</p>
									<p className="text-sm text-muted-foreground">
										{new Date(visit.date).toLocaleDateString("en-GB", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
									</p>
								</div>
								<div className="mt-1 text-sm text-muted-foreground">
									<p>
										<strong className="text-foreground">Notes:</strong> {visit.reason}
									</p>
								</div>
							</div>
						))
					) : (
						<p className="rounded-lg py-5 text-center italic text-muted-foreground">No past visits recorded.</p>
					)}
				</div>
			</div>
		</Card>
	);
};

export default Appointments;
