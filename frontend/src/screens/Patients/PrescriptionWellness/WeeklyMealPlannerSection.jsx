import { useState, useEffect, useCallback, useContext } from "react";
import { Salad, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { SourceBadge } from "@/components/ui/SourceBadge";
import { formatDateReadable } from "@/lib/date";
import { AuthContext } from "../../../context/AuthContext";
import { BACKEND_URL } from "../../../config";
import { authFetch } from "../../../utils/authFetch";
import WeeklyMealPlannerTab from "../Ayurveda/tabs/WeeklyMealPlannerTab";

const API = BACKEND_URL || "http://localhost:8080";

// The weekly meal plan itself is owned by AyurvedaDietPlan -- AI-generated,
// with a doctor-review layer. Patient-facing rendering reads `displayPlan`
// exclusively (server-resolved: doctor version once one exists, else the
// raw AI plan) so a doctor-approved plan is never silently shadowed by the
// original AI content. See resolveDisplayPlan() in ayurvedaController.js.
function WeeklyMealPlannerSection() {
	const { auth } = useContext(AuthContext);
	const [plan, setPlan] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchPlan = useCallback(async () => {
		if (!auth?.token) {
			setLoading(false);
			return;
		}
		setLoading(true);
		try {
			const res = await authFetch(`${API}/api/ayurveda/diet-plan`);
			if (res.ok) setPlan(await res.json());
		} catch (error) {
			console.error("Error fetching diet plan:", error);
		} finally {
			setLoading(false);
		}
	}, [auth?.token]);

	useEffect(() => {
		fetchPlan();
	}, [fetchPlan]);

	const doctorReview = plan?.doctorReview;
	const isDoctorApproved = Boolean(doctorReview?.published || plan?.status === "doctor_approved");
	const doctorDisplayName = doctorReview?.doctorName ||
		(doctorReview?.reviewedBy?.firstName
			? `Dr. ${doctorReview.reviewedBy.firstName} ${doctorReview.reviewedBy.lastName || ""}`.trim()
			: (typeof doctorReview?.reviewedBy === "string" ? doctorReview.reviewedBy : "your doctor"));
	const reviewedDate = doctorReview?.reviewedAt ? formatDateReadable(doctorReview.reviewedAt) : "";

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<Salad className="size-5 text-primary" />
					<h2 className="font-display text-lg text-foreground">Weekly Meal Planner</h2>
					{plan ? <SourceBadge status={plan.status || "ai"} /> : null}
				</div>
			</div>

			{isDoctorApproved ? (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-amber-500/10 p-3.5 text-xs text-foreground shadow-xs">
					<div className="flex flex-wrap items-center gap-2">
						<span className="inline-flex items-center gap-1.5 rounded-md bg-primary/20 px-2.5 py-1 font-bold text-primary">
							<UserCheck size={14} /> Doctor Approved
						</span>
						<span className="font-semibold text-foreground">
							Made by {doctorDisplayName}{reviewedDate ? ` on ${reviewedDate}` : ""}
						</span>
					</div>
					{doctorReview?.notes ? (
						<p className="w-full text-xs italic text-muted-foreground sm:w-auto">
							&ldquo;{doctorReview.notes}&rdquo;
						</p>
					) : null}
				</div>
			) : (
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-(--jh-radius-md) border border-emerald-600/30 bg-emerald-500/5 p-3.5 text-xs text-foreground">
					<div className="flex items-center gap-2.5">
						<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
							<Salad size={16} />
						</span>
						<div>
							<p className="font-semibold text-foreground">Want a Doctor-Certified Personalized Diet Plan?</p>
							<p className="text-muted-foreground">
								Have your consulting Ayurvedic doctor review and tailor this 7-day routine specifically for your Dosha & illness.
							</p>
						</div>
					</div>
					<Link
						to="/appointed-doctor"
						className="inline-flex items-center gap-1 rounded-(--jh-radius-md) bg-emerald-600 px-3 py-1.5 font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
					>
						Request with Doctor →
					</Link>
				</div>
			)}

			{loading ? (
				<p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
			) : (
				<WeeklyMealPlannerTab plan={plan?.displayPlan} />
			)}
		</div>
	);
}

export default WeeklyMealPlannerSection;
