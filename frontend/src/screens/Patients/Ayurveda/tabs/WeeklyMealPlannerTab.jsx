import { useState } from "react";
import { Apple, GlassWater, Moon, Salad, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const MEAL_META = {
	breakfast: { labelKey: "breakfast", defaultLabel: "Breakfast", icon: Sun },
	midMorning: { labelKey: "midMorning", defaultLabel: "Mid Morning", icon: Apple },
	lunch: { labelKey: "lunch", defaultLabel: "Lunch", icon: Salad },
	eveningSnack: { labelKey: "eveningSnack", defaultLabel: "Evening Snack", icon: GlassWater },
	dinner: { labelKey: "dinner", defaultLabel: "Dinner", icon: Moon },
};
const MEAL_KEYS = Object.keys(MEAL_META);

function MealCard({ mealKey, meal }) {
	const { t } = useTranslation();
	const meta = MEAL_META[mealKey];
	const Icon = meta.icon;
	const label = t(`weeklyMealPlanner.meals.${meta.labelKey}`, meta.defaultLabel);
	const hasItems = meal?.items?.length;

	return (
		<div className="flex flex-col gap-3 rounded-(--jh-radius-lg) bg-card p-4 shadow-(--jh-shadow-rest)">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
					<Icon size={16} className="shrink-0 text-primary" /> {label}
				</div>
				{meal?.portion ? (
					<Badge variant="secondary" className="max-w-full whitespace-normal text-left break-words">
						{meal.portion}
					</Badge>
				) : null}
			</div>

			{hasItems ? (
				<div className="flex flex-wrap gap-1.5">
					{meal.items.map((item, i) => (
						<Badge key={i} variant="success" className="max-w-full whitespace-normal text-left break-words">
							{item}
						</Badge>
					))}
				</div>
			) : (
				<p className="text-sm text-muted-foreground">{t("weeklyMealPlanner.notSpecified", "Not specified")}</p>
			)}

			{meal?.purpose ? <p className="text-xs italic text-muted-foreground">{meal.purpose}</p> : null}
		</div>
	);
}

function WeeklyMealPlannerTab({ plan }) {
	const { t } = useTranslation();
	const days = plan?.weeklyPlan || [];
	const [selectedDay, setSelectedDay] = useState(0);

	if (!plan || !days.length) {
		return (
			<EmptyState
				title={t("weeklyMealPlanner.emptyTitle", "No weekly plan yet")}
				description={t("weeklyMealPlanner.emptyDesc", "Generate a diet plan from the Overview tab to see the 7-day meal planner.")}
			/>
		);
	}

	const active = days[selectedDay] || days[0];

	return (
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-2">
				{days.map((d, i) => {
					const dayKey = (d.day || "").slice(0, 3).toLowerCase();
					const dayLabel = t(`weeklyMealPlanner.days.${dayKey}`, (d.day || "").slice(0, 3).toUpperCase());
					return (
						<button
							key={d.day}
							type="button"
							onClick={() => setSelectedDay(i)}
							className={cn(
								"rounded-(--jh-radius-md) px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
								i === selectedDay ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground hover:bg-secondary",
							)}
						>
							{dayLabel}
						</button>
					);
				})}
			</div>

			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{MEAL_KEYS.map((key) => <MealCard key={key} mealKey={key} meal={active[key]} />)}
			</div>
		</div>
	);
}

export default WeeklyMealPlannerTab;
