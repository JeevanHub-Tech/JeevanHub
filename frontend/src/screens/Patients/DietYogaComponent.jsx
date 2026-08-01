import { useState, useEffect, useContext } from "react";
import {
	Activity, Apple, ArrowRight, CalendarDays, ChevronLeft,
	Clock, GlassWater, HeartPulse, Leaf, Moon, Salad, Sun, User, Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { BACKEND_URL } from "../../config";
import { AuthContext } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";

const DAY_UI_META = {
	monday: { label: "Light Detox", icon: Leaf },
	tuesday: { label: "Energy Boost", icon: Activity },
	wednesday: { label: "Digestion Focus", icon: HeartPulse },
	thursday: { label: "Protein Day", icon: Apple },
	friday: { label: "Cooling Day", icon: GlassWater },
	saturday: { label: "Recovery", icon: Moon },
	sunday: { label: "Relax & Reset", icon: Sun },
};

function SectionCard({ children, className }) {
	return <div className={cn("rounded-(--jh-radius-lg) bg-card p-5 shadow-(--jh-shadow-rest) sm:p-6", className)}>{children}</div>;
}

const DietYogaComponent = () => {
	const { auth } = useContext(AuthContext);
	const patientId = auth?.user?.id;
	const role = auth?.role;

	const token = localStorage.getItem("token");

	const [dietYogaData, setDietYogaData] = useState(null);

	// Initialize selectedDay as null to show the Weekly Grid first
	const [selectedDay, setSelectedDay] = useState(null);
	const [selectedMeal, setSelectedMeal] = useState(null);

	const [loadingDiet, setLoadingDiet] = useState(true);
	const [error, setError] = useState(null);

	const todayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()];

	useEffect(() => {
		if (role && role !== "patient") {
			setLoadingDiet(false);
			return;
		}
		const fetchDietYoga = async () => {
			if (!patientId) return;
			setLoadingDiet(true);
			try {
				const res = await authFetch(`${BACKEND_URL}/api/patients/dietYoga/${patientId}`, {
					headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
				});

				if (!res.ok) {
					if (res.status === 404) {
						setDietYogaData(null);
						return;
					}
					throw new Error("Failed to fetch diet & yoga plan");
				}
				setDietYogaData(await res.json());
			} catch (error) {
				console.error("Error fetching diet plan:", error);
				setError(error.message);
			} finally {
				setLoadingDiet(false);
			}
		};
		fetchDietYoga();
	}, [patientId, token, role]);

	const getRecipe = (mealType, mealName) => ({
		name: mealName || "Consult your doctor",
		prep: "10 mins",
		cook: mealType === "juice" || mealType === "juices" ? "0 mins" : "20 mins",
		ingredients: [
			{ name: "Main Ingredient", qty: "1 portion" },
			{ name: "Seasonal Veg/Fruit", qty: "As advised" },
			{ name: "Spices", qty: "To taste" },
		],
		steps: ["Wash and prepare ingredients.", "Cook gently to preserve nutrients.", "Consume warm."],
	});

	const renderRecipeView = () => {
		const dayData = dietYogaData.diet.weekly[selectedDay];
		const mealKey = selectedMeal === "juice" ? "juices" : selectedMeal;
		const mealName = dayData ? dayData[mealKey] : "Not assigned";
		const recipe = getRecipe(selectedMeal, mealName);

		return (
			<SectionCard>
				<Button variant="ghost" size="sm" onClick={() => setSelectedMeal(null)}>
					<ChevronLeft className="size-4" /> Back
				</Button>
				<div className="mt-3">
					<h2 className="font-display text-2xl text-foreground">{selectedMeal.toUpperCase()}</h2>
					<p className="mt-0.5 text-sm text-muted-foreground">{recipe.name}</p>
				</div>

				<div className="mt-6">
					<h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						<Leaf size={14} /> Ingredients
					</h4>
					<div className="mt-2 flex flex-wrap gap-2">
						{recipe.ingredients.map((i, idx) => (
							<span key={idx} className="rounded-(--jh-radius-pill) bg-secondary px-3 py-1 text-sm text-secondary-foreground">
								<strong className="font-semibold">{i.qty}</strong> · {i.name}
							</span>
						))}
					</div>
				</div>

				<div className="mt-6">
					<h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						<Clock size={14} /> Preparation
					</h4>
					<div className="mt-2 flex flex-col gap-3">
						{recipe.steps.map((s, i) => (
							<div key={i} className="flex items-start gap-3">
								<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
									{i + 1}
								</span>
								<p className="text-sm text-foreground">{s}</p>
							</div>
						))}
					</div>
				</div>
			</SectionCard>
		);
	};

	const renderDailyView = () => {
		const uiMeta = DAY_UI_META[selectedDay] || { label: "Daily Plan", icon: Sun };
		const dayData = dietYogaData.diet.weekly[selectedDay] || {};

		return (
			<SectionCard>
				<div className="flex flex-wrap items-center gap-3">
					<Button variant="ghost" size="sm" onClick={() => setSelectedDay(null)}>
						<ChevronLeft className="size-4" /> Back to week
					</Button>
					<h3 className="font-display text-xl text-foreground">
						{selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} · {uiMeta.label}
					</h3>
				</div>
				<div className="mt-5 grid gap-3 sm:grid-cols-2">
					{["breakfast", "lunch", "dinner", "juice"].map((meal) => {
						const dataKey = meal === "juice" ? "juices" : meal;
						const mealContent = dayData[dataKey] || "Rest";
						const MealIcon = meal === "breakfast" ? Sun : meal === "lunch" ? Salad : meal === "dinner" ? Moon : GlassWater;
						return (
							<button
								key={meal}
								type="button"
								onClick={() => setSelectedMeal(meal)}
								className="flex items-center gap-3 rounded-(--jh-radius-md) bg-secondary/60 p-3 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
							>
								<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-primary">
									<MealIcon size={20} />
								</span>
								<div className="min-w-0 flex-1">
									<h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{meal}</h5>
									<span className="truncate text-sm text-foreground">{mealContent}</span>
								</div>
								<ArrowRight size={18} className="shrink-0 text-muted-foreground" />
							</button>
						);
					})}
				</div>
			</SectionCard>
		);
	};

	const renderYogaColumn = (title, Icon, entries) => (
		<div className="flex-1">
			<h5 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
				<Icon size={18} className="text-primary" /> {title}
			</h5>
			<div className="mt-2 flex flex-col gap-2">
				{entries.map((y, idx) => (
					<div key={idx} className="flex items-center justify-between gap-2 rounded-(--jh-radius-md) bg-card px-3 py-2">
						<span className="text-sm text-foreground">{y.name}</span>
						{y.link ? (
							<a
								href={y.link}
								target="_blank"
								rel="noopener noreferrer"
								className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
							>
								<Video size={14} /> Watch
							</a>
						) : null}
					</div>
				))}
			</div>
		</div>
	);

	const renderWeeklyView = () => (
		<SectionCard>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<span className="flex size-9 items-center justify-center rounded-full bg-secondary text-primary">
						<CalendarDays size={18} />
					</span>
					<h3 className="font-display text-xl text-foreground">Weekly diet plan</h3>
				</div>
				<Badge variant="success">Active plan</Badge>
			</div>

			<div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-2">
				{Object.keys(DAY_UI_META).map((day) => (
					<button
						key={day}
						type="button"
						onClick={() => setSelectedDay(day)}
						className={cn(
							"flex flex-col items-center gap-1 rounded-(--jh-radius-md) px-2 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							day === todayName ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-foreground hover:bg-secondary",
						)}
					>
						<span className="text-xs font-bold uppercase tracking-wide">{day.slice(0, 3)}</span>
						<span className={cn("text-xs", day === todayName ? "text-primary-foreground/80" : "text-muted-foreground")}>
							{DAY_UI_META[day].label}
						</span>
					</button>
				))}
			</div>

			<div className="mt-6 border-t border-border pt-5">
				<h4 className="font-display text-lg text-foreground">Yoga recommendations</h4>
				<p className="text-sm text-muted-foreground">Daily movement for balance</p>
				<div className="mt-4 flex flex-col gap-5 sm:flex-row">
					{dietYogaData.yoga?.morning?.length > 0 ? renderYogaColumn("Morning flow", Sun, dietYogaData.yoga.morning) : null}
					{dietYogaData.yoga?.evening?.length > 0 ? renderYogaColumn("Evening flow", Moon, dietYogaData.yoga.evening) : null}
				</div>
			</div>
		</SectionCard>
	);

	return (
		<main className="bg-background">
			<div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
				<div>
					<h1 className="font-display text-2xl text-foreground">Prescription</h1>
					<p className="text-sm text-muted-foreground">Your doctor's personalized diet & yoga plan.</p>
				</div>

				<div className="mt-6">
					{role && role !== "patient" ? (
						<EmptyState
							title="Patient-only feature"
							description="Prescriptions are a patient-only feature. There is no plan to show on this account."
						/>
					) : (
						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<User size={16} /> Dr. managed personalized plan
							</div>

							{loadingDiet ? (
								<p className="text-sm text-muted-foreground">Loading plan...</p>
							) : error ? (
								<p className="rounded-(--jh-radius-md) bg-destructive/10 px-4 py-3 text-sm text-destructive">Error: {error}</p>
							) : !dietYogaData ? (
								<EmptyState title="No plan assigned" description="Your doctor hasn't published a personalized diet & yoga plan yet." />
							) : selectedMeal ? (
								renderRecipeView()
							) : selectedDay ? (
								renderDailyView()
							) : (
								renderWeeklyView()
							)}
						</div>
					)}
				</div>
			</div>
		</main>
	);
};

export default DietYogaComponent;
