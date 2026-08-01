import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AuthContext } from "../../../context/AuthContext";
import { BACKEND_URL } from "../../../config";

const API = BACKEND_URL || "http://localhost:8080";

function Field({ label, htmlFor, children, hint }) {
	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={htmlFor}>
				{label} <span className="font-normal text-muted-foreground">(optional)</span>
			</Label>
			{children}
			{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
		</div>
	);
}

// Comma-separated list <-> array helpers, since none of these fields need
// anything fancier than a free-text input the patient can leave blank.
const toList = (str) => (str || "").split(",").map((s) => s.trim()).filter(Boolean);
const toStr = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");

function computeBmi(heightCm, weightKg) {
	const h = Number(heightCm);
	const w = Number(weightKg);
	if (!h || !w) return null;
	const m = h / 100;
	return +(w / (m * m)).toFixed(1);
}

function bmiCategory(bmi) {
	if (bmi === null) return null;
	if (bmi < 18.5) return "Underweight";
	if (bmi < 25) return "Normal";
	if (bmi < 30) return "Overweight";
	return "Obese";
}

const emptyForm = {
	heightCm: "",
	weightKg: "",
	bodyType: "",
	diabetes: false,
	highBP: false,
	obesityFocus: false,
	skinDisease: false,
	jointPainArthritis: false,
	digestiveIssues: false,
	respiratoryIssues: false,
	otherConditions: "",
	medications: "",
	allergies: "",
	activityLevel: "",
	sleepHours: "",
	sleepQuality: "",
	stressLevel: "",
	exerciseHabits: "",
	workRoutine: "",
	dietType: "",
	preferredFoods: "",
	dislikedFoods: "",
	eatingTimings: "",
	waterIntakeLiters: "",
};

