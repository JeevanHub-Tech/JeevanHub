import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Activity, CheckCircle2, ClipboardEdit, HeartPulse, Leaf, Ruler, Salad } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AuthContext } from "../../../context/AuthContext";
import { BACKEND_URL } from "../../../config";
import DoshaAssessmentQuiz from "./DoshaAssessmentQuiz";
import WellnessProfileForm from "./WellnessProfileForm";
import OverviewTab from "./tabs/OverviewTab";
import WeeklyMealPlannerTab from "./tabs/WeeklyMealPlannerTab";
import CookingInstructionsTab from "./tabs/CookingInstructionsTab";
import FoodsToAvoidTab from "./tabs/FoodsToAvoidTab";
import LifestyleRecommendationsTab from "./tabs/LifestyleRecommendationsTab";

const API = BACKEND_URL || "http://localhost:8080";

function computeBmi(heightCm, weightKg) {
	const h = Number(heightCm);
	const w = Number(weightKg);
	if (!h || !w) return null;
	const m = h / 100;
	return +(w / (m * m)).toFixed(1);
}

function bmiCategory(bmi) {
	if (bmi === null) return "Unknown";
	if (bmi < 18.5) return "Underweight";
	if (bmi < 25) return "Normal";
	if (bmi < 30) return "Overweight";
	return "Obese";
}

// Every field on the wellness profile is optional, so a saved document can
// exist without the patient having entered anything. Mirrors
// isProfileFilled in backend/controllers/ayurvedaController.js.
function isProfileFilled(profile) {
	if (!profile) return false;
	const bd = profile.basicDetails || {};
	const hi = profile.healthInfo || {};
	const cond = hi.conditions || {};
	const ls = profile.lifestyle || {};
	const fh = profile.foodHabits || {};
	return Boolean(
		bd.heightCm || bd.weightKg || bd.bodyType ||
		cond.diabetes || cond.highBP || cond.obesityFocus ||
		cond.skinDisease || cond.jointPainArthritis || cond.digestiveIssues || cond.respiratoryIssues || cond.other?.length ||
		hi.medications?.length || hi.allergies?.length ||
		ls.activityLevel || ls.sleepHours || ls.sleepQuality || ls.stressLevel || ls.exerciseHabits || ls.workRoutine ||
		fh.dietType || fh.preferredFoods?.length || fh.dislikedFoods?.length || fh.eatingTimings || fh.waterIntakeLiters
	);
}

const THIRD_DOSHA_LABEL = {
	Balanced: "in balance",
	Low: "low relative to your other doshas",
	Elevated: "somewhat elevated alongside your dominant dosha",
};

function DoshaDetail({ heading, info }) {
	return (
		<div className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
			<h4 className="font-display text-base text-foreground">{heading}</h4>
			<p className="text-sm text-muted-foreground">{info.explanation}</p>

			<div>
				<h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Characteristics</h5>
				<ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground">
					{info.characteristics.map((item) => <li key={item}>{item}</li>)}
				</ul>
			</div>

			<div>
				<h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">When out of balance</h5>
				<ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground">
					{info.possibleImbalances.map((item) => <li key={item}>{item}</li>)}
				</ul>
			</div>

			<div>
				<h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lifestyle recommendations</h5>
				<ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground">
					{info.lifestyleRecommendations.map((item) => <li key={item}>{item}</li>)}
				</ul>
			</div>
		</div>
	);
}

function DetailRow({ label, value }) {
	return (
		<div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
			<span className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
			<span className="text-sm text-foreground">{value}</span>
		</div>
	);
}

function DetailBadgeRow({ label, items, empty = "None reported", variant = "secondary" }) {
	return (
		<div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
			<span className="w-36 shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
			{items.length ? (
				<div className="flex flex-1 flex-wrap gap-1.5">
					{items.map((item) => <Badge key={item} variant={variant}>{item}</Badge>)}
				</div>
			) : (
				<span className="text-sm text-muted-foreground">{empty}</span>
			)}
		</div>
	);
}

function DetailSection({ icon: Icon, title, children }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Icon size={16} className="text-primary" /> {title}
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-2.5">{children}</CardContent>
		</Card>
	);
}

