import { useState } from "react";
import { Apple, GlassWater, Moon, Salad, Sun } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const MEAL_META = {
	breakfast: { label: "Breakfast", icon: Sun },
	midMorning: { label: "Mid Morning", icon: Apple },
	lunch: { label: "Lunch", icon: Salad },
	eveningSnack: { label: "Evening Snack", icon: GlassWater },
	dinner: { label: "Dinner", icon: Moon },
};
const MEAL_KEYS = Object.keys(MEAL_META);

function MealCard({ mealKey, meal }) {
	const { label, icon: Icon } = MEAL_META[mealKey];
	const hasItems = meal?.items?.length;

	return (
		<div className="flex flex-col gap-3 rounded-(--jh-radius-lg) bg-card p-4 shadow-(--jh-shadow-rest)">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
					<Icon size={16} className="text-primary" /> {label}
				</div>
				{meal?.portion ? <Badge variant="secondary">{meal.portion}</Badge> : null}
			</div>

			{hasItems ? (
				<div className="flex flex-wrap gap-1.5">
					{meal.items.map((item, i) => <Badge key={i} variant="success">{item}</Badge>)}
				</div>
			) : (
				<p className="text-sm text-muted-foreground">Not specified</p>
			)}

			{meal?.purpose ? <p className="text-xs italic text-muted-foreground">{meal.purpose}</p> : null}
		</div>
	);
}

function WeeklyMealPlannerTab({ plan }) {
	const days = plan?.weeklyPlan || [];
	const [selectedDay, setSelectedDay] = useState(0);

	if (!plan || !days.length) {
		return <EmptyState title="No weekly plan yet" description="Generate a diet plan from the Overview tab to see the 7-day meal planner." />;
	}

	const active = days[selectedDay] || days[0];

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-2">
				{days.map((d, i) => (
					<button
						key={d.day}
						type="button"
						onClick={() => setSelectedDay(i)}
						className={cn(
							"rounded-(--jh-radius-md) px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							i === selectedDay ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground hover:bg-secondary",
						)}
					>
						{d.day.slice(0, 3)}
					</button>
				))}
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{MEAL_KEYS.map((key) => <MealCard key={key} mealKey={key} meal={active[key]} />)}
			</div>
		</div>
	);
}

export default WeeklyMealPlannerTab;
