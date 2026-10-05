import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Activity, CheckCircle2, ClipboardEdit, HeartPulse, Leaf, Ruler, Salad } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { AuthContext } from "../../../context/AuthContext";
import { BACKEND_URL } from "../../../config";
import DoshaAssessmentQuiz from "./DoshaAssessmentQuiz";
import WellnessProfileForm from "./WellnessProfileForm";
import OverviewTab from "./tabs/OverviewTab";
import { generateBothPlans } from "@/lib/ayurvedaPlans";

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

const BODY_TYPE_LABELS = {
	lean_thin: "Lean / Thin Frame",
	athletic_defined: "Athletic / Well Defined",
	medium_frame: "Medium Frame",
	soft_round: "Soft / Round Body",
};

const THIRD_DOSHA_LABEL = {
	Balanced: "in balance",
	Low: "low relative to your other doshas",
	Elevated: "somewhat elevated alongside your dominant dosha",
};

function DoshaDetail({ heading, info, doshaKey }) {
	const { t } = useTranslation();
	const key = doshaKey || (info.title ? info.title.toUpperCase() : "");
	const profile = key ? t(`doshaResults.profiles.${key}`, { returnObjects: true }) : null;
	const isObject = profile && typeof profile === "object" && !Array.isArray(profile);

	const explanation = isObject && profile.explanation ? profile.explanation : info.explanation;
	const characteristics = isObject && Array.isArray(profile.characteristics) ? profile.characteristics : (info.characteristics || []);
	const possibleImbalances = isObject && Array.isArray(profile.possibleImbalances) ? profile.possibleImbalances : (info.possibleImbalances || []);
	const lifestyleRecommendations = isObject && Array.isArray(profile.lifestyleRecommendations) ? profile.lifestyleRecommendations : (info.lifestyleRecommendations || []);

	return (
		<div className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
			<h4 className="font-display text-base text-foreground">{heading}</h4>
			<p className="text-sm text-muted-foreground">{explanation}</p>

			<div>
				<h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{t("doshaResults.characteristics", "CHARACTERISTICS")}
				</h5>
				<ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground">
					{characteristics.map((item) => <li key={item}>{item}</li>)}
				</ul>
			</div>

			<div>
				<h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{t("doshaResults.whenOutOfBalance", "WHEN OUT OF BALANCE")}
				</h5>
				<ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground">
					{possibleImbalances.map((item) => <li key={item}>{item}</li>)}
				</ul>
			</div>

			<div>
				<h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{t("doshaResults.lifestyleRecommendations", "LIFESTYLE RECOMMENDATIONS")}
				</h5>
				<ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground">
					{lifestyleRecommendations.map((item) => <li key={item}>{item}</li>)}
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
	const { t } = useTranslation();
	const bd = profile?.basicDetails || {};
	const hi = profile?.healthInfo || {};
	const cond = hi.conditions || {};
	const ls = profile?.lifestyle || {};
	const fh = profile?.foodHabits || {};
	const bmi = computeBmi(bd.heightCm, bd.weightKg);

	const conditionsList = [
		cond.diabetes && t("wellnessProfile.conditionNames.diabetes", "Diabetes"),
		cond.highBP && t("wellnessProfile.conditionNames.highBP", "High blood pressure"),
		cond.obesityFocus && t("wellnessProfile.conditionNames.obesityFocus", "Weight management"),
		cond.skinDisease && t("wellnessProfile.conditionNames.skinDisease", "Skin disease (eczema/psoriasis)"),
		cond.jointPainArthritis && t("wellnessProfile.conditionNames.jointPainArthritis", "Joint pain / arthritis"),
		cond.digestiveIssues && t("wellnessProfile.conditionNames.digestiveIssues", "Digestive issues (GERD/gastritis)"),
		cond.respiratoryIssues && t("wellnessProfile.conditionNames.respiratoryIssues", "Respiratory issues"),
		...(cond.other || []),
	].filter(Boolean);

	const na = (v) => (v === undefined || v === null || v === "" ? t("wellnessProfile.notProvided", "Not provided") : v);
	const noneRep = t("wellnessProfile.noneReported", "None reported");
	const notProv = t("wellnessProfile.notProvided", "Not provided");

	const bodyTypeLabel = bd.bodyType ? t(`wellnessProfile.bodyTypes.${bd.bodyType}`, { defaultValue: BODY_TYPE_LABELS[bd.bodyType] || bd.bodyType }) : notProv;
	const bmiCat = bmiCategory(bmi);
	const bmiCatLabel = t(`wellnessProfile.bmiCategories.${bmiCat}`, { defaultValue: bmiCat });

	return (
		<div className="flex flex-col gap-4">
			<DetailSection icon={Ruler} title={t("wellnessProfile.basicDetails", "Basic details")}>
				<DetailRow label={t("wellnessProfile.height", "Height")} value={bd.heightCm ? `${bd.heightCm} cm` : notProv} />
				<DetailRow label={t("wellnessProfile.weight", "Weight")} value={bd.weightKg ? `${bd.weightKg} kg` : notProv} />
				<DetailRow
					label={t("wellnessProfile.bmi", "BMI")}
					value={bmi !== null ? (
						<span className="inline-flex items-center gap-2">
							{bmi} <Badge variant="secondary">{bmiCatLabel}</Badge>
						</span>
					) : notProv}
				/>
				<DetailRow label={t("wellnessProfile.bodyType", "Body type")} value={bodyTypeLabel} />
			</DetailSection>

			<DetailSection icon={HeartPulse} title={t("wellnessProfile.healthInfo", "Health information")}>
				<DetailBadgeRow label={t("wellnessProfile.conditions", "Conditions")} items={conditionsList} empty={noneRep} variant="destructive" />
				<DetailBadgeRow label={t("wellnessProfile.medications", "Medications")} items={hi.medications || []} empty={notProv} />
				<DetailBadgeRow label={t("wellnessProfile.allergies", "Allergies")} items={hi.allergies || []} empty={notProv} variant="destructive" />
			</DetailSection>

			<DetailSection icon={Activity} title={t("wellnessProfile.lifestyle", "Lifestyle")}>
				<DetailRow label={t("wellnessProfile.activityLevel", "Activity level")} value={na(ls.activityLevel)} />
				<DetailRow label={t("wellnessProfile.sleep", "Sleep")} value={ls.sleepHours ? t("wellnessProfile.hrsQuality", { hours: ls.sleepHours, quality: na(ls.sleepQuality) }) : notProv} />
				<DetailRow label={t("wellnessProfile.stressLevel", "Stress level")} value={na(ls.stressLevel)} />
				<DetailRow label={t("wellnessProfile.exerciseHabits", "Exercise habits")} value={na(ls.exerciseHabits)} />
				<DetailRow label={t("wellnessProfile.workRoutine", "Work routine")} value={na(ls.workRoutine)} />
			</DetailSection>

			<DetailSection icon={Salad} title={t("wellnessProfile.foodHabits", "Food habits")}>
				<DetailRow label={t("wellnessProfile.dietType", "Diet type")} value={na(fh.dietType)} />
				<DetailBadgeRow label={t("wellnessProfile.preferredFoods", "Preferred foods")} items={fh.preferredFoods || []} empty={notProv} variant="success" />
				<DetailBadgeRow label={t("wellnessProfile.foodDislikes", "Food dislikes")} items={fh.dislikedFoods || []} empty={notProv} />
				<DetailRow label={t("wellnessProfile.eatingTimings", "Eating timings")} value={na(fh.eatingTimings)} />
				<DetailRow label={t("wellnessProfile.waterIntake", "Water intake")} value={fh.waterIntakeLiters ? t("wellnessProfile.waterPerDay", { liters: fh.waterIntakeLiters }) : notProv} />
			</DetailSection>
		</div>
	);
}

// Hoisted to module scope (not defined inside AyurvedaDashboard's render) so
// they keep a stable component identity across re-renders. Defining these
// inline in render previously gave them a *new* identity every render,
// forcing React to remount everything beneath -- including any open Dialog
// modal -- which dropped focus/state after the first keystroke in the
// wellness profile / dosha quiz forms.
function EmbeddedWrapper({ children }) {
	return <div className="flex flex-col gap-6">{children}</div>;
}
function PageWrapper({ children }) {
	return (
		<main className="bg-background">
			<div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">{children}</div>
		</main>
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
 * the parent's width. Pass `onPlanChanged` to be notified after a
 * generate/regenerate/delete succeeds, so a parent page showing the plan
 * elsewhere (e.g. the Weekly Meal Planner section) can refetch.
 */
function AyurvedaDashboard({ patientId: patientIdProp, readOnly = false, embedded = false, onPlanChanged }) {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language?.startsWith("hi") ? "hi" : "en";
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
					plan: `${API}/api/ayurveda/diet-plan/patient/${patientIdProp}?lang=${currentLang}`,
				}
				: {
					profile: `${API}/api/ayurveda/wellness-profile`,
					dosha: `${API}/api/ayurveda/dosha-assessment`,
					plan: `${API}/api/ayurveda/diet-plan?lang=${currentLang}`,
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
	}, [auth.token, isDoctorView, patientIdProp, currentLang]);

	useEffect(() => {
		if (authLoading) return;
		if (!auth.token) {
			navigate("/signin");
			return;
		}
		fetchAll();
	}, [auth, authLoading, navigate, fetchAll]);

	// One "Generate" always produces both the diet plan and the yoga plan
	// together (see generateBothPlans) -- there's no separate yoga button.
	const handleGenerate = async () => {
		setGenerating(true);
		try {
			const headers = { Authorization: `Bearer ${auth.token}` };
			const postJson = async (url, body) => {
				const res = await axios.post(`${API}${url}`, body, { headers });
				return res.data;
			};
			const result = await generateBothPlans(postJson, isDoctorView ? patientIdProp : undefined);
			if (result.dietOk) setPlan({ ...result.plan, isStale: false });
			if (!result.dietOk || !result.yogaOk) {
				alert([result.dietError, result.yogaError].filter(Boolean).join(" "));
			}
			onPlanChanged?.();
		} catch (error) {
			console.error("Error generating plan:", error);
			alert(error.message || "Failed to generate your plan.");
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
		if (!confirm("Delete your current plan? This will remove the current diet and yoga plan so you can generate a fresh one.")) return;
		try {
			await Promise.allSettled([
				axios.delete(`${API}/api/ayurveda/diet-plan`, { headers: { Authorization: `Bearer ${auth.token}` } }),
				axios.delete(`${API}/api/ayurveda/yoga-plan`, { headers: { Authorization: `Bearer ${auth.token}` } }),
			]);
			setPlan(null);
			onPlanChanged?.();
		} catch (error) {
			console.error("Error deleting plan:", error);
			alert(error.response?.data?.message || error.response?.data?.error || `Failed to delete plan.`);
		}
	};

	const Wrapper = embedded ? EmbeddedWrapper : PageWrapper;

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

	return (
		<Wrapper>
				{!embedded ? (
					<div>
						<h1 className="font-display text-2xl text-foreground">Ayurveda wellness</h1>
						<p className="text-sm text-muted-foreground">Personalized Prakriti profile and AI-generated diet plan.</p>
					</div>
				) : null}

				<div className="grid gap-4 sm:grid-cols-2">
					<StatusTile
						icon={Leaf}
						title={t("ayurvedaDashboard.statusTiles.prakritiAssessment", "Prakriti Assessment")}
						complete={Boolean(dosha)}
						statusText={dosha
							? (() => {
									const pKey = (dosha.primaryDosha || "").toUpperCase();
									const sKey = (dosha.secondaryDosha || "").toUpperCase();
									const pLabel = t(`doshaResults.profiles.${pKey}.title`, { defaultValue: dosha.primaryDosha });
									const sLabel = sKey ? t(`doshaResults.profiles.${sKey}.title`, { defaultValue: dosha.secondaryDosha }) : null;
									return sLabel ? `${pLabel} · ${sLabel}` : pLabel;
							  })()
							: t("ayurvedaDashboard.statusTiles.notCompletedYet", "Not completed yet")}
						actions={dosha
							? isDoctorView
								? [{ label: t("ayurvedaDashboard.statusTiles.viewResult", "View result"), variant: "outline", onClick: () => setOpenPanel("prakriti-view") }]
								: [
									{ label: t("ayurvedaDashboard.statusTiles.viewResult", "View result"), variant: "outline", onClick: () => setOpenPanel("prakriti-view") },
									{ label: t("ayurvedaDashboard.statusTiles.retake", "Retake"), variant: "outline", onClick: () => setOpenPanel("prakriti") },
								]
							: isDoctorView
								? []
								: [{ label: t("ayurvedaDashboard.statusTiles.fillAssessment", "Fill assessment"), variant: "default", onClick: () => setOpenPanel("prakriti") }]}
					/>
					<StatusTile
						icon={ClipboardEdit}
						title={t("ayurvedaDashboard.statusTiles.wellnessProfile", "Wellness Profile")}
						complete={profileFilled}
						statusText={profileFilled ? t("ayurvedaDashboard.statusTiles.filled", "Filled") : t("ayurvedaDashboard.statusTiles.notFilledYet", "Not filled yet")}
						actions={profileFilled
							? isDoctorView
								? [{ label: t("ayurvedaDashboard.statusTiles.viewDetails", "View details"), variant: "outline", onClick: () => setOpenPanel("profile-view") }]
								: [
									{ label: t("ayurvedaDashboard.statusTiles.viewDetails", "View details"), variant: "outline", onClick: () => setOpenPanel("profile-view") },
									{ label: t("ayurvedaDashboard.statusTiles.refill", "Refill"), variant: "outline", onClick: () => setOpenPanel("profile") },
								]
							: isDoctorView
								? []
								: [{ label: t("ayurvedaDashboard.statusTiles.fillProfile", "Fill profile"), variant: "default", onClick: () => setOpenPanel("profile") }]}
					/>
				</div>

				{/* Weekly meal planner / cooking instructions / foods to avoid / lifestyle
				    recommendations now live in the unified Prescription & Wellness page --
				    this dashboard is intake/management only (profile, Prakriti, generate/
				    regenerate/delete), so only the Overview summary stays here. */}
				<OverviewTab
					plan={plan}
					isStale={plan?.isStale}
					readOnly={readOnly}
					isDoctorView={isDoctorView}
					onRegenerate={handleGenerateClick}
					onDelete={handleDeletePlan}
					onGenerate={handleGenerateClick}
					generating={generating}
					missingPrereqs={[!dosha && "the Prakriti assessment", !profileFilled && "your wellness profile"].filter(Boolean)}
				/>

				{!isDoctorView ? (
					<>
						<Dialog open={openPanel === "prakriti"} onOpenChange={(open) => !open && setOpenPanel(null)}>
							<DialogContent className="max-w-2xl overflow-y-auto">
								<DialogTitle className="sr-only">Prakriti assessment</DialogTitle>
								<DoshaAssessmentQuiz embedded onDone={() => { setOpenPanel(null); fetchAll(); }} />
							</DialogContent>
						</Dialog>
						<Dialog open={openPanel === "profile"} onOpenChange={(open) => !open && setOpenPanel(null)}>
							<DialogContent className="max-w-2xl overflow-y-auto">
								<DialogTitle className="sr-only">Wellness profile</DialogTitle>
								<WellnessProfileForm embedded onSaved={() => { setOpenPanel(null); fetchAll(); }} />
							</DialogContent>
						</Dialog>
					</>
				) : null}

				<Dialog open={openPanel === "prakriti-view"} onOpenChange={(open) => !open && setOpenPanel(null)}>
					<DialogContent className="max-w-2xl overflow-y-auto">
						<DialogTitle className="font-display text-lg">
							{isDoctorView ? t("doshaResults.titleDoctor", "Patient's Prakriti assessment result") : t("doshaResults.titlePatient", "Your Prakriti assessment result")}
						</DialogTitle>
						{dosha ? (
							<div className="flex flex-col gap-6">
								<div className="flex flex-wrap gap-2">
									<Badge>{t("doshaResults.primary", { dosha: dosha.primaryDosha })}</Badge>
									{dosha.secondaryDosha ? <Badge variant="secondary">{t("doshaResults.secondary", { dosha: dosha.secondaryDosha })}</Badge> : null}
								</div>
								{dosha.doshaProfile?.primary ? (
									<DoshaDetail
										heading={
											dosha.secondaryDosha
												? t("doshaResults.primaryHeading", {
														title: t(`doshaResults.profiles.${dosha.primaryDosha}.title`, { defaultValue: dosha.doshaProfile.primary.title }),
														element: t(`doshaResults.profiles.${dosha.primaryDosha}.element`, { defaultValue: dosha.doshaProfile.primary.element }),
												  })
												: `${t(`doshaResults.profiles.${dosha.primaryDosha}.title`, { defaultValue: dosha.doshaProfile.primary.title })} (${t(`doshaResults.profiles.${dosha.primaryDosha}.element`, { defaultValue: dosha.doshaProfile.primary.element })})`
										}
										info={dosha.doshaProfile.primary}
										doshaKey={dosha.primaryDosha}
									/>
								) : null}
								{dosha.doshaProfile?.secondary ? (
									<DoshaDetail
										heading={t("doshaResults.secondaryHeading", {
											title: t(`doshaResults.profiles.${dosha.secondaryDosha}.title`, { defaultValue: dosha.doshaProfile.secondary.title }),
											element: t(`doshaResults.profiles.${dosha.secondaryDosha}.element`, { defaultValue: dosha.doshaProfile.secondary.element }),
										})}
										info={dosha.doshaProfile.secondary}
										doshaKey={dosha.secondaryDosha}
									/>
								) : null}
								{dosha.thirdDoshaStatus ? (
									<p className="text-sm text-muted-foreground">
										{isDoctorView
											? t("doshaResults.remainingDosha.doctor", {
													status: t(`doshaResults.thirdDoshaStatus.${dosha.thirdDoshaStatus}`, { defaultValue: dosha.thirdDoshaStatus.toLowerCase() }),
											  })
											: t("doshaResults.remainingDosha.patient", {
													status: t(`doshaResults.thirdDoshaStatus.${dosha.thirdDoshaStatus}`, { defaultValue: dosha.thirdDoshaStatus.toLowerCase() }),
											  })}
									</p>
								) : null}
							</div>
						) : null}
						{!isDoctorView ? (
							<Button
								size="sm"
								variant="outline"
								className="self-start"
								onClick={() => setOpenPanel("prakriti")}
							>
								{t("doshaResults.retake", "Retake assessment")}
							</Button>
						) : null}
					</DialogContent>
				</Dialog>
				<Dialog open={openPanel === "profile-view"} onOpenChange={(open) => !open && setOpenPanel(null)}>
					<DialogContent className="max-w-2xl overflow-y-auto">
						<div className="flex items-center justify-between gap-3 pr-6">
							<DialogTitle className="font-display text-lg">
								{isDoctorView ? t("wellnessProfile.titleDoctor", "Patient's wellness profile") : t("wellnessProfile.titlePatient", "Your wellness profile")}
							</DialogTitle>
							{!isDoctorView ? (
								<Button size="sm" onClick={() => setOpenPanel("profile")}>
									<ClipboardEdit size={14} /> {t("wellnessProfile.edit", "Edit")}
								</Button>
							) : null}
						</div>
						<WellnessProfileDetails profile={profile} />
					</DialogContent>
				</Dialog>
		</Wrapper>
	);
}

export default AyurvedaDashboard;
