import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AuthContext } from "../../../context/AuthContext";
import { BACKEND_URL } from "../../../config";

const API = BACKEND_URL || "http://localhost:8080";

const OPTIONS = [
	{ label: "Never", value: 0 },
	{ label: "Rarely", value: 1 },
	{ label: "Sometimes", value: 2 },
	{ label: "Often", value: 3 },
	{ label: "Always", value: 4 },
];

// One statement per dosha per parameter group, 4/3/3 split covering the
// full Physical / Mental & Behavioral / Lifestyle parameter list from spec
// (body frame, weight tendency, skin/hair, temperature, digestion, appetite,
// sleep; energy, learning/memory, stress response, emotional patterns,
// decision-making; activity preferences, food cravings, routine patterns).
const CATEGORIES = [
	{
		key: "physical",
		title: "Physical Characteristics",
		questions: [
			{ id: "ph_v1", doshaType: "vata", text: "My body frame is thin or light, and I have a hard time gaining weight." },
			{ id: "ph_v2", doshaType: "vata", text: "My skin and hair tend to be dry or rough." },
			{ id: "ph_v3", doshaType: "vata", text: "My hands/feet are often cold, and my appetite/digestion vary day to day (bloating or gas)." },
			{ id: "ph_v4", doshaType: "vata", text: "My sleep is light and easily disturbed." },
			{ id: "ph_p1", doshaType: "pitta", text: "I have a medium, athletic build." },
			{ id: "ph_p2", doshaType: "pitta", text: "My skin is warm or sensitive (prone to rashes), or my hair is fine / greys early." },
			{ id: "ph_p3", doshaType: "pitta", text: "I feel warm and sweat easily, with a sharp appetite and strong digestion." },
			{ id: "ph_p4", doshaType: "pitta", text: "I sleep moderately well but wake if I get hungry or overheated." },
			{ id: "ph_k1", doshaType: "kapha", text: "I have a solid, well-built frame and gain weight easily." },
			{ id: "ph_k2", doshaType: "kapha", text: "My skin is smooth and slightly oily; my hair is thick." },
			{ id: "ph_k3", doshaType: "kapha", text: "I stay warm easily, and my digestion is slow but steady with infrequent hunger." },
			{ id: "ph_k4", doshaType: "kapha", text: "I sleep deeply for long hours and find it hard to wake up early." },
		],
	},
	{
		key: "mental_behavioral",
		title: "Mental and Behavioral Characteristics",
		questions: [
			{ id: "m_v1", doshaType: "vata", text: "My energy comes in bursts, and I learn quickly but forget just as quickly." },
			{ id: "m_v2", doshaType: "vata", text: "Under stress I feel anxious, worried, or overwhelmed, and my mood shifts often." },
			{ id: "m_v3", doshaType: "vata", text: "I change my mind frequently and find it hard to stick to one decision." },
			{ id: "m_p1", doshaType: "pitta", text: "I have sharp, focused energy and a clear, analytical memory." },
			{ id: "m_p2", doshaType: "pitta", text: "Under stress I become irritable, impatient, or critical." },
			{ id: "m_p3", doshaType: "pitta", text: "I make decisions quickly and confidently, and prefer to lead." },
			{ id: "m_k1", doshaType: "kapha", text: "My energy is steady and enduring; I learn slowly but retain information long-term." },
			{ id: "m_k2", doshaType: "kapha", text: "Under stress I withdraw, feel low-energy, or become emotionally attached." },
			{ id: "m_k3", doshaType: "kapha", text: "I take my time deciding but rarely change my mind once I do." },
		],
	},
	{
		key: "lifestyle",
		title: "Lifestyle Indicators",
		questions: [
			{ id: "l_v1", doshaType: "vata", text: "I enjoy varied, spontaneous activity and get bored with repetition." },
			{ id: "l_v2", doshaType: "vata", text: "I crave warm, sweet, or oily foods, especially when stressed." },
			{ id: "l_v3", doshaType: "vata", text: "My daily routine tends to be irregular -- meal and sleep times vary." },
			{ id: "l_p1", doshaType: "pitta", text: "I enjoy structured, goal-oriented, or competitive activity." },
			{ id: "l_p2", doshaType: "pitta", text: "I crave spicy, cold, or intensely flavored foods." },
			{ id: "l_p3", doshaType: "pitta", text: "I keep a fairly disciplined, punctual daily routine." },
			{ id: "l_k1", doshaType: "kapha", text: "I prefer calm, steady, low-intensity activity and need motivation to start exercising." },
			{ id: "l_k2", doshaType: "kapha", text: "I crave sweet, heavy, or rich comfort foods." },
			{ id: "l_k3", doshaType: "kapha", text: "I stick to the same daily routine for long periods and resist change." },
		],
	},
];

