import { useState, useEffect } from "react";
import {
	Apple,
	Soup,
	GlassWater,
	CalendarDays,
	ChevronLeft,
	Clock,
	ArrowRight,
	Leaf,
	Sun,
	Moon,
	Activity,
	HeartPulse,
	Video,
	Salad
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldStat } from "./shared";
import { BACKEND_URL } from '../../../config';
import { authFetch } from "../../../utils/authFetch";

/* ==============================
   UI METADATA LAYER (Static Visuals Only)
   ============================== */
const DAY_UI_META = {
	monday: { label: "Light Detox", icon: <Leaf size={18} /> },
	tuesday: { label: "Energy Boost", icon: <Activity size={18} /> },
	wednesday: { label: "Digestion Focus", icon: <HeartPulse size={18} /> },
	thursday: { label: "Protein Day", icon: <Apple size={18} /> },
	friday: { label: "Cooling Day", icon: <GlassWater size={18} /> },
	saturday: { label: "Recovery", icon: <Moon size={18} /> },
	sunday: { label: "Relax & Reset", icon: <Sun size={18} /> }
};

const DietPlan = ({ patientId }) => {
	const [dietYogaData, setDietYogaData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedDay, setSelectedDay] = useState(null);
	const [selectedMeal, setSelectedMeal] = useState(null);

	useEffect(() => {
		const fetchDietYoga = async () => {
			try {
				const res = await authFetch(
					`${BACKEND_URL}/api/patients/dietYoga/${patientId}`,
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("token")}`
						}
					}
				);
				if (!res.ok) {
					if (res.status === 404) {
						setDietYogaData({ message: "Not Subscribed" });
						return;
					}
					throw new Error("Failed");
				}
				const data = await res.json();
				setDietYogaData(data);
			} catch (error) {
				console.error("Error diet:", error);
			} finally {
				setLoading(false);
			}
		};
		if (patientId) fetchDietYoga();
	}, [patientId]);

	/* ==============================
	   HELPER: REALISTIC RECIPE GENERATOR
	   (Backend only gives name, this generates structure)
	   ============================== */
	const getRecipe = (mealType, mealName) => ({
		name: mealName || "Consult your doctor",
		prep: "10 mins",
		cook: mealType === "juice" || mealType === "juices" ? "0 mins" : "20 mins",
		ingredients: [
			{ name: "Main Ingredient (As prescribed)", qty: "1 portion" },
			{ name: "Seasonal Vegetables/Fruits", qty: "As advised" },
			{ name: "Ayurvedic Spices", qty: "To taste" }
		],
		steps: [
			"Wash and prepare fresh ingredients.",
			"Cook gently on low flame to preserve nutrients.",
			"Add spices as recommended in your chart.",
			"Consume warm for best digestion."
		]
	});

	if (loading) {
		return (
			<Card>
				<CardContent className="flex flex-col gap-3">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-24 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!dietYogaData || dietYogaData.message || !dietYogaData.diet) {
		return (
			<Card>
				<CardContent>
					<EmptyState icon={CalendarDays} title="No diet plan assigned yet" description="Once a doctor assigns a diet & yoga plan, it will show up here." />
				</CardContent>
			</Card>
		);
	}

	/* ==============================
	   VIEW 3 – RECIPE DETAIL
	   ============================== */
	if (selectedMeal && selectedDay) {
		const dayData = dietYogaData.diet.weekly[selectedDay];
		const mealKey = selectedMeal === "juice" ? "juices" : selectedMeal;
		const mealName = dayData ? dayData[mealKey] : "Not assigned";
		const recipe = getRecipe(selectedMeal, mealName);

		return (
			<Card>
				<CardHeader className="border-b border-border pb-5">
					<button
						type="button"
						onClick={() => setSelectedMeal(null)}
						className="mb-4 flex w-fit cursor-pointer items-center gap-1.5 rounded-(--jh-radius-pill) bg-secondary px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
					>
						<ChevronLeft size={16} /> Back
					</button>
					<CardTitle className="font-display text-2xl tracking-tight text-primary">{selectedMeal.toUpperCase()}</CardTitle>
					<p className="text-muted-foreground">{recipe.name}</p>
				</CardHeader>

				<CardContent className="flex flex-col gap-10">
					<div>
						<h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
							<Leaf size={14} /> Ingredients
						</h4>
						<div className="flex flex-wrap gap-3">
							{recipe.ingredients.map((i, idx) => (
								<div key={idx} className="flex items-center gap-2 rounded-(--jh-radius-md) border border-border bg-secondary px-6 py-3 text-sm font-medium text-(--jh-olive-deep)">
									<span className="font-bold text-primary">• {i.qty}</span>
									<span>{i.name}</span>
								</div>
							))}
						</div>
					</div>

					<div>
						<h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
							<Clock size={14} /> Preparation
						</h4>
						<div className="mb-6 flex flex-wrap gap-4">
							<FieldStat icon={Clock} label="Prep" value={recipe.prep} className="min-w-36 rounded-(--jh-radius-md) border border-border bg-secondary p-4" />
							<FieldStat icon={Soup} label="Cook" value={recipe.cook} className="min-w-36 rounded-(--jh-radius-md) border border-border bg-secondary p-4" />
						</div>

						<div className="flex flex-col">
							{recipe.steps.map((s, i) => (
								<div key={i} className="flex gap-5 border-b border-border py-5 last:border-none">
									<div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
										{i + 1}
									</div>
									<p className="pt-1 text-sm leading-relaxed text-foreground">{s}</p>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	/* ==============================
	   VIEW 2 – DAILY MEALS
	   ============================== */
	if (selectedDay) {
		const uiMeta = DAY_UI_META[selectedDay] || { label: "Daily Plan", icon: <Sun size={18} /> };
		const dayData = dietYogaData.diet.weekly[selectedDay] || {};

		return (
			<Card>
				<CardHeader className="flex-row flex-wrap items-center gap-4 border-b border-border pb-5">
					<button
						type="button"
						onClick={() => setSelectedDay(null)}
						className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
					>
						<ChevronLeft size={18} /> Back to Week
					</button>
					<CardTitle className="font-display text-xl">{selectedDay.toUpperCase()} &bull; {uiMeta.label}</CardTitle>
				</CardHeader>

				<CardContent>
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						{["breakfast", "lunch", "dinner", "juice"].map((meal) => {
							const dataKey = meal === "juice" ? "juices" : meal;
							const mealContent = dayData[dataKey] || "Rest";
							const MealIcon = meal === "breakfast" ? Sun : meal === "lunch" ? Salad : meal === "dinner" ? Moon : GlassWater;

							return (
								<button
									key={meal}
									type="button"
									onClick={() => setSelectedMeal(meal)}
									className="group flex cursor-pointer items-center gap-5 rounded-(--jh-radius-lg) border border-border bg-secondary p-6 text-left transition-all hover:border-primary hover:bg-card hover:shadow-(--jh-shadow-rest)"
								>
									<span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-(--jh-shadow-rest)">
										<MealIcon size={24} />
									</span>
									<span className="min-w-0 flex-1">
										<span className="mb-1 block font-display text-lg text-foreground">{meal.toUpperCase()}</span>
										<span className="block truncate text-sm font-medium text-muted-foreground">{mealContent}</span>
									</span>
									<ArrowRight size={20} className="shrink-0 text-border transition-all group-hover:translate-x-1.5 group-hover:text-primary" />
								</button>
							);
						})}
					</div>
				</CardContent>
			</Card>
		);
	}

	/* ==============================
	   VIEW 1 – WEEKLY OVERVIEW & YOGA
	   ============================== */
	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between border-b border-border pb-5">
				<CardTitle className="flex items-center gap-3 font-display text-xl">
					<span className="flex size-10 items-center justify-center rounded-(--jh-radius-sm) bg-secondary text-primary">
						<CalendarDays size={20} />
					</span>
					Weekly Diet Plan
				</CardTitle>
				<Badge variant="success">Active Plan</Badge>
			</CardHeader>

			<CardContent className="flex flex-col gap-8">
				<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
					{Object.keys(DAY_UI_META).map((day) => (
						<button
							key={day}
							type="button"
							onClick={() => setSelectedDay(day)}
							className="flex cursor-pointer flex-col items-center gap-2 rounded-(--jh-radius-md) border border-border bg-card px-3 py-5 transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-secondary hover:shadow-(--jh-shadow-rest)"
						>
							<span className="text-sm font-bold text-foreground">{day.slice(0, 3).toUpperCase()}</span>
							<span className="text-[11px] font-semibold uppercase text-muted-foreground">{DAY_UI_META[day].label}</span>
						</button>
					))}
				</div>

				<div className="rounded-(--jh-radius-lg) border border-border bg-secondary/60 p-6">
					<div className="mb-6 border-b border-border/60 pb-4">
						<h4 className="flex items-center gap-2 font-display text-lg text-primary">🧘 Yoga Recommendations</h4>
						<p className="mt-1 text-sm text-muted-foreground">Daily movement for balance</p>
					</div>

					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						{dietYogaData.yoga?.morning?.length > 0 && (
							<div className="flex flex-col gap-3">
								<h5 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
									<Sun size={18} className="text-(--jh-turmeric-gold)" /> Morning Flow
								</h5>
								<div className="flex flex-col gap-3">
									{dietYogaData.yoga.morning.map((y, idx) => (
										<div key={idx} className="flex items-center justify-between gap-3 rounded-(--jh-radius-md) border border-border bg-card p-4 transition-all hover:translate-x-1 hover:border-primary hover:shadow-(--jh-shadow-rest)">
											<div className="flex flex-col gap-1">
												<span className="text-sm font-semibold text-foreground">{y.name}</span>
												<span className="text-xs text-muted-foreground">Start your day</span>
											</div>
											{y.link && (
												<a
													href={y.link}
													target="_blank"
													rel="noopener noreferrer"
													className="flex shrink-0 items-center gap-1.5 rounded-(--jh-radius-pill) bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
												>
													<Video size={14} /> Watch
												</a>
											)}
										</div>
									))}
								</div>
							</div>
						)}

						{dietYogaData.yoga?.evening?.length > 0 && (
							<div className="flex flex-col gap-3">
								<h5 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
									<Moon size={18} className="text-muted-foreground" /> Evening Flow
								</h5>
								<div className="flex flex-col gap-3">
									{dietYogaData.yoga.evening.map((y, idx) => (
										<div key={idx} className="flex items-center justify-between gap-3 rounded-(--jh-radius-md) border border-border bg-card p-4 transition-all hover:translate-x-1 hover:border-primary hover:shadow-(--jh-shadow-rest)">
											<div className="flex flex-col gap-1">
												<span className="text-sm font-semibold text-foreground">{y.name}</span>
												<span className="text-xs text-muted-foreground">Unwind &amp; relax</span>
											</div>
											{y.link && (
												<a
													href={y.link}
													target="_blank"
													rel="noopener noreferrer"
													className="flex shrink-0 items-center gap-1.5 rounded-(--jh-radius-pill) bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
												>
													<Video size={14} /> Watch
												</a>
											)}
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default DietPlan;
