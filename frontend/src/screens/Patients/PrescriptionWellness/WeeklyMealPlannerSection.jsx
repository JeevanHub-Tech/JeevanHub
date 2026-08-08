import { useState, useEffect, useCallback, useContext } from "react";
import { Salad } from "lucide-react";

import { SourceBadge } from "@/components/ui/SourceBadge";
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

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<Salad className="size-5 text-primary" />
					<h2 className="font-display text-lg text-foreground">Weekly Meal Planner</h2>
					{plan ? <SourceBadge status={plan.status || "ai"} /> : null}
				</div>
			</div>

			{loading ? (
				<p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
			) : (
				<WeeklyMealPlannerTab plan={plan?.displayPlan} />
			)}
		</div>
	);
}

export default WeeklyMealPlannerSection;