// Hoisted to module scope so these keep a stable component identity across
// re-renders -- see the identical fix/comment in AyurvedaDashboard.jsx for
// why defining these inside render was the root cause of the modal
// focus-loss bug.
function EmbeddedWrapper({ children }) {
	return <div className="flex flex-col gap-6">{children}</div>;
}
function PageWrapper({ children }) {
	return (
		<main className="bg-background">
			<div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">{children}</div>
		</main>
	);
}

function DoshaAssessmentQuiz({ embedded = false, onDone } = {}) {
	const { auth, loading: authLoading } = useContext(AuthContext);
	const navigate = useNavigate();
	const [step, setStep] = useState(0);
	const [answers, setAnswers] = useState({});
	const [result, setResult] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [loadingExisting, setLoadingExisting] = useState(!embedded);

	useEffect(() => {
		if (embedded) return;
		if (authLoading) return;
		if (!auth.token) {
			navigate("/signin");
			return;
		}
		(async () => {
			try {
				const res = await axios.get(`${API}/api/ayurveda/dosha-assessment`, {
					headers: { Authorization: `Bearer ${auth.token}` },
				});
				if (res.data?.isComplete) setResult(res.data);
			} catch (error) {
				console.error("Error fetching existing assessment:", error);
			} finally {
				setLoadingExisting(false);
			}
		})();
	}, [auth, authLoading, navigate, embedded]);

	const category = CATEGORIES[step];
	const isLastStep = step === CATEGORIES.length - 1;
	const currentAnswered = category?.questions.every((q) => answers[q.id] !== undefined);

	const handleAnswer = (questionId, value) => {
		setAnswers((a) => ({ ...a, [questionId]: value }));
	};

	const handleSubmit = async () => {
		setSubmitting(true);
		try {
			const responses = CATEGORIES.flatMap((cat) =>
				cat.questions.map((q) => ({
					questionId: q.id,
					category: cat.key,
					doshaType: q.doshaType,
					score: answers[q.id] ?? 0,
				}))
			);
			const res = await axios.post(
				`${API}/api/ayurveda/dosha-assessment`,
				{ responses },
				{ headers: { Authorization: `Bearer ${auth.token}` } }
			);
			setResult(res.data.assessment);
		} catch (error) {
			console.error("Error submitting assessment:", error);
			alert(error.response?.data?.error || "Failed to submit assessment.");
		} finally {
			setSubmitting(false);
		}
	};

	const Wrapper = embedded ? EmbeddedWrapper : PageWrapper;

	if (loadingExisting) {
		return <Wrapper><p className="text-center text-muted-foreground">Loading…</p></Wrapper>;
	}

	if (result) {
		return (
			<Wrapper>
				<div className="flex items-center justify-between gap-3">
					{!embedded ? <BackButton to="/ayurveda-wellness" /> : <div />}
					<Button variant="outline" size="sm" onClick={() => { setResult(null); setStep(0); setAnswers({}); }}>
						Retake assessment
					</Button>
				</div>
				<Card>
						<CardHeader>
							<CardTitle className="font-display text-xl">Your Prakriti assessment result</CardTitle>
							<CardDescription>This reflects your Ayurvedic body constitution.</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<div className="flex flex-wrap gap-6 text-sm">
								<div>
									<p className="text-muted-foreground">Primary Dosha</p>
									<p className="font-display text-lg text-foreground">{result.primaryDosha}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Secondary Dosha</p>
									<p className="font-display text-lg text-foreground">{result.secondaryDosha || "None"}</p>
								</div>
								<div>
									<p className="text-muted-foreground">Third dosha status</p>
									<p className="font-display text-lg text-foreground">{result.thirdDoshaStatus}</p>
								</div>
							</div>
							{result.doshaProfile?.primary ? (
								<div className="flex flex-col gap-4 rounded-(--jh-radius-md) bg-secondary/60 p-4 text-sm">
									<div>
										<p className="font-display text-base text-foreground">
											{result.doshaProfile.primary.title}
											{result.doshaProfile.secondary ? ` – ${result.doshaProfile.secondary.title}` : ""} constitution
										</p>
										<p className="mt-1 text-muted-foreground">{result.doshaProfile.primary.explanation}</p>
									</div>
									<div>
										<p className="font-medium text-foreground">Your characteristics</p>
										<ul className="mt-1 list-disc pl-5 text-muted-foreground">
											{result.doshaProfile.primary.characteristics.map((c, i) => <li key={i}>{c}</li>)}
										</ul>
									</div>
									<div>
										<p className="font-medium text-foreground">Possible imbalance areas</p>
										<ul className="mt-1 list-disc pl-5 text-muted-foreground">
											{result.doshaProfile.primary.possibleImbalances.map((c, i) => <li key={i}>{c}</li>)}
										</ul>
									</div>
									<div>
										<p className="font-medium text-foreground">Lifestyle recommendations</p>
										<ul className="mt-1 list-disc pl-5 text-muted-foreground">
											{result.doshaProfile.primary.lifestyleRecommendations.map((c, i) => <li key={i}>{c}</li>)}
										</ul>
									</div>
								</div>
							) : null}

							<div className="flex gap-2">
								<Button onClick={() => (embedded ? onDone?.() : navigate("/ayurveda-wellness"))}>
									{embedded ? "Done" : "Continue to dashboard"}
								</Button>
								<Button variant="outline" onClick={() => { setResult(null); setStep(0); setAnswers({}); }}>
									Retake assessment
								</Button>
							</div>
						</CardContent>
					</Card>
			</Wrapper>
		);
	}

	return (
		<Wrapper>
			{!embedded ? <BackButton to="/ayurveda-wellness" /> : null}
			<div>
				<h1 className="font-display text-2xl text-foreground">Prakriti (Dosha) assessment</h1>
				<p className="text-sm text-muted-foreground">
					Step {step + 1} of {CATEGORIES.length}: {category.title}
				</p>
				</div>

				<Card>
					<CardContent className="flex flex-col gap-6 pt-6">
						{category.questions.map((q) => (
							<div key={q.id} className="flex flex-col gap-2">
								<p className="text-sm font-medium text-foreground">{q.text}</p>
								<div className="flex flex-wrap gap-2">
									{OPTIONS.map((opt) => (
										<button
											key={opt.value}
											type="button"
											onClick={() => handleAnswer(q.id, opt.value)}
											className={cn(
												"rounded-(--jh-radius-pill) border px-3 py-1.5 text-xs font-medium transition-colors",
												answers[q.id] === opt.value
													? "border-primary bg-primary text-primary-foreground"
													: "border-border bg-transparent text-muted-foreground hover:border-primary/50"
											)}
										>
											{opt.label}
										</button>
									))}
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				<div className="flex justify-between">
					<Button
						variant="outline"
						onClick={() => setStep((s) => Math.max(0, s - 1))}
						disabled={step === 0}
					>
						<ArrowLeft size={16} /> Back
					</Button>
					{isLastStep ? (
						<Button onClick={handleSubmit} disabled={!currentAnswered || submitting}>
							{submitting ? "Submitting…" : "Submit assessment"}
						</Button>
					) : (
						<Button onClick={() => setStep((s) => s + 1)} disabled={!currentAnswered}>
							Continue <ArrowRight size={16} />
						</Button>
					)}
				</div>
		</Wrapper>
	);
}

export default DoshaAssessmentQuiz;
