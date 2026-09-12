import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Stethoscope, Send, Loader2, Activity, ChevronLeft, Salad } from "lucide-react";

import { PatientHeader } from "./PatientHeader";
import { PrescriptionHistory } from "./PrescriptionHistory";
import { PrescriptionTabs } from "./PrescriptionTabs";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const BACKEND = BACKEND_URL || "http://localhost:8080";

const PrescribeIndex = () => {
	const { bookingId } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const targetTab = searchParams.get("tab") || location.state?.tab;

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
				<Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
					<ChevronLeft className="size-4" /> Back
				</Button>
				<Card className="mx-auto max-w-2xl p-8 text-center">
					<p className="text-foreground">{error || "This appointment could not be found."}</p>
					<p className="mt-2 text-sm text-muted-foreground">Please go back to your appointment list and try again.</p>
				</Card>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell
			className="min-h-screen bg-background"
			containerClassName="max-w-[1600px] w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-6"
		>
			<div className="mx-auto w-full min-w-0 space-y-6">
				{/* Top Action Bar */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Button
						variant="outline"
						size="sm"
						className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-card px-3.5 py-2 text-sm font-semibold text-primary shadow-xs transition-all hover:bg-primary hover:text-primary-foreground dark:border-primary/50 dark:hover:bg-primary"
						onClick={() => navigate(-1)}
					>
						<ChevronLeft className="size-4" /> Back
					</Button>
					{booking.dateOfAppointment && (
						<Badge variant="outline" className="border-border/80 bg-card/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-xs">
							Consultation Date: {new Date(booking.dateOfAppointment).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
						</Badge>
					)}
				</div>

				{/* Patient Header Card */}
				<div className="w-full min-w-0">
					<PatientHeader patient={booking.patientId} prakritiDosha={prakritiDosha} />
				</div>

				{/* Diet Plan Request Alert Banner - Eye Catching & Site Themed */}
				{booking.dietPlanRequested && (
					<div className="w-full min-w-0 rounded-(--jh-radius-lg) border-y border-r border-l-4 border-primary/30 border-l-primary bg-gradient-to-r from-primary/15 via-primary/10 to-amber-500/10 p-4.5 shadow-(--jh-shadow-rest)">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div className="flex items-center gap-3.5 min-w-0">
								<span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-xs border border-primary/30">
									<Salad size={22} />
								</span>
								<div className="min-w-0">
									<h4 className="font-display text-base font-bold text-foreground">
										Paid Personalized Diet Plan Requested (+₹{booking.dietPlanFee || 299})
									</h4>
									<p className="mt-0.5 text-xs text-foreground/80 leading-relaxed">
										The patient purchased a customized 7-day Ayurvedic meal plan. Please review and tailor the &quot;Diet &amp; Meal Planner&quot; tab below.
									</p>
								</div>
							</div>
							<Badge
								className={cn(
									"shrink-0 px-3 py-1.5 text-xs font-bold shadow-xs",
									booking.dietPlanStatus === "completed"
										? "bg-primary text-primary-foreground border-transparent"
										: "bg-amber-600 text-white border-transparent animate-pulse"
								)}
							>
								{booking.dietPlanStatus === "completed" ? "✓ Diet Plan Published" : "⚡ Action Required — Tailor Plan"}
							</Badge>
						</div>
					</div>
				)}

				{/* Patient Reason and Diagnosis for this visit */}
				<div className="w-full min-w-0">
					<Card className="grid grid-cols-1 gap-6 p-4.5 sm:grid-cols-[1fr_1.2fr]">
						<div>
							<span className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
								<Activity size={14} className="text-primary" /> Patient Reason
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

				{/* Main Prescription Grid: History on Left + Tabs on Right */}
				<div className="grid w-full min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
					<div className="w-full min-w-0">
						<PrescriptionHistory
							prescriptions={history}
							loading={loadingHistory}
							sharedRecords={booking.patientSharedRecords || []}
							currentBookingId={booking._id}
						/>
					</div>

					<div className="flex w-full min-w-0 flex-col gap-5">
						<PrescriptionTabs
							bookingId={booking._id}
							patientId={patientId}
							doctorId={booking.doctorId}
							dietPlanRequested={booking.dietPlanRequested}
							defaultTab={targetTab}
							onPrescribed={refetchHistory}
						/>

						<Card className="flex flex-wrap items-center justify-between gap-4 p-4.5">
							<p className="max-w-[480px] text-sm leading-relaxed text-muted-foreground">
								Each panel's Save keeps your work as a private draft -- the patient sees nothing until you submit. Submit once everything for this visit is ready.
							</p>
							<Button onClick={submitPrescription} disabled={submitting}>
								{submitting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
								Submit Prescription
							</Button>
						</Card>
					</div>
				</div>
			</div>
		</DashboardShell>
	);
};

export default PrescribeIndex;
