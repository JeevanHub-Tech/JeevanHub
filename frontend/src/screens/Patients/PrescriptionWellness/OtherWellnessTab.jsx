import { useState, useEffect, useContext } from "react";
import { Leaf, UserCheck } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { formatDateReadable } from "@/lib/date";
import { AuthContext } from "../../../context/AuthContext";
import { BACKEND_URL } from "../../../config";
import { authFetch } from "../../../utils/authFetch";
import CookingInstructionsTab from "../Ayurveda/tabs/CookingInstructionsTab";
import FoodsToAvoidTab from "../Ayurveda/tabs/FoodsToAvoidTab";

const API = BACKEND_URL || "http://localhost:8080";

function OtherWellnessTab() {
	const { auth } = useContext(AuthContext);
	const [plan, setPlan] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!auth?.token) {
			setLoading(false);
			return;
		}
		(async () => {
			setLoading(true);
			try {
				const res = await authFetch(`${API}/api/ayurveda/diet-plan`);
				if (res.ok) setPlan(await res.json());
			} catch (error) {
				console.error("Error fetching wellness recommendations:", error);
			} finally {
				setLoading(false);
			}
		})();
	}, [auth?.token]);

	if (loading) {
		return <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>;
	}

	if (!plan) {
		return (
			<EmptyState
				icon={Leaf}
				title="Not added"
				description="Generate a diet plan from the Weekly Meal Planner tab to see cooking instructions and foods to avoid here."
			/>
		);
	}

	const doctorReview = plan?.doctorReview;
	const isDoctorApproved = Boolean(doctorReview?.published || plan?.status === "doctor_approved");
	const doctorDisplayName = doctorReview?.doctorName ||
		(doctorReview?.reviewedBy?.firstName
			? `Dr. ${doctorReview.reviewedBy.firstName} ${doctorReview.reviewedBy.lastName || ""}`.trim()
			: (typeof doctorReview?.reviewedBy === "string" ? doctorReview.reviewedBy : "your doctor"));
	const reviewedDate = doctorReview?.reviewedAt ? formatDateReadable(doctorReview.reviewedAt) : "";

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between gap-3">
				<h2 className="font-display text-lg text-foreground">Other Wellness Recommendations</h2>
				<SourceBadge status={plan.status || "ai"} />
			</div>

			{isDoctorApproved && (
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
			)}

			<div>
				<h3 className="mb-2 text-sm font-bold text-foreground">Cooking Instructions</h3>
				<CookingInstructionsTab plan={plan.displayPlan} />
			</div>
			<div>
				<h3 className="mb-2 text-sm font-bold text-foreground">Foods To Avoid</h3>
				<FoodsToAvoidTab plan={plan.displayPlan} />
			</div>
		</div>
	);
}

export default OtherWellnessTab;
