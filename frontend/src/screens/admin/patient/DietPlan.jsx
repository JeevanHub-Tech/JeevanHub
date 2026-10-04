import { useState, useEffect } from "react";
import {
	Apple,
	GlassWater,
	CalendarDays,
	Clock,
	Leaf,
	Sun,
	Moon,
	HeartPulse,
	Video,
	Salad,
	UserCheck,
	ExternalLink,
	AlertTriangle,
	Utensils,
	Info,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { ExpandableText } from "@/components/ui/expandable-text";
import { getYouTubeEmbedUrl, buildYoutubeSearchUrl } from "@/lib/youtube";
import { formatDateReadable } from "@/lib/date";
import { cn } from "@/lib/utils";
import { BACKEND_URL } from "../../../config";
import { authFetch } from "../../../utils/authFetch";

const MEAL_META = {
	breakfast: { label: "Breakfast", icon: Sun },
	midMorning: { label: "Mid Morning", icon: Apple },
	lunch: { label: "Lunch", icon: Salad },
	eveningSnack: { label: "Evening Snack", icon: GlassWater },
	dinner: { label: "Dinner", icon: Moon },
};
const MEAL_KEYS = Object.keys(MEAL_META);

function AsanaCard({ asana }) {
	const embedUrl = getYouTubeEmbedUrl(asana.link);
	const watchUrl = !embedUrl ? asana.link || buildYoutubeSearchUrl(asana.name) : null;

	return (
		<div className="flex flex-col gap-2.5 rounded-(--jh-radius-md) border border-border bg-card p-4 shadow-(--jh-shadow-rest)">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<span className="text-sm font-semibold text-foreground">{asana.name}</span>
				{asana.durationMinutes ? (
					<Badge variant="secondary" className="text-xs">
						<Clock size={12} className="mr-1" />
						{asana.durationMinutes} mins
					</Badge>
				) : null}
			</div>

			{asana.purpose ? (
				<p className="text-xs italic text-muted-foreground">{asana.purpose}</p>
			) : null}

			{embedUrl ? (
				<div className="aspect-video w-full overflow-hidden rounded-(--jh-radius-sm)">
					<iframe
						src={embedUrl}
						title={asana.name}
						className="h-full w-full"
						loading="lazy"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
					/>
				</div>
			) : (
				<a
					href={watchUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="flex w-fit items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:underline"
				>
					<Video size={14} /> Watch Tutorial <ExternalLink size={12} />
				</a>
			)}
		</div>
	);
}

function ModernMealCard({ mealKey, meal }) {
	const meta = MEAL_META[mealKey] || { label: mealKey, icon: Utensils };
	const Icon = meta.icon;
	const hasItems = Array.isArray(meal?.items) && meal.items.length > 0;

	return (
		<div className="flex flex-col gap-3 rounded-(--jh-radius-lg) border border-border bg-card p-4 shadow-(--jh-shadow-rest)">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
					<Icon size={16} className="shrink-0 text-primary" />
					<span>{meta.label}</span>
				</div>
				{meal?.portion ? (
					<Badge variant="secondary" className="max-w-full text-xs break-words">
						{meal.portion}
					</Badge>
				) : null}
			</div>

			{hasItems ? (
				<div className="flex flex-wrap gap-1.5">
					{meal.items.map((item, idx) => (
						<Badge key={idx} variant="success" className="text-xs font-normal">
							{item}
						</Badge>
					))}
				</div>
			) : (
				<p className="text-xs text-muted-foreground">Not specified</p>
			)}

			{meal?.purpose ? (
				<p className="text-xs italic text-muted-foreground">{meal.purpose}</p>
			) : null}
		</div>
	);
}

const DietPlan = ({ patientId }) => {
	const [dietPlanData, setDietPlanData] = useState(null);
	const [yogaPlanData, setYogaPlanData] = useState(null);
	const [legacyData, setLegacyData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedDayIdx, setSelectedDayIdx] = useState(0);

	useEffect(() => {
		const fetchPlans = async () => {
			if (!patientId) return;
			setLoading(true);
			const token = localStorage.getItem("token");
			const headers = { Authorization: `Bearer ${token}` };

			try {
				let hasModern = false;

				// Try patient-specific endpoint first
				let dietRes = await authFetch(`${BACKEND_URL}/api/ayurveda/diet-plan/patient/${patientId}`, { headers });
				if (!dietRes.ok && (dietRes.status === 403 || dietRes.status === 404)) {
					// Fallback to self-plan endpoint (for logged-in patient)
					dietRes = await authFetch(`${BACKEND_URL}/api/ayurveda/diet-plan`, { headers });
				}

				if (dietRes.ok) {
					const data = await dietRes.json();
					if (data && (data.weeklyPlan?.length || data.displayPlan?.weeklyPlan?.length)) {
						setDietPlanData(data);
						hasModern = true;
					}
				}

				let yogaRes = await authFetch(`${BACKEND_URL}/api/ayurveda/yoga-plan/patient/${patientId}`, { headers });
				if (!yogaRes.ok && (yogaRes.status === 403 || yogaRes.status === 404)) {
					yogaRes = await authFetch(`${BACKEND_URL}/api/ayurveda/yoga-plan`, { headers });
				}

				if (yogaRes.ok) {
					const yData = await yogaRes.json();
					if (yData && (yData.morning?.length || yData.displayPlan?.morning?.length)) {
						setYogaPlanData(yData);
						hasModern = true;
					}
				}

				// If no modern plan exists, check for legacy data
				if (!hasModern) {
					const legRes = await authFetch(`${BACKEND_URL}/api/patients/dietYoga/${patientId}`, { headers });
					if (legRes.ok) {
						const legData = await legRes.json();
						if (legData && !legData.message && legData.diet) {
							setLegacyData(legData);
						}
					}
				}
			} catch (err) {
				console.error("Error fetching patient diet/yoga plans:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchPlans();
	}, [patientId]);

	if (loading) {
		return (
			<Card>
				<CardContent className="flex flex-col gap-4 p-6">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-44 w-full" />
				</CardContent>
			</Card>
		);
	}

	const activeDiet = dietPlanData?.displayPlan || dietPlanData;
	const activeYoga = yogaPlanData?.displayPlan || yogaPlanData;

	// Case 1: Real modern Ayurveda Diet / Yoga Plan exists
	if (activeDiet || activeYoga) {
		const weeklyPlan = activeDiet?.weeklyPlan || [];
		const currentDay = weeklyPlan[selectedDayIdx] || weeklyPlan[0];
		const doctorReview = dietPlanData?.doctorReview || yogaPlanData?.doctorReview;
		const isDoctorApproved = Boolean(
			doctorReview?.published ||
			dietPlanData?.status === "doctor_approved" ||
			dietPlanData?.status === "ai_modified"
		);
		const doctorName = doctorReview?.doctorName || "Consulting Doctor";
		const reviewedDate = doctorReview?.reviewedAt ? formatDateReadable(doctorReview.reviewedAt) : "";

		const cookingMeals = activeDiet?.cookingInstructions?.meals || [];
		const cookingGuidelines = activeDiet?.cookingInstructions?.generalGuidelines || [];
		const foodsAvoid = activeDiet?.foodsToAvoid || {};
		const lifestyleRecs = activeDiet?.lifestyleRecommendations || [];

		return (
			<Card className="p-0 overflow-hidden">
				<CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-border bg-card p-6">
					<div className="flex items-center gap-3">
						<span className="flex size-10 items-center justify-center rounded-(--jh-radius-sm) bg-secondary text-primary">
							<CalendarDays size={20} />
						</span>
						<div>
							<CardTitle className="font-display text-xl">Ayurvedic Diet & Wellness Plan</CardTitle>
							<p className="text-xs text-muted-foreground mt-0.5">
								Personalized Prakriti-based nutritional and lifestyle guidelines
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{dietPlanData?.status ? <SourceBadge status={dietPlanData.status} /> : null}
					</div>
				</CardHeader>

				<CardContent className="flex flex-col gap-6 p-6">
					{/* Doctor Review Banner */}
					{isDoctorApproved ? (
						<div className="flex flex-col gap-2 rounded-(--jh-radius-md) border border-success/30 bg-success/10 p-4 text-sm text-foreground">
							<div className="flex items-center gap-2 font-semibold text-success-foreground">
								<UserCheck size={16} /> Reviewed & Approved by {doctorName}
								{reviewedDate ? <span className="font-normal text-muted-foreground">({reviewedDate})</span> : null}
							</div>
							{doctorReview?.notes ? (
								<div className="mt-1 border-t border-success/20 pt-2 text-xs">
									<span className="font-semibold">Doctor Notes: </span>
									<ExpandableText text={doctorReview.notes} maxLength={200} />
								</div>
							) : null}
						</div>
					) : null}

					{/* Clinical Summary & Health Considerations */}
					{activeDiet?.summary ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{activeDiet.summary.prakritiSummary ? (
								<div className="rounded-(--jh-radius-md) border border-border bg-secondary/50 p-3.5">
									<div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
										Constitution (Prakriti)
									</div>
									<p className="text-sm font-medium text-foreground leading-relaxed">
										{activeDiet.summary.prakritiSummary}
									</p>
								</div>
							) : null}

							{activeDiet.summary.bmiCategory ? (
								<div className="rounded-(--jh-radius-md) border border-border bg-secondary/50 p-3.5">
									<div className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
										BMI Category
									</div>
									<Badge variant="secondary" className="mt-1 text-xs font-medium">
										{activeDiet.summary.bmiCategory}
									</Badge>
								</div>
							) : null}

							{activeDiet.summary.healthConsiderations?.length ? (
								<div className="rounded-(--jh-radius-md) border border-border bg-secondary/50 p-3.5 sm:col-span-2 lg:col-span-1">
									<div className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
										Targeted Health Focus
									</div>
									<div className="flex flex-wrap gap-1.5">
										{activeDiet.summary.healthConsiderations.map((item, i) => (
											<Badge key={i} variant="outline" className="text-xs">
												{item}
											</Badge>
										))}
									</div>
								</div>
							) : null}
						</div>
					) : null}

					{/* Tabbed Navigation: 7-Day Meal Plan, Cooking & Guidelines, Yoga Routine */}
					<Tabs defaultValue="meals" className="w-full">
						<TabsList className="mb-4">
							<TabsTrigger value="meals" className="flex items-center gap-1.5 text-xs sm:text-sm">
								<Utensils size={15} /> 7-Day Meal Plan
							</TabsTrigger>
							<TabsTrigger value="cooking" className="flex items-center gap-1.5 text-xs sm:text-sm">
								<Leaf size={15} /> Cooking & Avoidance
							</TabsTrigger>
							<TabsTrigger value="yoga" className="flex items-center gap-1.5 text-xs sm:text-sm">
								<HeartPulse size={15} /> Yoga & Lifestyle
							</TabsTrigger>
						</TabsList>

						{/* TAB 1: 7-DAY MEAL PLAN */}
						<TabsContent value="meals" className="flex flex-col gap-5 mt-0">
							{weeklyPlan.length > 0 ? (
								<>
									{/* Day Selector Buttons */}
									<div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
										{weeklyPlan.map((d, idx) => (
											<button
												key={d.day || idx}
												type="button"
												onClick={() => setSelectedDayIdx(idx)}
												className={cn(
													"flex flex-col items-center justify-center rounded-(--jh-radius-md) border p-2.5 text-center transition-all cursor-pointer",
													idx === selectedDayIdx
														? "border-primary bg-primary text-primary-foreground shadow-xs font-semibold"
														: "border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary"
												)}
											>
												<span className="text-xs font-bold uppercase">{d.day?.slice(0, 3)}</span>
												<span className="text-[10px] opacity-80">{d.day}</span>
											</button>
										))}
									</div>

									{/* Meals Grid for the selected day */}
									{currentDay ? (
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
											{MEAL_KEYS.map((key) => (
												<ModernMealCard key={key} mealKey={key} meal={currentDay[key]} />
											))}
										</div>
									) : null}
								</>
							) : (
								<p className="text-sm text-muted-foreground">No daily meal schedule specified.</p>
							)}
						</TabsContent>

						{/* TAB 2: COOKING & AVOIDANCE */}
						<TabsContent value="cooking" className="flex flex-col gap-6 mt-0">
							{/* Foods to Avoid */}
							<div className="flex flex-col gap-3">
								<h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-destructive">
									<AlertTriangle size={16} /> Foods & Combinations to Avoid (Viruddha Ahara)
								</h4>
								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
									{foodsAvoid.doshaBased?.length ? (
										<div className="rounded-(--jh-radius-md) border border-border bg-card p-4">
											<div className="mb-2 text-xs font-semibold text-foreground">Dosha-Aggravating</div>
											<ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
												{foodsAvoid.doshaBased.map((item, i) => (
													<li key={i}>{item}</li>
												))}
											</ul>
										</div>
									) : null}

									{foodsAvoid.medicalBased?.length ? (
										<div className="rounded-(--jh-radius-md) border border-border bg-card p-4">
											<div className="mb-2 text-xs font-semibold text-foreground">Health Conditions</div>
											<ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
												{foodsAvoid.medicalBased.map((item, i) => (
													<li key={i}>{item}</li>
												))}
											</ul>
										</div>
									) : null}

									{foodsAvoid.seasonalBased?.length ? (
										<div className="rounded-(--jh-radius-md) border border-border bg-card p-4">
											<div className="mb-2 text-xs font-semibold text-foreground">Seasonal (Ritucharya)</div>
											<ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
												{foodsAvoid.seasonalBased.map((item, i) => (
													<li key={i}>{item}</li>
												))}
											</ul>
										</div>
									) : null}
								</div>
							</div>

							{/* Cooking Guidelines */}
							{cookingMeals.length > 0 ? (
								<div className="flex flex-col gap-3">
									<h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
										<Utensils size={16} className="text-primary" /> Cooking & Spice Guidelines
									</h4>
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
										{cookingMeals.map((m, i) => (
											<div key={i} className="flex flex-col gap-2 rounded-(--jh-radius-md) border border-border bg-card p-4">
												<div className="font-semibold text-sm text-foreground">{m.mealContext}</div>
												<div className="text-xs text-muted-foreground">
													<span className="font-medium text-foreground">Method: </span>
													{m.cookingMethod} ({m.preparationStyle})
												</div>
												{m.spicesHerbs?.length ? (
													<div className="flex flex-wrap gap-1 mt-1">
														{m.spicesHerbs.map((s, j) => (
															<Badge key={j} variant="secondary" className="text-[11px]">
																{s}
															</Badge>
														))}
													</div>
												) : null}
											</div>
										))}
									</div>
								</div>
							) : null}

							{/* General Guidelines */}
							{cookingGuidelines.length > 0 ? (
								<div className="rounded-(--jh-radius-md) border border-border bg-secondary/40 p-4">
									<div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-foreground">
										<Info size={14} className="text-primary" /> General Dietary Rules
									</div>
									<ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1.5">
										{cookingGuidelines.map((g, i) => (
											<li key={i}>{g}</li>
										))}
									</ul>
								</div>
							) : null}
						</TabsContent>

						{/* TAB 3: YOGA & LIFESTYLE */}
						<TabsContent value="yoga" className="flex flex-col gap-6 mt-0">
							{activeYoga?.summary ? (
								<div className="rounded-(--jh-radius-md) border border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
									<span className="font-semibold text-foreground">Routine Overview: </span>
									{activeYoga.summary}
								</div>
							) : null}

							<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
								{/* Morning Sequence */}
								<div className="flex flex-col gap-3">
									<h5 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
										<Sun size={18} className="text-(--jh-turmeric-gold)" /> Morning Sequence
									</h5>
									<div className="flex flex-col gap-3">
										{activeYoga?.morning?.length ? (
											activeYoga.morning.map((y, idx) => <AsanaCard key={idx} asana={y} />)
										) : (
											<p className="text-xs text-muted-foreground">No morning asanas assigned.</p>
										)}
									</div>
								</div>

								{/* Evening Sequence */}
								<div className="flex flex-col gap-3">
									<h5 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
										<Moon size={18} className="text-muted-foreground" /> Evening Restorative Sequence
									</h5>
									<div className="flex flex-col gap-3">
										{activeYoga?.evening?.length ? (
											activeYoga.evening.map((y, idx) => <AsanaCard key={idx} asana={y} />)
										) : (
											<p className="text-xs text-muted-foreground">No evening asanas assigned.</p>
										)}
									</div>
								</div>
							</div>

							{/* Lifestyle Recommendations */}
							{lifestyleRecs.length > 0 ? (
								<div className="rounded-(--jh-radius-md) border border-border bg-card p-4">
									<h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-foreground">
										Daily Routine & Lifestyle (Dinacharya)
									</h5>
									<ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
										{lifestyleRecs.map((rec, i) => (
											<li key={i}>{rec}</li>
										))}
									</ul>
								</div>
							) : null}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		);
	}

	// Case 2: Legacy DietYoga Plan fallback (renders real stored values without fake hardcoded recipes)
	if (legacyData?.diet) {
		const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
		const currentLegacyDay = days[selectedDayIdx] || "monday";
		const dayData = legacyData.diet.weekly?.[currentLegacyDay] || {};

		return (
			<Card className="p-0 overflow-hidden">
				<CardHeader className="flex flex-row items-center justify-between border-b border-border p-6">
					<CardTitle className="flex items-center gap-3 font-display text-xl">
						<span className="flex size-10 items-center justify-center rounded-(--jh-radius-sm) bg-secondary text-primary">
							<CalendarDays size={20} />
						</span>
						Weekly Diet & Yoga Plan
					</CardTitle>
					<Badge variant="outline">Assigned Plan</Badge>
				</CardHeader>

				<CardContent className="flex flex-col gap-6 p-6">
					{/* Day Selector */}
					<div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
						{days.map((d, idx) => (
							<button
								key={d}
								type="button"
								onClick={() => setSelectedDayIdx(idx)}
								className={cn(
									"flex flex-col items-center justify-center rounded-(--jh-radius-md) border p-2.5 text-center cursor-pointer transition-all",
									idx === selectedDayIdx
										? "border-primary bg-primary text-primary-foreground font-semibold"
										: "border-border bg-card text-foreground hover:bg-secondary"
								)}
							>
								<span className="text-xs font-bold uppercase">{d.slice(0, 3)}</span>
							</button>
						))}
					</div>

					{/* Meals Grid */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						{[
							{ key: "breakfast", label: "Breakfast", icon: Sun },
							{ key: "lunch", label: "Lunch", icon: Salad },
							{ key: "dinner", label: "Dinner", icon: Moon },
							{ key: "juices", label: "Juice / Detox", icon: GlassWater },
						].map(({ key, label, icon: Icon }) => (
							<div key={key} className="flex flex-col gap-2 rounded-(--jh-radius-md) border border-border bg-card p-4">
								<div className="flex items-center gap-2 text-sm font-semibold text-foreground">
									<Icon size={16} className="text-primary" /> {label}
								</div>
								<p className="text-sm font-medium text-foreground">
									{dayData[key] || "No meal assigned"}
								</p>
							</div>
						))}
					</div>

					{/* Yoga Section */}
					{(legacyData.yoga?.morning?.length > 0 || legacyData.yoga?.evening?.length > 0) ? (
						<div className="rounded-(--jh-radius-lg) border border-border bg-secondary/40 p-5 mt-2">
							<h4 className="mb-4 text-sm font-bold uppercase text-foreground">Yoga Routines</h4>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{legacyData.yoga?.morning?.length ? (
									<div>
										<h5 className="mb-2 text-xs font-semibold text-primary">Morning Flow</h5>
										<div className="space-y-2">
											{legacyData.yoga.morning.map((y, idx) => (
												<div key={idx} className="rounded border border-border bg-card p-2 text-xs flex justify-between">
													<span>{y.name}</span>
													{y.link ? (
														<a href={y.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
															Watch
														</a>
													) : null}
												</div>
											))}
										</div>
									</div>
								) : null}

								{legacyData.yoga?.evening?.length ? (
									<div>
										<h5 className="mb-2 text-xs font-semibold text-muted-foreground">Evening Flow</h5>
										<div className="space-y-2">
											{legacyData.yoga.evening.map((y, idx) => (
												<div key={idx} className="rounded border border-border bg-card p-2 text-xs flex justify-between">
													<span>{y.name}</span>
													{y.link ? (
														<a href={y.link} target="_blank" rel="noopener noreferrer" className="text-primary underline">
															Watch
														</a>
													) : null}
												</div>
											))}
										</div>
									</div>
								) : null}
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>
		);
	}

	// Case 3: No plan generated or assigned
	return (
		<Card>
			<CardContent className="p-8">
				<EmptyState
					icon={CalendarDays}
					title="No Ayurvedic Diet Plan Yet"
					description="Once the patient completes their Prakriti assessment and an AI plan is generated, or a doctor reviews and assigns a meal & yoga plan, it will appear here."
				/>
			</CardContent>
		</Card>
	);
};

export default DietPlan;
