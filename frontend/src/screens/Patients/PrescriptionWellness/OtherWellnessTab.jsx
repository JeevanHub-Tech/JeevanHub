import { useState, useEffect, useContext } from "react";
import { Leaf } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { SourceBadge } from "@/components/ui/SourceBadge";
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

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between gap-3">
				<h2 className="font-display text-lg text-foreground">Other Wellness Recommendations</h2>
				<SourceBadge status={plan.status || "ai"} />
			</div>
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
