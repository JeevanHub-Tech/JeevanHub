import { useState, useEffect } from "react";
import { Salad, Sprout, Leaf, Plus, X, Send, Loader2, Copy, ListChecks } from "lucide-react";

import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const MEAL_FIELDS = ["breakfast", "lunch", "dinner", "juices"];
const BLANK_DAY = { breakfast: "", lunch: "", dinner: "", juices: "" };

const MEAL_PLACEHOLDERS = {
	breakfast: "e.g., Warm oats with stewed apple and a pinch of cinnamon",
	lunch: "e.g., Steamed rice, moong dal, and seasonal cooked vegetables",
	dinner: "e.g., Light khichdi with ghee; avoid heavy or fried foods",
	juices: "e.g., Warm water with lemon and honey",
};

const blankWeekly = () =>
	DAYS_OF_WEEK.reduce((acc, day) => {
		acc[day] = { ...BLANK_DAY };
		return acc;
	}, {});

// Are all 7 days identical? Used to detect whether an existing plan can be shown
// collapsed in "same every day" mode, or needs the full per-day editor.
const daysAreIdentical = (weekly) => {
	const first = JSON.stringify(weekly[DAYS_OF_WEEK[0]]);
	return DAYS_OF_WEEK.every((day) => JSON.stringify(weekly[day]) === first);
};

