import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, CalendarClock } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

const History = ({ bookings }) => {
	const [upcomingAppointments, setUpcomingAppointments] = useState([]);
	const [pastAppointments, setPastAppointments] = useState([]);

	useEffect(() => {
		const now = new Date();

		const upcoming = bookings
			.filter((b) => new Date(b.dateOfAppointment) >= now)
			.sort((a, b) => new Date(a.dateOfAppointment) - new Date(b.dateOfAppointment))
			.map((b) => ({
				id: b._id,
				doctor: b.doctorName,
				date: b.dateOfAppointment,
				time: b.timeSlot,
				reason: b.meetLink,
			}));

		const past = bookings
			.filter((b) => new Date(b.dateOfAppointment) < now)
			.sort((a, b) => new Date(b.dateOfAppointment) - new Date(a.dateOfAppointment))
			.map((b) => ({
				id: b._id,
				doctor: b.doctorName,
				date: b.dateOfAppointment,
				time: b.timeSlot,
				reason: b.doctorsMessage,
			}));

		setUpcomingAppointments(upcoming);
		setPastAppointments(past);
	}, [bookings]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 font-display text-xl">
					<HistoryIcon size={20} /> Medical History &amp; Appointments
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-10">
				<div>
					<h4 className="mb-6 flex items-center gap-2 border-b border-border pb-3 text-base font-semibold text-foreground">
						<CalendarClock size={18} /> Upcoming Schedule
					</h4>
					<div className="flex flex-col gap-4">
						{upcomingAppointments.length > 0 ? (
							upcomingAppointments.map((appt) => (
								<div
									key={appt.id}
									className="flex flex-wrap items-center gap-4 rounded-(--jh-radius-md) border border-border bg-secondary p-4 transition-shadow hover:shadow-(--jh-shadow-rest)"
								>
									<div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-(--jh-radius-sm) bg-accent text-center font-bold text-accent-foreground">
										<span className="text-2xl leading-tight">
											{new Date(appt.date).toLocaleDateString("en-US", { day: "numeric" })}
										</span>
										<span className="text-xs uppercase">
											{new Date(appt.date).toLocaleDateString("en-US", { month: "short" })}
										</span>
									</div>
									<div className="min-w-0 flex-1">
										<p className="font-semibold text-foreground">{appt.doctor}</p>
										<p className="text-sm text-muted-foreground">
											<strong>Link: </strong>
											<a href={appt.reason} className="break-all text-primary hover:underline" target="_blank" rel="noopener noreferrer">
												{appt.reason}
											</a>
										</p>
									</div>
									<div className="whitespace-nowrap rounded-(--jh-radius-pill) bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
										{appt.time}
									</div>
								</div>
							))
						) : (
							<EmptyState icon={CalendarClock} title="No upcoming appointments" description="Scheduled visits will appear here." />
						)}
					</div>
				</div>

				<div>
					<h4 className="mb-6 flex items-center gap-2 border-b border-border pb-3 text-base font-semibold text-foreground">
						<HistoryIcon size={18} /> Past Visits
					</h4>
					{pastAppointments.length > 0 ? (
						<div className="relative border-l-2 border-border pl-8">
							{pastAppointments.map((visit) => (
								<div key={visit.id} className="relative mb-8 last:mb-0">
									<div className="absolute -left-[2.65rem] top-1 size-3.5 rounded-full border-[3px] border-primary bg-card" />
									<div className="rounded-(--jh-radius-md) border border-border bg-secondary p-4">
										<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
											<p className="font-semibold text-foreground">{visit.doctor}</p>
											<p className="whitespace-nowrap text-sm text-muted-foreground">
												{new Date(visit.date).toLocaleDateString("en-GB", {
													day: 'numeric',
													month: 'long',
													year: 'numeric',
												})}
											</p>
										</div>
										<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
											<strong className="text-foreground">Reason:</strong> {visit.reason}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<EmptyState icon={HistoryIcon} title="No past visits recorded" />
					)}
				</div>
			</CardContent>
		</Card>
	);
};

export default History;
