import { useState, useEffect, useCallback } from "react";
import { Salad, Send, Loader2, PenLine, Check, Sparkles, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { formatDateReadable } from "@/lib/date";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_KEYS = ["breakfast", "midMorning", "lunch", "eveningSnack", "dinner"];
const MEAL_LABELS = {
	breakfast: "Breakfast",
	midMorning: "Mid-Morning",
	lunch: "Lunch",
	eveningSnack: "Evening Snack",
	dinner: "Dinner",
};

const blankMeal = () => ({ items: "", portion: "", purpose: "" });
const blankWeeklyPlan = () => DAYS.map((day) => ({
	day,
	breakfast: blankMeal(),
	midMorning: blankMeal(),
	lunch: blankMeal(),
	eveningSnack: blankMeal(),
	dinner: blankMeal(),
}));

const toStr = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
const toList = (str) => (str || "").split(",").map((s) => s.trim()).filter(Boolean);

// Converts the API's { items: [], portion, purpose } meal shape into the
// comma-string form the editor uses, and back on submit.
function weeklyPlanToForm(weeklyPlan) {
	const byDay = new Map((weeklyPlan || []).map((d) => [d.day, d]));
	return DAYS.map((day) => {
		const d = byDay.get(day) || {};
		const form = { day };
		MEAL_KEYS.forEach((meal) => {
			const m = d[meal] || {};
			form[meal] = { items: toStr(m.items), portion: m.portion || "", purpose: m.purpose || "" };
		});
		return form;
	});
}

function formToWeeklyPlan(formPlan) {
	return formPlan.map((d) => {
		const day = { day: d.day };
		MEAL_KEYS.forEach((meal) => {
			day[meal] = { items: toList(d[meal].items), portion: d[meal].portion, purpose: d[meal].purpose };
		});
		return day;
	});
}

function otherFieldsToForm(plan) {
	return {
		cookingGuidelines: toStr(plan?.cookingInstructions?.generalGuidelines),
		foodsAvoidDosha: toStr(plan?.foodsToAvoid?.doshaBased),
		foodsAvoidMedical: toStr(plan?.foodsToAvoid?.medicalBased),
		foodsAvoidSeasonal: toStr(plan?.foodsToAvoid?.seasonalBased),
		lifestyleRecommendations: toStr(plan?.lifestyleRecommendations),
		notes: plan?.notes || "",
	};
}

// Which content the patient currently sees: server-resolved displayPlan
// (Hindi if requested, doctorReview if approved, else raw AI).
function resolveActiveContent(plan) {
	if (!plan) return null;
	if (plan.displayPlan) {
		return plan.displayPlan;
	}
	if (plan.status === "ai_modified" || plan.status === "doctor_approved") {
		return { ...plan.doctorReview, cookingInstructions: plan.doctorReview?.cookingInstructions };
	}
	return {
		weeklyPlan: plan.weeklyPlan,
		cookingInstructions: plan.cookingInstructions,
		foodsToAvoid: plan.foodsToAvoid,
		lifestyleRecommendations: plan.lifestyleRecommendations,
	};
}

export function DietPlanForm({ bookingId, patientId, onPrescribed }) {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language?.startsWith("hi") ? "hi" : "en";

	const [plan, setPlan] = useState(null);
	const [loadingExisting, setLoadingExisting] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState(false);
	const [error, setError] = useState(null);

	const [activeDayTab, setActiveDayTab] = useState("Monday");
	const [formPlan, setFormPlan] = useState(blankWeeklyPlan);
	const [otherFields, setOtherFields] = useState(otherFieldsToForm({}));

	const fetchExisting = useCallback(async () => {
		if (!patientId) {
			setLoadingExisting(false);
			return;
		}
		try {
			const response = await authFetch(`${BACKEND_URL}/api/ayurveda/diet-plan/patient/${patientId}?lang=${currentLang}`);
			if (response.ok) {
				const data = await response.json();
				setPlan(data);
			}
		} catch (err) {
			console.error("Error fetching diet plan:", err);
		} finally {
			setLoadingExisting(false);
		}
	}, [patientId, currentLang]);

	useEffect(() => {
		fetchExisting();
	}, [fetchExisting]);

	const startEditing = () => {
		const active = resolveActiveContent(plan);
		setFormPlan(weeklyPlanToForm(active?.weeklyPlan));
		setOtherFields(otherFieldsToForm(active));
		setEditing(true);
	};

	const updateMealField = (day, meal, field, value) => {
		setFormPlan((prev) =>
			prev.map((d) => (d.day !== day ? d : { ...d, [meal]: { ...d[meal], [field]: value } }))
		);
	};

	// Accepts explicit fp/of so callers that just computed fresh values (e.g.
	// saveAsIs) don't have to round-trip through setState + wait for a
	// re-render. Always a silent draft save until "Submit Prescription".
	const submitReview = async (fp = formPlan, of = otherFields) => {
		setSaving(true);
		setError(null);
		try {
			const body = {
				bookingId,
				weeklyPlan: formToWeeklyPlan(fp),
				cookingInstructions: {
					meals: plan?.doctorReview?.cookingInstructions?.meals || plan?.cookingInstructions?.meals || [],
					generalGuidelines: toList(of.cookingGuidelines),
				},
				foodsToAvoid: {
					doshaBased: toList(of.foodsAvoidDosha),
					medicalBased: toList(of.foodsAvoidMedical),
					seasonalBased: toList(of.foodsAvoidSeasonal),
				},
				lifestyleRecommendations: toList(of.lifestyleRecommendations),
				notes: of.notes,
			};
			const response = await authFetch(`${BACKEND_URL}/api/ayurveda/diet-plan/patient/${patientId}/review`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || data.message || "Failed to save diet plan review");
			setPlan(data.plan);
			setEditing(false);
			onPrescribed?.();
		} catch (err) {
			console.error("Error reviewing diet plan:", err);
			setError(err.message);
			alert(err.message);
		} finally {
			setSaving(false);
		}
	};

	// Save current active content unchanged as doctor's draft
	const saveAsIs = async () => {
		const active = resolveActiveContent(plan);
		const fp = weeklyPlanToForm(active?.weeklyPlan);
		const of = otherFieldsToForm(active);
		setFormPlan(fp);
		setOtherFields(of);
		submitReview(fp, of);
	};

	if (loadingExisting) {
		return (
			<Card className="overflow-hidden p-0">
				<div className="border-b border-border bg-muted/40 px-6 py-4">
					<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
						<Salad className="size-6 text-primary" />
						{t("doctorPrescribe.dietPlanTitle", "Diet & Weekly Meal Planner")}
					</h3>
				</div>
				<div className="p-6">
					<p className="py-6 text-center text-muted-foreground">{t("doctorPrescribe.checkingPlan", "Checking for an existing plan...")}</p>
				</div>
			</Card>
		);
	}

	if (!plan) {
		return (
			<Card className="overflow-hidden p-0">
				<div className="border-b border-border bg-muted/40 px-6 py-4">
					<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
						<Salad className="size-6 text-primary" />
						{t("doctorPrescribe.dietPlanTitle", "Diet & Weekly Meal Planner")}
					</h3>
				</div>
				<div className="p-6">
					<EmptyState
						icon={Sparkles}
						title={t("doctorPrescribe.noAiDietPlan", "No AI diet plan yet")}
						description={t("doctorPrescribe.noAiDietPlanDesc", "This patient hasn't generated a plan yet. Use the Generate button above to create one, then review and approve it here.")}
					/>
				</div>
			</Card>
		);
	}

	const active = resolveActiveContent(plan);
	const doctorReview = plan.doctorReview;
	const isDoctorApproved = Boolean(doctorReview?.published || plan.status === "doctor_approved" || (doctorReview?.reviewedAt && plan.status === "ai_modified"));
	const doctorDisplayName = doctorReview?.doctorName ||
		(doctorReview?.reviewedBy?.firstName
			? `Dr. ${doctorReview.reviewedBy.firstName} ${doctorReview.reviewedBy.lastName || ""}`.trim()
			: (typeof doctorReview?.reviewedBy === "string" ? doctorReview.reviewedBy : t("weeklyMealPlanner.yourDoctor", "your doctor")));
	const reviewedDate = doctorReview?.reviewedAt ? formatDateReadable(doctorReview.reviewedAt) : "";

	return (
		<Card className="overflow-hidden p-0">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-6 py-4">
				<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
					<Salad className="size-6 text-primary" />
					{t("doctorPrescribe.dietPlanTitle", "Diet & Weekly Meal Planner")}
				</h3>
				<div className="flex items-center gap-2">
					{plan.doctorReview?.reviewedAt && !plan.doctorReview?.published ? (
						<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{t("doctorPrescribe.draftBadge", "Draft -- not sent yet")}</span>
					) : null}
					<SourceBadge status={plan.status} />
				</div>
			</div>
			<div className="flex flex-col gap-6 p-6">
				{doctorReview?.reviewedAt && (
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-amber-500/10 p-3.5 text-xs text-foreground shadow-xs">
						<div className="flex flex-wrap items-center gap-2">
							<span className="inline-flex items-center gap-1.5 rounded-md bg-primary/20 px-2.5 py-1 font-bold text-primary">
								<UserCheck size={14} /> {t("weeklyMealPlanner.doctorApproved", "Doctor Approved")}
							</span>
							<span className="font-semibold text-foreground">
								{reviewedDate
									? t("weeklyMealPlanner.madeByOnDate", "Made by {{doctorName}} on {{date}}", { doctorName: doctorDisplayName, date: reviewedDate })
									: t("weeklyMealPlanner.madeBy", "Made by {{doctorName}}", { doctorName: doctorDisplayName })}
							</span>
						</div>
						{doctorReview?.notes ? (
							<p className="w-full text-xs italic text-muted-foreground sm:w-auto">
								&ldquo;{doctorReview.notes}&rdquo;
							</p>
						) : null}
					</div>
				)}

				{!editing ? (
					<>
						<div className="flex flex-wrap gap-1.5">
							{DAYS.map((day) => {
								const dayKey = day.slice(0, 3).toLowerCase();
								const dayLabel = t(`weeklyMealPlanner.days.${dayKey}`, day.slice(0, 3).toUpperCase());
								return (
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
										{dayLabel}
									</button>
								);
							})}
						</div>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{MEAL_KEYS.map((meal) => {
								const dayPlan = (active?.weeklyPlan || []).find((d) => d.day === activeDayTab);
								const m = dayPlan?.[meal] || {};
								const mealTitle = t(`weeklyMealPlanner.meals.${meal}`, MEAL_LABELS[meal]);
								return (
									<div key={meal} className="rounded-lg border border-border p-3">
										<h5 className="mb-1 text-xs font-semibold text-muted-foreground">{mealTitle}</h5>
										<p className="text-sm text-foreground">{(m.items || []).join(", ") || "—"}</p>
										{m.portion ? <p className="text-xs text-muted-foreground">{t("doctorPrescribe.portion", "Portion")}: {m.portion}</p> : null}
										{m.purpose ? <p className="text-xs text-muted-foreground italic">{m.purpose}</p> : null}
									</div>
								);
							})}
						</div>
						{active?.lifestyleRecommendations?.length ? (
							<div>
								<h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("doctorPrescribe.lifestyleRecs", "Lifestyle recommendations")}</h5>
								<ul className="list-disc pl-5 text-sm text-foreground">
									{active.lifestyleRecommendations.map((r, i) => <li key={i}>{r}</li>)}
								</ul>
							</div>
						) : null}

						<div className="flex flex-wrap gap-2">
							<Button type="button" variant="outline" onClick={startEditing}>
								<PenLine data-icon="inline-start" size={16} /> {t("common.edit", "Edit")}
							</Button>
							<Button type="button" onClick={saveAsIs} disabled={saving}>
								{saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" size={16} />}
								{t("common.save", "Save")}
							</Button>
						</div>
					</>
				) : (
					<>
						<div className="flex flex-wrap gap-1.5">
							{DAYS.map((day) => {
								const dayKey = day.slice(0, 3).toLowerCase();
								const dayLabel = t(`weeklyMealPlanner.days.${dayKey}`, day.slice(0, 3).toUpperCase());
								return (
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
										{dayLabel}
									</button>
								);
							})}
						</div>
						<div className="rounded-lg border border-border p-4">
							<h4 className="mb-4 text-base font-bold text-foreground">
								{t(`weeklyMealPlanner.daysFull.${activeDayTab.slice(0, 3).toLowerCase()}`, activeDayTab)}
							</h4>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								{MEAL_KEYS.map((meal) => {
									const dayForm = formPlan.find((d) => d.day === activeDayTab);
									const mealTitle = t(`weeklyMealPlanner.meals.${meal}`, MEAL_LABELS[meal]);
									return (
										<div key={meal} className="flex flex-col gap-1.5">
											<label className="text-xs font-semibold text-muted-foreground">{mealTitle}</label>
											<Textarea
												value={dayForm[meal].items}
												onChange={(e) => updateMealField(activeDayTab, meal, "items", e.target.value)}
												placeholder={t("doctorPrescribe.foodItemsPlaceholder", "Comma-separated food items")}
												rows={2}
											/>
											<Input
												value={dayForm[meal].portion}
												onChange={(e) => updateMealField(activeDayTab, meal, "portion", e.target.value)}
												placeholder={t("doctorPrescribe.portionPlaceholder", "Portion")}
											/>
											<Input
												value={dayForm[meal].purpose}
												onChange={(e) => updateMealField(activeDayTab, meal, "purpose", e.target.value)}
												placeholder={t("doctorPrescribe.purposePlaceholder", "Why this helps (optional)")}
											/>
										</div>
									);
								})}
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-muted-foreground">{t("doctorPrescribe.lifestyleRecsComma", "Lifestyle recommendations (comma-separated)")}</label>
								<Textarea
									value={otherFields.lifestyleRecommendations}
									onChange={(e) => setOtherFields((f) => ({ ...f, lifestyleRecommendations: e.target.value }))}
									rows={2}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-muted-foreground">{t("doctorPrescribe.doctorNotesOptional", "Doctor's notes (optional)")}</label>
								<Textarea
									value={otherFields.notes}
									onChange={(e) => setOtherFields((f) => ({ ...f, notes: e.target.value }))}
									rows={2}
								/>
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							<Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
								{t("common.cancel", "Cancel")}
							</Button>
							<Button type="button" onClick={() => submitReview()} disabled={saving}>
								{saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" size={16} />}
								{t("common.save", "Save")}
							</Button>
						</div>
					</>
				)}
				{error ? <p className="text-sm text-destructive">Error: {error}</p> : null}
			</div>
		</Card>
	);
}