export function DietPlanForm({ bookingId, patientId, doctorId, onPrescribed }) {
	const [activeTab, setActiveTab] = useState("weekly");
	const [entryMode, setEntryMode] = useState("same");
	const [activeDayTab, setActiveDayTab] = useState("monday");
	const [herbInput, setHerbInput] = useState("");

	const [loading, setLoading] = useState(false);
	const [loadingExisting, setLoadingExisting] = useState(true);
	const [error, setError] = useState(null);

	const [templateDay, setTemplateDay] = useState({ ...BLANK_DAY });
	const [weeklyPlan, setWeeklyPlan] = useState(blankWeekly);
	const [herbs, setHerbs] = useState([]);

	useEffect(() => {
		const fetchExisting = async () => {
			if (!bookingId) {
				setLoadingExisting(false);
				return;
			}
			try {
				const response = await authFetch(`${BACKEND_URL}/api/diet-yoga/booking/${bookingId}`);
				if (response.ok) {
					const data = await response.json();
					const existingWeekly = data?.dietYoga?.diet?.weekly;
					if (existingWeekly) {
						const filledWeekly = DAYS_OF_WEEK.reduce((acc, day) => {
							acc[day] = { ...BLANK_DAY, ...existingWeekly[day] };
							return acc;
						}, {});
						setWeeklyPlan(filledWeekly);
						if (daysAreIdentical(filledWeekly)) {
							setEntryMode("same");
							setTemplateDay(filledWeekly.monday);
						} else {
							setEntryMode("custom");
						}
					}
					if (data?.dietYoga?.diet?.herbs) {
						setHerbs(data.dietYoga.diet.herbs);
					}
				}
			} catch (err) {
				console.error("Error fetching existing diet plan:", err);
			} finally {
				setLoadingExisting(false);
			}
		};

		fetchExisting();
	}, [bookingId]);

	const updateTemplateField = (field, value) => {
		setTemplateDay((prev) => ({ ...prev, [field]: value }));
	};

	const updateWeeklyDiet = (day, field, value) => {
		setWeeklyPlan((prev) => ({
			...prev,
			[day]: { ...prev[day], [field]: value },
		}));
	};

	const switchToCustom = () => {
		setWeeklyPlan(
			DAYS_OF_WEEK.reduce((acc, day) => {
				acc[day] = { ...templateDay };
				return acc;
			}, {})
		);
		setEntryMode("custom");
	};

	const switchToSame = () => {
		setTemplateDay({ ...weeklyPlan.monday });
		setEntryMode("same");
	};

	const addHerb = () => {
		const trimmedHerb = herbInput.trim();
		if (trimmedHerb && !herbs.includes(trimmedHerb)) {
			setHerbs((prev) => [...prev, trimmedHerb]);
			setHerbInput("");
		}
	};

	const removeHerb = (herbToRemove) => {
		setHerbs((prev) => prev.filter((herb) => herb !== herbToRemove));
	};

	const handleHerbInputKeyPress = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			addHerb();
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		setLoading(true);
		setError(null);

		const finalWeekly =
			entryMode === "same"
				? DAYS_OF_WEEK.reduce((acc, day) => {
						acc[day] = { ...templateDay };
						return acc;
					}, {})
				: weeklyPlan;

		try {
			const response = await authFetch(`${BACKEND_URL}/api/diet-yoga/`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bookingId: bookingId,
					patientId: patientId,
					doctorId: doctorId,
					dietPlan: { weekly: finalWeekly, herbs },
				}),
			});

			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				throw new Error(errData.message || "Failed to submit diet plan");
			}

			await response.json();
			alert("The diet plan has been successfully prescribed.");
			onPrescribed?.();
		} catch (err) {
			console.error("Submission Error:", err);
			setError(err.message);
			alert(`Error: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	if (loadingExisting) {
		return (
			<Card className="overflow-hidden p-0">
				<div className="border-b border-border bg-muted/40 px-6 py-4">
					<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
						<Salad className="size-6 text-primary" />
						Prescribe Diet Plan
					</h3>
				</div>
				<div className="p-6">
					<p className="py-6 text-center text-muted-foreground">Checking for an existing plan...</p>
				</div>
			</Card>
		);
	}

	return (
		<Card className="overflow-hidden p-0">
			<div className="border-b border-border bg-muted/40 px-6 py-4">
				<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
					<Salad className="size-6 text-primary" />
					Prescribe Diet Plan
				</h3>
			</div>
			<div className="p-6">
				<form onSubmit={handleSubmit} className="flex flex-col gap-6">
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="grid h-auto grid-cols-2">
							<TabsTrigger value="weekly">Weekly Plan</TabsTrigger>
							<TabsTrigger value="herbs">Herbs & Supplements</TabsTrigger>
						</TabsList>

						<TabsContent value="weekly" className="mt-4">
							<div className="flex flex-col gap-4">
								<div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1.5">
									<Button type="button" variant={entryMode === "same" ? "default" : "ghost"} onClick={switchToSame}>
										<Copy data-icon="inline-start" size={16} /> Same plan every day
									</Button>
									<Button type="button" variant={entryMode === "custom" ? "default" : "ghost"} onClick={switchToCustom}>
										<ListChecks data-icon="inline-start" size={16} /> Customize per day
									</Button>
								</div>

								{entryMode === "same" ? (
									<div className="rounded-lg border border-border p-4">
										<h4 className="mb-4 text-base font-bold text-foreground">Applies every day this week</h4>
										<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
											{MEAL_FIELDS.map((meal) => (
												<div key={meal} className="flex flex-col gap-1.5">
													<label className="text-xs font-semibold text-muted-foreground">
														{meal.charAt(0).toUpperCase() + meal.slice(1)}
													</label>
													<Textarea
														value={templateDay[meal]}
														onChange={(e) => updateTemplateField(meal, e.target.value)}
														placeholder={MEAL_PLACEHOLDERS[meal]}
														rows={2}
													/>
												</div>
											))}
										</div>
									</div>
								) : (
									<>
										<div className="flex flex-wrap gap-1.5">
											{DAYS_OF_WEEK.map((day) => (
												<button
													key={day}
													type="button"
													onClick={() => setActiveDayTab(day)}
													className={
														activeDayTab === day
															? "rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"
															: "rounded-full border border-border bg-muted/40 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
													}
												>
													{day.slice(0, 3).toUpperCase()}
												</button>
											))}
										</div>
										<div className="rounded-lg border border-border p-4">
											<h4 className="mb-4 text-base font-bold text-foreground">
												{activeDayTab.charAt(0).toUpperCase() + activeDayTab.slice(1)}
											</h4>
											<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
												{MEAL_FIELDS.map((meal) => (
													<div key={meal} className="flex flex-col gap-1.5">
														<label className="text-xs font-semibold text-muted-foreground">
															{meal.charAt(0).toUpperCase() + meal.slice(1)}
														</label>
														<Textarea
															value={weeklyPlan[activeDayTab][meal]}
															onChange={(e) => updateWeeklyDiet(activeDayTab, meal, e.target.value)}
															placeholder={MEAL_PLACEHOLDERS[meal]}
															rows={2}
														/>
													</div>
												))}
											</div>
										</div>
									</>
								)}
							</div>
						</TabsContent>

						<TabsContent value="herbs" className="mt-4">
							<div className="flex max-w-xl flex-col gap-4">
								<h4 className="flex items-center gap-2.5 text-base font-bold text-foreground">
									<Sprout size={18} className="text-primary" />
									Herbs & Supplements
								</h4>
								<div className="flex gap-2">
									<Input
										value={herbInput}
										onChange={(e) => setHerbInput(e.target.value)}
										placeholder="Enter herb name and press Enter"
										onKeyDown={handleHerbInputKeyPress}
									/>
									<Button type="button" size="icon" onClick={addHerb}>
										<Plus />
									</Button>
								</div>
								<div className="flex flex-wrap gap-2.5">
									{herbs.length > 0 ? (
										herbs.map((herb, index) => (
											<Badge key={index} variant="secondary" className="gap-1.5">
												<Leaf size={14} />
												{herb}
												<button type="button" onClick={() => removeHerb(herb)}>
													<X size={14} />
												</button>
											</Badge>
										))
									) : (
										<p className="w-full py-6 text-center text-sm text-muted-foreground italic">No herbs added yet.</p>
									)}
								</div>
							</div>
						</TabsContent>
					</Tabs>

					{error ? <p className="text-sm text-destructive">Error: {error}</p> : null}

					<Button type="submit" disabled={loading} className="self-end">
						{loading ? (
							<>
								<Loader2 className="animate-spin" data-icon="inline-start" size={18} />
								Prescribing...
							</>
						) : (
							<>
								<Send data-icon="inline-start" size={18} />
								Prescribe Diet Plan
							</>
						)}
					</Button>
				</form>
			</div>
		</Card>
	);
}