function WellnessProfileDetails({ profile }) {
	const bd = profile?.basicDetails || {};
	const hi = profile?.healthInfo || {};
	const cond = hi.conditions || {};
	const ls = profile?.lifestyle || {};
	const fh = profile?.foodHabits || {};
	const bmi = computeBmi(bd.heightCm, bd.weightKg);

	const conditionsList = [
		cond.diabetes && "Diabetes",
		cond.highBP && "High blood pressure",
		cond.obesityFocus && "Weight management",
		cond.skinDisease && "Skin disease (eczema/psoriasis)",
		cond.jointPainArthritis && "Joint pain / arthritis",
		cond.digestiveIssues && "Digestive issues (GERD/gastritis)",
		cond.respiratoryIssues && "Respiratory issues",
		...(cond.other || []),
	].filter(Boolean);

	const na = (v) => (v === undefined || v === null || v === "" ? "Not provided" : v);

	return (
		<div className="flex flex-col gap-4">
			<DetailSection icon={Ruler} title="Basic details">
				<DetailRow label="Height" value={bd.heightCm ? `${bd.heightCm} cm` : "Not provided"} />
				<DetailRow label="Weight" value={bd.weightKg ? `${bd.weightKg} kg` : "Not provided"} />
				<DetailRow
					label="BMI"
					value={bmi !== null ? (
						<span className="inline-flex items-center gap-2">
							{bmi} <Badge variant="secondary">{bmiCategory(bmi)}</Badge>
						</span>
					) : "Not provided"}
				/>
				<DetailRow label="Body type" value={na(bd.bodyType)} />
			</DetailSection>

			<DetailSection icon={HeartPulse} title="Health information">
				<DetailBadgeRow label="Conditions" items={conditionsList} empty="None reported" variant="destructive" />
				<DetailBadgeRow label="Medications" items={hi.medications || []} empty="Not provided" />
				<DetailBadgeRow label="Allergies" items={hi.allergies || []} empty="Not provided" variant="destructive" />
			</DetailSection>

			<DetailSection icon={Activity} title="Lifestyle">
				<DetailRow label="Activity level" value={na(ls.activityLevel)} />
				<DetailRow label="Sleep" value={ls.sleepHours ? `${ls.sleepHours} hrs, quality: ${na(ls.sleepQuality)}` : "Not provided"} />
				<DetailRow label="Stress level" value={na(ls.stressLevel)} />
				<DetailRow label="Exercise habits" value={na(ls.exerciseHabits)} />
				<DetailRow label="Work routine" value={na(ls.workRoutine)} />
			</DetailSection>

			<DetailSection icon={Salad} title="Food habits">
				<DetailRow label="Diet type" value={na(fh.dietType)} />
				<DetailBadgeRow label="Preferred foods" items={fh.preferredFoods || []} empty="Not provided" variant="success" />
				<DetailBadgeRow label="Food dislikes" items={fh.dislikedFoods || []} empty="Not provided" />
				<DetailRow label="Eating timings" value={na(fh.eatingTimings)} />
				<DetailRow label="Water intake" value={fh.waterIntakeLiters ? `${fh.waterIntakeLiters} L/day` : "Not provided"} />
			</DetailSection>
		</div>
	);
}

function StatusTile({ icon: Icon, title, complete, statusText, actions }) {
	return (
		<div className="flex flex-col gap-3 rounded-(--jh-radius-lg) bg-card p-4 shadow-(--jh-shadow-rest)">
			<div className="flex items-center gap-3">
				<span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", complete ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>
					{complete ? <CheckCircle2 size={22} /> : <Icon size={22} />}
				</span>
				<div className="min-w-0 flex-1">
					<h3 className="font-semibold text-foreground">{title}</h3>
					<p className={cn("text-xs", complete ? "text-primary" : "text-muted-foreground")}>{statusText}</p>
				</div>
			</div>
			<div className="flex gap-2">
				{actions.map((a) => (
					<Button key={a.label} size="sm" variant={a.variant || "outline"} onClick={a.onClick} className="flex-1">
						{a.label}
					</Button>
				))}
			</div>
		</div>
	);
}

/**
 * Shared Ayurveda wellness dashboard. Renders the patient's own data by
 * default; pass `patientId` + `readOnly` to render a doctor's read-only view
 * of a specific patient (uses the .../patient/:patientId endpoints instead).
 * Pass `embedded` when composing this inside another page's own <main>/layout
 * (e.g. the Diet & Yoga screen) so it doesn't nest a second <main> or fight
 * the parent's width.
 */
