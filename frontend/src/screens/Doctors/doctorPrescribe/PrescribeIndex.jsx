import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Stethoscope, Send, Loader2, Activity } from "lucide-react";

import { PatientHeader } from "./PatientHeader";
import { PrescriptionHistory } from "./PrescriptionHistory";
import { PrescriptionTabs } from "./PrescriptionTabs";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field";

const BACKEND = BACKEND_URL || "http://localhost:8080";

const PrescribeIndex = () => {
	const { bookingId } = useParams();

	const [booking, setBooking] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [prakritiDosha, setPrakritiDosha] = useState(null);
	const [history, setHistory] = useState([]);
	const [loadingHistory, setLoadingHistory] = useState(true);

	const [diagnosis, setDiagnosis] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const patientId = booking?.patientId?._id;

	useEffect(() => {
		const fetchBooking = async () => {
			if (!bookingId) {
				setLoading(false);
				setError("No appointment was selected.");
				return;
			}
			setLoading(true);
			setError(null);
			try {
				const response = await authFetch(`${BACKEND}/api/bookings/${bookingId}`);
				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					throw new Error(errData.error || "Failed to load this appointment.");
				}
				const data = await response.json();
				setBooking(data.booking);
				setDiagnosis(data.booking.diagnosis || "");
			} catch (err) {
				console.error("Error fetching booking:", err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchBooking();
	}, [bookingId]);

	const refetchHistory = useCallback(async () => {
		if (!patientId) return;
		setLoadingHistory(true);
		try {
			const response = await authFetch(`${BACKEND}/api/bookings/history/patient/${patientId}`);
			if (response.ok) {
				const data = await response.json();
				setHistory(data.bookings || []);
			}
		} catch (err) {
			console.error("Error fetching prescription history:", err);
		} finally {
			setLoadingHistory(false);
		}
	}, [patientId]);

	useEffect(() => {
		refetchHistory();
	}, [refetchHistory]);

	useEffect(() => {
		const fetchPrakriti = async () => {
			if (!patientId) return;
			try {
				const response = await authFetch(`${BACKEND}/api/prakriti/assessment/patient/${patientId}`);
				if (response.ok) {
					const data = await response.json();
					setPrakritiDosha(data?.dominantDosha || null);
				}
			} catch (err) {
				console.error("Error fetching Prakriti assessment:", err);
			}
		};
		fetchPrakriti();
	}, [patientId]);

	const saveDiagnosis = async () => {
		try {
			await authFetch(`${BACKEND}/api/bookings/${bookingId}/diagnosis`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ diagnosis }),
			});
		} catch (err) {
			console.error("Failed to save diagnosis:", err);
		}
	};

	// Everything (medicine rows, diet, yoga, diagnosis) already saves in realtime as the
	// doctor works. "Submit" is the deliberate, one-time signal to the patient that the
	// full prescription/treatment plan for this visit is ready to review.
	const submitPrescription = async () => {
		setSubmitting(true);
		try {
			const response = await authFetch(`${BACKEND}/api/bookings/${bookingId}/notify-prescription`, {
				method: "POST",
			});
			if (!response.ok) throw new Error("Failed to submit");
			alert("The prescription has been submitted — the patient has been notified.");
		} catch (err) {
			alert("Could not submit the prescription. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<DashboardShell>
				<p className="text-center text-lg font-bold text-primary">Loading patient details...</p>
			</DashboardShell>
		);
	}

	if (error || !booking) {
		return (
			<DashboardShell>
				<Card className="mx-auto max-w-2xl p-8 text-center">
					<p className="text-foreground">{error || "This appointment could not be found."}</p>
					<p className="mt-2 text-sm text-muted-foreground">Please go back to your appointment list and try again.</p>
				</Card>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<div className="mx-auto grid max-w-[1320px] grid-cols-1 items-start gap-6 lg:grid-cols-[340px_1fr]">
				<div className="col-span-full">
					<PatientHeader patient={booking.patientId} prakritiDosha={prakritiDosha} />
				</div>

				<div className="col-span-full">
					<Card className="grid grid-cols-1 gap-6 p-4.5 sm:grid-cols-[1fr_1.2fr]">
						<div>
							<span className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">
								<Activity size={14} /> Patient's complaint
							</span>
							<p className="text-sm leading-relaxed text-foreground/80">{booking.patientIllness || "Not specified"}</p>
						</div>
						<div className="flex flex-col">
							<FieldLabel
								htmlFor="pi-diagnosis"
								className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide"
							>
								<Stethoscope size={14} /> Diagnosis for this visit
							</FieldLabel>
							<Input
								id="pi-diagnosis"
								placeholder="e.g., Amavata (rheumatoid-type joint inflammation)"
								value={diagnosis}
								onChange={(e) => setDiagnosis(e.target.value)}
								onBlur={saveDiagnosis}
							/>
						</div>
					</Card>
				</div>

				<div>
					<PrescriptionHistory
						prescriptions={history}
						loading={loadingHistory}
						sharedRecords={booking.patientSharedRecords || []}
						currentBookingId={booking._id}
					/>
				</div>

				<div className="flex flex-col gap-5">
					<PrescriptionTabs
						bookingId={booking._id}
						patientId={patientId}
						doctorId={booking.doctorId}
						onPrescribed={refetchHistory}
					/>

					<Card className="flex flex-wrap items-center justify-between gap-4 p-4.5">
						<p className="max-w-[480px] text-sm leading-relaxed text-muted-foreground">
							Medicines, diet, and yoga plans save automatically as you go. Submit once everything for this visit is ready.
						</p>
						<Button onClick={submitPrescription} disabled={submitting}>
							{submitting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
							Submit Prescription
						</Button>
					</Card>
				</div>
			</div>
		</DashboardShell>
	);
};

export default PrescribeIndex;
