import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Leaf } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AuthContext } from "../../../context/AuthContext";
import { BACKEND_URL } from "../../../config";
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

	if (!dosha) {
		return (
			<Wrapper>
				<EmptyState
					icon={Leaf}
					title="No Prakriti assessment yet"
					description={isDoctorView
						? "This patient hasn't completed the Prakriti (dosha) assessment yet."
						: "Complete the Prakriti (dosha) assessment to unlock your personalized Ayurvedic diet plan."}
					action={!isDoctorView ? <Button onClick={() => navigate("/ayurveda-wellness/assessment")}>Take assessment</Button> : null}
				/>
			</Wrapper>
		);
	}

	const scores = dosha.calculatedScores || {};
	const bd = profile?.basicDetails || {};
	const bmi = computeBmi(bd.heightCm, bd.weightKg);
	const conditions = profile?.healthInfo?.conditions || {};
	const conditionsList = [
		conditions.diabetes && "Diabetes",
		conditions.highBP && "High blood pressure",
		conditions.obesityFocus && "Weight management",
		...(conditions.other || []),
	].filter(Boolean);

	return (
		<Wrapper>
				<div className="flex items-center justify-between gap-3">
					<div>
						<h1 className="font-display text-2xl text-foreground">Ayurveda wellness</h1>
						<p className="text-sm text-muted-foreground">Personalized Prakriti profile and AI-generated diet plan.</p>
					</div>
					{!isDoctorView ? (
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={() => navigate("/ayurveda-wellness/profile")}>Edit wellness profile</Button>
							<Button variant="outline" size="sm" onClick={() => navigate("/ayurveda-wellness/assessment")}>Retake assessment</Button>
						</div>
					) : null}
				</div>

				<div className="grid gap-6 lg:grid-cols-2">
					<Card>
						<CardHeader><CardTitle className="font-display text-lg">Ayurveda profile</CardTitle></CardHeader>
						<CardContent className="flex flex-col gap-4">
							<div className="flex flex-wrap gap-2">
								<Badge>Primary: {dosha.primaryDosha}</Badge>
								{dosha.secondaryDosha ? <Badge variant="secondary">Secondary: {dosha.secondaryDosha}</Badge> : null}
							</div>
							<div className="flex flex-col gap-2">
								{["vata", "pitta", "kapha"].map((d) => (
									<div key={d} className="flex items-center gap-3">
										<span className="w-14 text-sm capitalize text-muted-foreground">{d}</span>
										<div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
											<div className="h-full rounded-full bg-primary" style={{ width: `${scores[d] || 0}%` }} />
										</div>
										<span className="w-12 text-right text-sm text-foreground">{(scores[d] || 0).toFixed(0)}%</span>
									</div>
								))}
							</div>
							{dosha.doshaProfile?.primary ? (
								<div className="text-sm text-muted-foreground">
									<p>{dosha.doshaProfile.primary.explanation}</p>
								</div>
							) : null}
						</CardContent>
					</Card>

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
				</div>

				<Tabs defaultValue="overview">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="weekly">Weekly Meal Planner</TabsTrigger>
						<TabsTrigger value="cooking">Cooking Instructions</TabsTrigger>
						<TabsTrigger value="avoid">Foods To Avoid</TabsTrigger>
						<TabsTrigger value="lifestyle">Lifestyle Recommendations</TabsTrigger>
					</TabsList>
					<TabsContent value="overview">
						<OverviewTab plan={plan} isStale={plan?.isStale} onGenerate={handleGenerate} generating={generating} readOnly={readOnly} />
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
		</Wrapper>
	);
}

export default AyurvedaDashboard;