function AyurvedaDashboard({ patientId: patientIdProp, readOnly = false, embedded = false }) {
	const { auth, loading: authLoading } = useContext(AuthContext);
	const navigate = useNavigate();
	const [profile, setProfile] = useState(null);
	const [dosha, setDosha] = useState(null);
	const [plan, setPlan] = useState(null);
	const [loading, setLoading] = useState(true);
	const [generating, setGenerating] = useState(false);
	const [openPanel, setOpenPanel] = useState(null); // null | "prakriti" | "profile" | "profile-view"

	const isDoctorView = Boolean(patientIdProp);

	const fetchAll = useCallback(async () => {
		setLoading(true);
		try {
			const base = isDoctorView
				? {
					profile: `${API}/api/ayurveda/wellness-profile/patient/${patientIdProp}`,
					dosha: `${API}/api/ayurveda/dosha-assessment/patient/${patientIdProp}`,
					plan: `${API}/api/ayurveda/diet-plan/patient/${patientIdProp}`,
				}
				: {
					profile: `${API}/api/ayurveda/wellness-profile`,
					dosha: `${API}/api/ayurveda/dosha-assessment`,
					plan: `${API}/api/ayurveda/diet-plan`,
				};
			const headers = { Authorization: `Bearer ${auth.token}` };
			const [profileRes, doshaRes, planRes] = await Promise.all([
				axios.get(base.profile, { headers }),
				axios.get(base.dosha, { headers }),
				axios.get(base.plan, { headers }),
			]);
			setProfile(profileRes.data);
			setDosha(doshaRes.data);
			setPlan(planRes.data);
		} catch (error) {
			console.error("Error loading Ayurveda dashboard:", error);
		} finally {
			setLoading(false);
		}
	}, [auth.token, isDoctorView, patientIdProp]);

	useEffect(() => {
		if (authLoading) return;
		if (!auth.token) {
			navigate("/signin");
			return;
		}
		fetchAll();
	}, [auth, authLoading, navigate, fetchAll]);

	const handleGenerate = async () => {
		setGenerating(true);
		try {
			const body = isDoctorView ? { patientId: patientIdProp } : {};
			const res = await axios.post(`${API}/api/ayurveda/diet-plan/generate`, body, { headers: { Authorization: `Bearer ${auth.token}` } });
			setPlan({ ...res.data.plan, isStale: false });
		} catch (error) {
			console.error("Error generating diet plan:", error);
			alert(error.response?.data?.message || "Failed to generate diet plan.");
		} finally {
			setGenerating(false);
		}
	};

	const profileFilled = isProfileFilled(profile);

	const handleGenerateClick = () => {
		const missing = [!dosha && "the Prakriti assessment", !profileFilled && "your wellness profile"].filter(Boolean);
		if (missing.length) {
			alert(`Please complete ${missing.join(" and ")} first.`);
			return;
		}
		handleGenerate();
	};

	const handleDeletePlan = async () => {
		if (!confirm("Delete your generated diet plan? This can't be undone -- you can generate a new one anytime.")) return;
		try {
			await axios.delete(`${API}/api/ayurveda/diet-plan`, { headers: { Authorization: `Bearer ${auth.token}` } });
			setPlan(null);
		} catch (error) {
			console.error("Error deleting diet plan:", error);
			alert(error.response?.data?.message || error.response?.data?.error || `Failed to delete diet plan (${error.response?.status ?? "network error"}).`);
		}
	};

	const Wrapper = embedded
		? ({ children }) => <div className="flex flex-col gap-6">{children}</div>
		: ({ children }) => (
			<main className="bg-background">
				<div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">{children}</div>
			</main>
		);

	if (loading) {
		return <Wrapper><p className="text-center text-muted-foreground">Loading…</p></Wrapper>;
	}

	if (isDoctorView && !dosha) {
		return (
			<Wrapper>
				<EmptyState
					icon={Leaf}
					title="No Prakriti assessment yet"
					description="This patient hasn't completed the Prakriti (dosha) assessment yet."
				/>
			</Wrapper>
		);
	}

	if (isDoctorView && !isProfileFilled(profile)) {
		return (
			<Wrapper>
				<EmptyState
					icon={Leaf}
					title="Wellness profile not filled"
					description="This patient hasn't filled their wellness profile yet."
				/>
			</Wrapper>
		);
	}

	const bd = profile?.basicDetails || {};
	const bmi = computeBmi(bd.heightCm, bd.weightKg);
	const conditions = profile?.healthInfo?.conditions || {};
	const conditionsList = [
		conditions.diabetes && "Diabetes",
		conditions.highBP && "High blood pressure",
		conditions.obesityFocus && "Weight management",
		conditions.skinDisease && "Skin disease (eczema/psoriasis)",
		conditions.jointPainArthritis && "Joint pain / arthritis",
		conditions.digestiveIssues && "Digestive issues (GERD/gastritis)",
		conditions.respiratoryIssues && "Respiratory issues",
		...(conditions.other || []),
	].filter(Boolean);

	return (
		<Wrapper>
				<div>
					<h1 className="font-display text-2xl text-foreground">Ayurveda wellness</h1>
					<p className="text-sm text-muted-foreground">Personalized Prakriti profile and AI-generated diet plan.</p>
				</div>

				{!isDoctorView ? (
					<>
						<div className="grid gap-4 sm:grid-cols-2">
							<StatusTile
								icon={Leaf}
								title="Prakriti Assessment"
								complete={Boolean(dosha)}
								statusText={dosha
									? `${dosha.primaryDosha}${dosha.secondaryDosha ? ` · ${dosha.secondaryDosha}` : ""}`
									: "Not completed yet"}
								actions={dosha
									? [
										{ label: "View result", variant: "outline", onClick: () => setOpenPanel("prakriti-view") },
										{ label: "Retake", variant: "outline", onClick: () => setOpenPanel("prakriti") },
									]
									: [{ label: "Fill assessment", variant: "default", onClick: () => setOpenPanel("prakriti") }]}
							/>
							<StatusTile
								icon={ClipboardEdit}
								title="Wellness Profile"
								complete={profileFilled}
								statusText={profileFilled ? "Filled" : "Not filled yet"}
								actions={profileFilled
									? [
										{ label: "View details", variant: "outline", onClick: () => setOpenPanel("profile-view") },
										{ label: "Refill", variant: "outline", onClick: () => setOpenPanel("profile") },
									]
									: [{ label: "Fill profile", variant: "default", onClick: () => setOpenPanel("profile") }]}
							/>
						</div>
					</>
				) : null}

				{isDoctorView && dosha ? (
					<Card>
						<CardHeader><CardTitle className="font-display text-lg">Your Prakriti (Ayurvedic constitution)</CardTitle></CardHeader>
						<CardContent className="flex flex-col gap-6">
							<div className="flex flex-wrap gap-2">
								<Badge>Primary: {dosha.primaryDosha}</Badge>
								{dosha.secondaryDosha ? <Badge variant="secondary">Secondary: {dosha.secondaryDosha}</Badge> : null}
							</div>

							{dosha.doshaProfile?.primary ? (
								<DoshaDetail heading={`${dosha.secondaryDosha ? "Primary — " : ""}${dosha.doshaProfile.primary.title} (${dosha.doshaProfile.primary.element})`} info={dosha.doshaProfile.primary} />
							) : null}

							{dosha.doshaProfile?.secondary ? (
								<DoshaDetail heading={`Secondary — ${dosha.doshaProfile.secondary.title} (${dosha.doshaProfile.secondary.element})`} info={dosha.doshaProfile.secondary} />
							) : null}

							{dosha.thirdDoshaStatus ? (
								<p className="text-sm text-muted-foreground">
									Your remaining dosha is{" "}
									{THIRD_DOSHA_LABEL[dosha.thirdDoshaStatus] || dosha.thirdDoshaStatus.toLowerCase()}.
								</p>
							) : null}
						</CardContent>
					</Card>
				) : null}

				{isDoctorView && profileFilled ? (
				<Card>
					<CardHeader><CardTitle className="font-display text-lg">Health parameters</CardTitle></CardHeader>
					<CardContent className="flex flex-col gap-2 text-sm">
						<div className="flex items-center gap-2">
							<span className="text-muted-foreground">BMI:</span>
							<span className="font-medium text-foreground">{bmi ?? "Not provided"}</span>
							{bmi !== null ? <Badge variant="secondary">{bmiCategory(bmi)}</Badge> : null}
						</div>
						<div>
							<span className="text-muted-foreground">Weight: </span>
							<span className="text-foreground">{bd.weightKg ? `${bd.weightKg} kg` : "Not provided"}</span>
						</div>
						<div>
							<span className="text-muted-foreground">Conditions: </span>
							<span className="text-foreground">{conditionsList.length ? conditionsList.join(", ") : "None reported"}</span>
						</div>
						<div>
							<span className="text-muted-foreground">Lifestyle: </span>
							<span className="text-foreground">
								{profile?.lifestyle?.activityLevel
									? `${profile.lifestyle.activityLevel} activity, ${profile.lifestyle.stressLevel || "unknown"} stress`
									: "Not provided"}
							</span>
						</div>
					</CardContent>
				</Card>
				) : null}

				<Tabs defaultValue="overview">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="weekly">Weekly Meal Planner</TabsTrigger>
						<TabsTrigger value="cooking">Cooking Instructions</TabsTrigger>
						<TabsTrigger value="avoid">Foods To Avoid</TabsTrigger>
						<TabsTrigger value="lifestyle">Lifestyle Recommendations</TabsTrigger>
					</TabsList>
					<TabsContent value="overview">
						<OverviewTab
						plan={plan}
						isStale={plan?.isStale}
						readOnly={readOnly}
						onRegenerate={handleGenerateClick}
						onDelete={handleDeletePlan}
						onGenerate={handleGenerateClick}
						generating={generating}
						missingPrereqs={[!dosha && "the Prakriti assessment", !profileFilled && "your wellness profile"].filter(Boolean)}
					/>
					</TabsContent>
					<TabsContent value="weekly">
						<WeeklyMealPlannerTab plan={plan} />
					</TabsContent>
					<TabsContent value="cooking">
						<CookingInstructionsTab plan={plan} />
					</TabsContent>
					<TabsContent value="avoid">
						<FoodsToAvoidTab plan={plan} />
					</TabsContent>
					<TabsContent value="lifestyle">
						<LifestyleRecommendationsTab plan={plan} dosha={dosha} />
					</TabsContent>
				</Tabs>

				{!isDoctorView ? (
					<>
						<Dialog open={openPanel === "prakriti"} onOpenChange={(open) => !open && setOpenPanel(null)}>
							<DialogContent className="max-w-2xl overflow-y-auto">
								<DialogTitle className="sr-only">Prakriti assessment</DialogTitle>
								<DoshaAssessmentQuiz embedded onDone={() => { setOpenPanel(null); fetchAll(); }} />
							</DialogContent>
						</Dialog>
						<Dialog open={openPanel === "prakriti-view"} onOpenChange={(open) => !open && setOpenPanel(null)}>
							<DialogContent className="max-w-2xl overflow-y-auto">
								<DialogTitle className="font-display text-lg">Your Prakriti assessment result</DialogTitle>
								{dosha ? (
									<div className="flex flex-col gap-6">
										<div className="flex flex-wrap gap-2">
											<Badge>Primary: {dosha.primaryDosha}</Badge>
											{dosha.secondaryDosha ? <Badge variant="secondary">Secondary: {dosha.secondaryDosha}</Badge> : null}
										</div>
										{dosha.doshaProfile?.primary ? (
											<DoshaDetail heading={`${dosha.secondaryDosha ? "Primary — " : ""}${dosha.doshaProfile.primary.title} (${dosha.doshaProfile.primary.element})`} info={dosha.doshaProfile.primary} />
										) : null}
										{dosha.doshaProfile?.secondary ? (
											<DoshaDetail heading={`Secondary — ${dosha.doshaProfile.secondary.title} (${dosha.doshaProfile.secondary.element})`} info={dosha.doshaProfile.secondary} />
										) : null}
										{dosha.thirdDoshaStatus ? (
											<p className="text-sm text-muted-foreground">
												Your remaining dosha is{" "}
												{THIRD_DOSHA_LABEL[dosha.thirdDoshaStatus] || dosha.thirdDoshaStatus.toLowerCase()}.
											</p>
										) : null}
									</div>
								) : null}
								<Button
									size="sm"
									variant="outline"
									className="self-start"
									onClick={() => setOpenPanel("prakriti")}
								>
									Retake assessment
								</Button>
							</DialogContent>
						</Dialog>
						<Dialog open={openPanel === "profile"} onOpenChange={(open) => !open && setOpenPanel(null)}>
							<DialogContent className="max-w-2xl overflow-y-auto">
								<DialogTitle className="sr-only">Wellness profile</DialogTitle>
								<WellnessProfileForm embedded onSaved={() => { setOpenPanel(null); fetchAll(); }} />
							</DialogContent>
						</Dialog>
						<Dialog open={openPanel === "profile-view"} onOpenChange={(open) => !open && setOpenPanel(null)}>
							<DialogContent className="max-w-2xl overflow-y-auto">
								<div className="flex items-center justify-between gap-3 pr-6">
									<DialogTitle className="font-display text-lg">Your wellness profile</DialogTitle>
									<Button size="sm" onClick={() => setOpenPanel("profile")}>
										<ClipboardEdit size={14} /> Edit
									</Button>
								</div>
								<WellnessProfileDetails profile={profile} />
							</DialogContent>
						</Dialog>
					</>
				) : null}
		</Wrapper>
	);
}

export default AyurvedaDashboard;
