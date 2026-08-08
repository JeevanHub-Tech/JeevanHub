import { useState, useEffect, useCallback } from "react";
import { Leaf, Loader2, PenLine, Check } from "lucide-react";

import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { SourceBadge } from "@/components/ui/SourceBadge";

const toStr = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");
const toList = (str) => (str || "").split(",").map((s) => s.trim()).filter(Boolean);

// Which content the patient currently sees: doctorReview fields once
// published, otherwise the raw AI fields. Mirrors resolveDisplayPlan() in
// backend/controllers/ayurvedaController.js.
function resolveActiveContent(plan) {
	if (!plan) return null;
	if (plan.status === "ai_modified" || plan.status === "doctor_approved") {
		return plan.doctorReview || {};
	}
	return {
		cookingInstructions: plan.cookingInstructions,
		foodsToAvoid: plan.foodsToAvoid,
		lifestyleRecommendations: plan.lifestyleRecommendations,
	};
}

function fieldsToForm(active) {
	return {
		cookingGuidelines: toStr(active?.cookingInstructions?.generalGuidelines),
		foodsAvoidDosha: toStr(active?.foodsToAvoid?.doshaBased),
		foodsAvoidMedical: toStr(active?.foodsToAvoid?.medicalBased),
		foodsAvoidSeasonal: toStr(active?.foodsToAvoid?.seasonalBased),
		lifestyleRecommendations: toStr(active?.lifestyleRecommendations),
		notes: active?.notes || "",
	};
}