function WellnessProfileForm({ embedded = false, onSaved } = {}) {
	const { auth, loading: authLoading } = useContext(AuthContext);
	const navigate = useNavigate();
	const [form, setForm] = useState(emptyForm);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (authLoading) return;
		if (!auth.token) {
			if (!embedded) navigate("/signin");
			return;
		}

		(async () => {
			setLoading(true);
			try {
				const res = await axios.get(`${API}/api/ayurveda/wellness-profile`, {
					headers: { Authorization: `Bearer ${auth.token}` },
				});
				const p = res.data;
				if (p) {
					setForm({
						heightCm: p.basicDetails?.heightCm ?? "",
						weightKg: p.basicDetails?.weightKg ?? "",
						bodyType: p.basicDetails?.bodyType || "",
						diabetes: Boolean(p.healthInfo?.conditions?.diabetes),
						highBP: Boolean(p.healthInfo?.conditions?.highBP),
						obesityFocus: Boolean(p.healthInfo?.conditions?.obesityFocus),
						skinDisease: Boolean(p.healthInfo?.conditions?.skinDisease),
						jointPainArthritis: Boolean(p.healthInfo?.conditions?.jointPainArthritis),
						digestiveIssues: Boolean(p.healthInfo?.conditions?.digestiveIssues),
						respiratoryIssues: Boolean(p.healthInfo?.conditions?.respiratoryIssues),
						otherConditions: toStr(p.healthInfo?.conditions?.other),
						medications: toStr(p.healthInfo?.medications),
						allergies: toStr(p.healthInfo?.allergies),
						activityLevel: p.lifestyle?.activityLevel || "",
						sleepHours: p.lifestyle?.sleepHours ?? "",
						sleepQuality: p.lifestyle?.sleepQuality || "",
						stressLevel: p.lifestyle?.stressLevel || "",
						exerciseHabits: p.lifestyle?.exerciseHabits || "",
						workRoutine: p.lifestyle?.workRoutine || "",
						dietType: p.foodHabits?.dietType || "",
						preferredFoods: toStr(p.foodHabits?.preferredFoods),
						dislikedFoods: toStr(p.foodHabits?.dislikedFoods),
						eatingTimings: p.foodHabits?.eatingTimings || "",
						waterIntakeLiters: p.foodHabits?.waterIntakeLiters ?? "",
					});
				}
			} catch (error) {
				console.error("Error fetching wellness profile:", error);
			} finally {
				setLoading(false);
			}
		})();
	}, [auth, authLoading, navigate]);

	const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
	const setInput = (key) => (e) => set(key)(e.target.value);
	const setCheckbox = (key) => (e) => set(key)(e.target.checked);

	const bmi = computeBmi(form.heightCm, form.weightKg);
	const category = bmiCategory(bmi);

	const handleSave = async () => {
		setSaving(true);
		try {
			const payload = {
				basicDetails: {
					heightCm: form.heightCm === "" ? undefined : Number(form.heightCm),
					weightKg: form.weightKg === "" ? undefined : Number(form.weightKg),
					bodyType: form.bodyType || undefined,
				},
				healthInfo: {
					conditions: {
						diabetes: form.diabetes,
						highBP: form.highBP,
						obesityFocus: form.obesityFocus,
						skinDisease: form.skinDisease,
						jointPainArthritis: form.jointPainArthritis,
						digestiveIssues: form.digestiveIssues,
						respiratoryIssues: form.respiratoryIssues,
						other: toList(form.otherConditions),
					},
					medications: toList(form.medications),
					allergies: toList(form.allergies),
				},
				lifestyle: {
					activityLevel: form.activityLevel || undefined,
					sleepHours: form.sleepHours === "" ? undefined : Number(form.sleepHours),
					sleepQuality: form.sleepQuality || undefined,
					stressLevel: form.stressLevel || undefined,
					exerciseHabits: form.exerciseHabits || undefined,
					workRoutine: form.workRoutine || undefined,
				},
				foodHabits: {
					dietType: form.dietType || undefined,
					preferredFoods: toList(form.preferredFoods),
					dislikedFoods: toList(form.dislikedFoods),
					eatingTimings: form.eatingTimings || undefined,
					waterIntakeLiters: form.waterIntakeLiters === "" ? undefined : Number(form.waterIntakeLiters),
				},
			};

			await axios.post(`${API}/api/ayurveda/wellness-profile`, payload, {
				headers: { Authorization: `Bearer ${auth.token}` },
			});
			if (embedded) {
				onSaved?.();
			} else {
				alert("Wellness profile saved.");
				navigate("/ayurveda-wellness");
			}
		} catch (error) {
			console.error("Error saving wellness profile:", error);
			alert(error.response?.data?.error || "Failed to save wellness profile.");
		} finally {
			setSaving(false);
		}
	};

	const Wrapper = embedded
		? ({ children }) => <div className="flex flex-col gap-6">{children}</div>
		: ({ children }) => (
			<main className="bg-background">
				<div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">{children}</div>
			</main>
		);

	if (loading) {
		return <Wrapper><p className="text-center text-muted-foreground">Loading…</p></Wrapper>;
	}

	return (
		<Wrapper>
			{!embedded ? <BackButton to="/ayurveda-wellness" /> : null}
			<div>
				<h1 className="font-display text-2xl text-foreground">Ayurveda wellness profile</h1>
				<p className="text-sm text-muted-foreground">
					Share as much or as little as you'd like — everything here is optional and only used to personalize your Ayurvedic diet plan.
				</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="font-display text-lg">Basic details</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<Field label="Height (cm)" htmlFor="heightCm">
							<Input id="heightCm" type="number" value={form.heightCm} onChange={setInput("heightCm")} />
						</Field>
						<Field label="Weight (kg)" htmlFor="weightKg">
							<Input id="weightKg" type="number" value={form.weightKg} onChange={setInput("weightKg")} />
						</Field>
						<div className="sm:col-span-2">
							<Field label="Body type" htmlFor="bodyType">
								<Input id="bodyType" value={form.bodyType} onChange={setInput("bodyType")} placeholder="e.g. Slim, Athletic, Broad" />
							</Field>
						</div>
						{bmi !== null ? (
							<div className="sm:col-span-2 flex items-center gap-2 text-sm">
								<span className="text-muted-foreground">BMI:</span>
								<span className="font-medium text-foreground">{bmi}</span>
								<Badge variant="secondary">{category}</Badge>
							</div>
						) : null}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-display text-lg">Health information</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="flex flex-wrap gap-4">
							<label className="flex items-center gap-2 text-sm text-foreground">
								<input type="checkbox" checked={form.diabetes} onChange={setCheckbox("diabetes")} />
								Diabetes
							</label>
							<label className="flex items-center gap-2 text-sm text-foreground">
								<input type="checkbox" checked={form.highBP} onChange={setCheckbox("highBP")} />
								High blood pressure
							</label>
							<label className="flex items-center gap-2 text-sm text-foreground">
								<input type="checkbox" checked={form.obesityFocus} onChange={setCheckbox("obesityFocus")} />
								Weight management focus
							</label>
							<label className="flex items-center gap-2 text-sm text-foreground">
								<input type="checkbox" checked={form.skinDisease} onChange={setCheckbox("skinDisease")} />
								Skin disease (eczema/psoriasis/chronic rashes)
							</label>
							<label className="flex items-center gap-2 text-sm text-foreground">
								<input type="checkbox" checked={form.jointPainArthritis} onChange={setCheckbox("jointPainArthritis")} />
								Joint pain / arthritis
							</label>
							<label className="flex items-center gap-2 text-sm text-foreground">
								<input type="checkbox" checked={form.digestiveIssues} onChange={setCheckbox("digestiveIssues")} />
								Digestive issues (GERD/gastritis)
							</label>
							<label className="flex items-center gap-2 text-sm text-foreground">
								<input type="checkbox" checked={form.respiratoryIssues} onChange={setCheckbox("respiratoryIssues")} />
								Respiratory issues
							</label>
						</div>
						<Field label="Other conditions" htmlFor="otherConditions" hint="Comma-separated">
							<Input id="otherConditions" value={form.otherConditions} onChange={setInput("otherConditions")} />
						</Field>
						<Field label="Current medications" htmlFor="medications" hint="Comma-separated">
							<Input id="medications" value={form.medications} onChange={setInput("medications")} />
						</Field>
						<Field label="Allergies / food restrictions" htmlFor="allergies" hint="Comma-separated">
							<Input id="allergies" value={form.allergies} onChange={setInput("allergies")} />
						</Field>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-display text-lg">Lifestyle</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<Field label="Daily activity level" htmlFor="activityLevel">
							<Select value={form.activityLevel} onValueChange={set("activityLevel")}>
								<SelectTrigger id="activityLevel"><SelectValue placeholder="Select" /></SelectTrigger>
								<SelectContent>
									<SelectItem value="sedentary">Sedentary</SelectItem>
									<SelectItem value="light">Light</SelectItem>
									<SelectItem value="moderate">Moderate</SelectItem>
									<SelectItem value="active">Active</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<Field label="Sleep hours" htmlFor="sleepHours">
							<Input id="sleepHours" type="number" value={form.sleepHours} onChange={setInput("sleepHours")} />
						</Field>
						<Field label="Sleep quality" htmlFor="sleepQuality">
							<Select value={form.sleepQuality} onValueChange={set("sleepQuality")}>
								<SelectTrigger id="sleepQuality"><SelectValue placeholder="Select" /></SelectTrigger>
								<SelectContent>
									<SelectItem value="poor">Poor</SelectItem>
									<SelectItem value="fair">Fair</SelectItem>
									<SelectItem value="good">Good</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<Field label="Stress level" htmlFor="stressLevel">
							<Select value={form.stressLevel} onValueChange={set("stressLevel")}>
								<SelectTrigger id="stressLevel"><SelectValue placeholder="Select" /></SelectTrigger>
								<SelectContent>
									<SelectItem value="low">Low</SelectItem>
									<SelectItem value="moderate">Moderate</SelectItem>
									<SelectItem value="high">High</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<Field label="Exercise habits" htmlFor="exerciseHabits">
							<Input id="exerciseHabits" value={form.exerciseHabits} onChange={setInput("exerciseHabits")} placeholder="e.g. Yoga 3x/week" />
						</Field>
						<Field label="Work routine" htmlFor="workRoutine">
							<Input id="workRoutine" value={form.workRoutine} onChange={setInput("workRoutine")} placeholder="e.g. Desk job, 9-6" />
						</Field>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-display text-lg">Food habits</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<Field label="Diet type" htmlFor="dietType">
							<Select value={form.dietType} onValueChange={set("dietType")}>
								<SelectTrigger id="dietType"><SelectValue placeholder="Select" /></SelectTrigger>
								<SelectContent>
									<SelectItem value="vegetarian">Vegetarian</SelectItem>
									<SelectItem value="non_vegetarian">Non-vegetarian</SelectItem>
									<SelectItem value="eggetarian">Eggetarian</SelectItem>
									<SelectItem value="vegan">Vegan</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<Field label="Water intake (liters/day)" htmlFor="waterIntakeLiters">
							<Input id="waterIntakeLiters" type="number" value={form.waterIntakeLiters} onChange={setInput("waterIntakeLiters")} />
						</Field>
						<Field label="Preferred foods" htmlFor="preferredFoods" hint="Comma-separated">
							<Textarea id="preferredFoods" value={form.preferredFoods} onChange={setInput("preferredFoods")} />
						</Field>
						<Field label="Food dislikes" htmlFor="dislikedFoods" hint="Comma-separated">
							<Textarea id="dislikedFoods" value={form.dislikedFoods} onChange={setInput("dislikedFoods")} />
						</Field>
						<div className="sm:col-span-2">
							<Field label="Eating timings" htmlFor="eatingTimings">
								<Input id="eatingTimings" value={form.eatingTimings} onChange={setInput("eatingTimings")} placeholder="e.g. Breakfast 8am, Lunch 1pm, Dinner 8pm" />
							</Field>
						</div>
					</CardContent>
				</Card>

				<div className="flex flex-wrap items-center justify-between gap-2">
					{!embedded ? (
						<Button variant="ghost" size="sm" onClick={() => navigate("/ayurveda-wellness/assessment")}>Retake Prakriti assessment</Button>
					) : <div />}
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => (embedded ? onSaved?.() : navigate("/ayurveda-wellness"))}>Cancel</Button>
						<Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
					</div>
				</div>
		</Wrapper>
	);
}

export default WellnessProfileForm;
