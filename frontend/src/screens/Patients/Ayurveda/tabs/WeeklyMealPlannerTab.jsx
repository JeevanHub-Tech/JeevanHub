import { useState } from "react";
import { Apple, ChefHat, GlassWater, Moon, Salad, Sparkles, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import MealRecipeModal from "@/components/ayurveda/MealRecipeModal";

const MEAL_META = {
	breakfast: { labelKey: "breakfast", defaultLabel: "Breakfast", icon: Sun },
	midMorning: { labelKey: "midMorning", defaultLabel: "Mid Morning", icon: Apple },
	lunch: { labelKey: "lunch", defaultLabel: "Lunch", icon: Salad },
	eveningSnack: { labelKey: "eveningSnack", defaultLabel: "Evening Snack", icon: GlassWater },
	dinner: { labelKey: "dinner", defaultLabel: "Dinner", icon: Moon },
};
const MEAL_KEYS = Object.keys(MEAL_META);

function MealCard({ mealKey, meal, day, onOpenRecipe }) {
	const { t } = useTranslation();
	const meta = MEAL_META[mealKey];
	const Icon = meta.icon;
	const label = t(`weeklyMealPlanner.meals.${meta.labelKey}`, meta.defaultLabel);
	const hasItems = Array.isArray(meal?.items) && meal.items.length > 0;

	return (
		<div className="flex flex-col justify-between gap-3 rounded-(--jh-radius-lg) bg-card p-4 shadow-(--jh-shadow-rest) border border-border/60 hover:border-primary/30 transition-all">
			<div className="space-y-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
						<Icon size={16} className="shrink-0 text-primary" /> {label}
					</div>
					{meal?.portion ? (
						<Badge variant="secondary" className="max-w-full whitespace-normal text-left break-words text-xs font-normal">
							{meal.portion}
						</Badge>
					) : null}
				</div>

				{hasItems ? (
					<div className="flex flex-wrap gap-1.5">
						{meal.items.map((item, i) => (
							<Badge key={i} variant="success" className="max-w-full whitespace-normal text-left break-words text-xs font-normal">
								{item}
							</Badge>
						))}
					</div>
				) : (
					<p className="text-xs text-muted-foreground">{t("weeklyMealPlanner.notSpecified", "Not specified")}</p>
				)}

				{meal?.purpose ? <p className="text-xs italic text-muted-foreground">{meal.purpose}</p> : null}
			</div>

			{hasItems ? (
				<div className="pt-2 border-t border-border/50 flex justify-end">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => onOpenRecipe({ mealKey, meal, day })}
						className="h-7 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1.5 px-2.5 rounded-(--jh-radius-sm)"
					>
						<ChefHat size={14} />
						<span>{t("weeklyMealPlanner.viewRecipe", "View Recipe & Prep")}</span>
					</Button>
				</div>
			) : null}
		</div>
	);
}

function WeeklyMealPlannerTab({ plan, patientId }) {
	const { t } = useTranslation();
	const days = plan?.weeklyPlan || [];
	const [selectedDay, setSelectedDay] = useState(0);
	const [activeRecipeModal, setActiveRecipeModal] = useState(null);

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
				{MEAL_KEYS.map((key) => (
					<MealCard
						key={key}
						mealKey={key}
						meal={active[key]}
						day={active.day}
						onOpenRecipe={(info) => setActiveRecipeModal(info)}
					/>
				))}
			</div>

			{activeRecipeModal && (
				<MealRecipeModal
					isOpen={Boolean(activeRecipeModal)}
					onClose={() => setActiveRecipeModal(null)}
					mealKey={activeRecipeModal.mealKey}
					day={activeRecipeModal.day}
					items={activeRecipeModal.meal?.items || []}
					portion={activeRecipeModal.meal?.portion}
					patientId={patientId}
				/>
			)}
		</div>
	);
}

export default WeeklyMealPlannerTab;