// Doctor-facing edit view of the same "Other Wellness Recommendations"
// content the patient sees -- cooking guidelines, foods to avoid, and
// lifestyle recommendations. This is the SAME underlying AyurvedaDietPlan
// doctorReview document the Diet & Weekly Meal Planner tab edits (just a
// different subset of its fields), saved as a silent draft via the same
// review endpoint until "Submit Prescription" publishes it.
export function OtherWellnessTab({ patientId, bookingId }) {
	const [plan, setPlan] = useState(null);
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [form, setForm] = useState(fieldsToForm({}));
	const [error, setError] = useState(null);

	const fetchPlan = useCallback(async () => {
		if (!patientId) {
			setLoading(false);
			return;
		}
		try {
			const response = await authFetch(`${BACKEND_URL}/api/ayurveda/diet-plan/patient/${patientId}`);
			if (response.ok) {
				const data = await response.json();
				setPlan(data);
			}
		} catch (err) {
			console.error("Error fetching diet plan for wellness recommendations:", err);
		} finally {
			setLoading(false);
		}
	}, [patientId]);

	useEffect(() => {
		fetchPlan();
	}, [fetchPlan]);

	const startEditing = () => {
		setForm(fieldsToForm(resolveActiveContent(plan)));
		setEditing(true);
	};

	const save = async () => {
		setSaving(true);
		setError(null);
		try {
			const body = {
				bookingId,
				cookingInstructions: {
					meals: plan?.doctorReview?.cookingInstructions?.meals || plan?.cookingInstructions?.meals || [],
					generalGuidelines: toList(form.cookingGuidelines),
				},
				foodsToAvoid: {
					doshaBased: toList(form.foodsAvoidDosha),
					medicalBased: toList(form.foodsAvoidMedical),
					seasonalBased: toList(form.foodsAvoidSeasonal),
				},
				lifestyleRecommendations: toList(form.lifestyleRecommendations),
				notes: form.notes,
			};
			const response = await authFetch(`${BACKEND_URL}/api/ayurveda/diet-plan/patient/${patientId}/review`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || data.message || "Failed to save wellness recommendations");
			setPlan(data.plan);
			setEditing(false);
		} catch (err) {
			console.error("Error saving wellness recommendations:", err);
			setError(err.message);
			alert(err.message);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<Card className="overflow-hidden p-0">
				<div className="border-b border-border bg-muted/40 px-6 py-4">
					<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
						<Leaf className="size-6 text-primary" />
						Other Wellness Recommendations
					</h3>
				</div>
				<div className="p-6">
					<p className="py-6 text-center text-muted-foreground">Loading...</p>
				</div>
			</Card>
		);
	}

	if (!plan) {
		return (
			<Card className="overflow-hidden p-0">
				<div className="border-b border-border bg-muted/40 px-6 py-4">
					<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
						<Leaf className="size-6 text-primary" />
						Other Wellness Recommendations
					</h3>
				</div>
				<div className="p-6">
					<EmptyState
						icon={Leaf}
						title="Nothing to show yet"
						description="This patient hasn't generated an AI diet plan yet -- cooking guidelines and foods-to-avoid come from it."
					/>
				</div>
			</Card>
		);
	}

	const active = resolveActiveContent(plan);

	return (
		<Card className="overflow-hidden p-0">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-6 py-4">
				<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
					<Leaf className="size-6 text-primary" />
					Other Wellness Recommendations
				</h3>
				<div className="flex items-center gap-2">
					{plan.doctorReview?.reviewedAt && !plan.doctorReview?.published ? (
						<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Draft -- not sent yet</span>
					) : null}
					<SourceBadge status={plan.status} />
				</div>
			</div>
			<div className="flex flex-col gap-5 p-6">
				{!editing ? (
					<>
						<div>
							<h4 className="mb-1 text-sm font-bold text-foreground">Cooking guidelines</h4>
							{active?.cookingInstructions?.generalGuidelines?.length ? (
								<ul className="list-disc pl-5 text-sm text-foreground">
									{active.cookingInstructions.generalGuidelines.map((g, i) => <li key={i}>{g}</li>)}
								</ul>
							) : <p className="text-sm text-muted-foreground">Not added</p>}
						</div>
						<div>
							<h4 className="mb-1 text-sm font-bold text-foreground">Foods to avoid</h4>
							{[
								...(active?.foodsToAvoid?.doshaBased || []),
								...(active?.foodsToAvoid?.medicalBased || []),
								...(active?.foodsToAvoid?.seasonalBased || []),
							].length ? (
								<ul className="list-disc pl-5 text-sm text-foreground">
									{[...(active?.foodsToAvoid?.doshaBased || []), ...(active?.foodsToAvoid?.medicalBased || []), ...(active?.foodsToAvoid?.seasonalBased || [])].map((f, i) => <li key={i}>{f}</li>)}
								</ul>
							) : <p className="text-sm text-muted-foreground">Not added</p>}
						</div>
						<div>
							<h4 className="mb-1 text-sm font-bold text-foreground">Lifestyle recommendations</h4>
							{active?.lifestyleRecommendations?.length ? (
								<ul className="list-disc pl-5 text-sm text-foreground">
									{active.lifestyleRecommendations.map((r, i) => <li key={i}>{r}</li>)}
								</ul>
							) : <p className="text-sm text-muted-foreground">Not added</p>}
						</div>
						<div>
							<Button type="button" variant="outline" onClick={startEditing}>
								<PenLine data-icon="inline-start" size={16} /> Edit
							</Button>
						</div>
					</>
				) : (
					<>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-muted-foreground">Cooking guidelines (comma-separated)</label>
							<Textarea rows={2} value={form.cookingGuidelines} onChange={(e) => setForm((f) => ({ ...f, cookingGuidelines: e.target.value }))} />
						</div>
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-muted-foreground">Foods to avoid -- dosha (comma-separated)</label>
								<Textarea rows={2} value={form.foodsAvoidDosha} onChange={(e) => setForm((f) => ({ ...f, foodsAvoidDosha: e.target.value }))} />
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-muted-foreground">Foods to avoid -- medical (comma-separated)</label>
								<Textarea rows={2} value={form.foodsAvoidMedical} onChange={(e) => setForm((f) => ({ ...f, foodsAvoidMedical: e.target.value }))} />
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold text-muted-foreground">Foods to avoid -- seasonal (comma-separated)</label>
								<Textarea rows={2} value={form.foodsAvoidSeasonal} onChange={(e) => setForm((f) => ({ ...f, foodsAvoidSeasonal: e.target.value }))} />
							</div>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-muted-foreground">Lifestyle recommendations (comma-separated)</label>
							<Textarea rows={2} value={form.lifestyleRecommendations} onChange={(e) => setForm((f) => ({ ...f, lifestyleRecommendations: e.target.value }))} />
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-muted-foreground">Doctor's notes (optional)</label>
							<Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
						</div>
						<div className="flex flex-wrap gap-2">
							<Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
								Cancel
							</Button>
							<Button type="button" onClick={save} disabled={saving}>
								{saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" size={16} />}
								Save
							</Button>
						</div>
					</>
				)}
				{error ? <p className="text-sm text-destructive">Error: {error}</p> : null}
			</div>
		</Card>
	);
}
