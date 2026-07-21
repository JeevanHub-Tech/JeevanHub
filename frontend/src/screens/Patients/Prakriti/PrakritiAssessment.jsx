import { Fragment, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";

const UI_TEXT = {
	resultsTitle: { en: "Your Prakriti Assessment Result", hi: "आपका प्रकृति मूल्यांकन परिणाम" },
	resultsSub: { en: "This is your birth constitution (Prakriti).", hi: "यह आपकी जन्म प्रकृति (Birth Constitution) है।" },
	btnRetake: { en: "Retake Assessment", hi: "फिर से मूल्यांकन करें" },
	btnBack: { en: "Back", hi: "पीछे" },
	btnContinue: { en: "Continue", hi: "आगे बढ़ें" },
	btnSubmit: { en: "Submit Assessment", hi: "मूल्यांकन जमा करें" },
};

const OPTIONS = [
	{ label: { en: "Never", hi: "कभी नहीं" }, value: 0 },
	{ label: { en: "Rarely", hi: "शायद ही कभी" }, value: 1 },
	{ label: { en: "Sometimes", hi: "कभी-कभी" }, value: 2 },
	{ label: { en: "Often", hi: "अक्सर" }, value: 3 },
	{ label: { en: "Always", hi: "हमेशा" }, value: 4 },
];

// Each dosha maps to one of the brand's three accent colors — Kapha (earth
// & water) to the primary olive, Pitta (fire/digestion) to turmeric, Vata
// (air/movement) to bark brown — instead of introducing unrelated hues.
const DOSHA_DATA = {
	kapha: {
		title: "Kapha",
		colorVar: "--jh-olive-leaf",
		description: {
			en: "Kapha represents stability, strength, and structure.",
			hi: "कफ स्थिरता, शक्ति और शरीर की संरचना का प्रतिनिधित्व करता है।",
		},
		questions: [
			{ id: "k1", category: { en: "Body (Sharira)", hi: "शरीर" }, text: { en: "My body is broad and well built.", hi: "मेरा शरीर चौड़ा और सुगठित है।" } },
			{ id: "k2", category: { en: "Body (Sharira)", hi: "शरीर" }, text: { en: "I gain weight easily even with small food intake.", hi: "कम खाना खाने पर भी मेरा वजन आसानी से बढ़ जाता है।" } },
			{ id: "k3", category: { en: "Body (Sharira)", hi: "शरीर" }, text: { en: "My skin feels soft, thick and slightly oily.", hi: "मेरी त्वचा मुलायम, मोटी और थोड़ी तैलीय है।" } },
			{ id: "k4", category: { en: "Body (Sharira)", hi: "शरीर" }, text: { en: "My hair is thick, smooth and dense.", hi: "मेरे बाल घने, चिकने और मोटे हैं।" } },
			{ id: "k5", category: { en: "Body (Sharira)", hi: "शरीर" }, text: { en: "I have good stamina and endurance.", hi: "मेरे अंदर अच्छी सहनशक्ति (stamina) है।" } },
			{ id: "k6", category: { en: "Metabolism", hi: "चयापचय" }, text: { en: "My digestion is slow but stable.", hi: "मेरा पाचन धीमा लेकिन स्थिर है।" } },
			{ id: "k7", category: { en: "Metabolism", hi: "चयापचय" }, text: { en: "I do not feel hunger frequently.", hi: "मुझे बार-बार भूख नहीं लगती है।" } },
			{ id: "k8", category: { en: "Metabolism", hi: "चयापचय" }, text: { en: "I prefer sweet, heavy and oily foods.", hi: "मुझे मीठा, भारी और तैलीय भोजन पसंद है।" } },
			{ id: "k9", category: { en: "Mind", hi: "मन" }, text: { en: "I am calm and emotionally stable.", hi: "मैं शांत और भावनात्मक रूप से स्थिर हूँ।" } },
			{ id: "k10", category: { en: "Mind", hi: "मन" }, text: { en: "I forgive easily and avoid conflicts.", hi: "मैं आसानी से क्षमा कर देता हूँ और विवादों से बचता हूँ।" } },
			{ id: "k11", category: { en: "Mind", hi: "मन" }, text: { en: "I sleep deeply and for long hours.", hi: "मैं गहरी और लंबी नींद लेता हूँ।" } },
			{ id: "k12", category: { en: "Mind", hi: "मन" }, text: { en: "I dislike physical exertion.", hi: "मुझे शारीरिक मेहनत करना ज्यादा पसंद नहीं है।" } },
		],
	},
	pitta: {
		title: "Pitta",
		colorVar: "--jh-turmeric-gold",
		description: {
			en: "Pitta represents digestion, metabolism, and energy production.",
			hi: "पित्त पाचन, चयापचय (metabolism) और ऊर्जा उत्पादन का प्रतिनिधित्व करता है।",
		},
		questions: [
			{ id: "p1", category: { en: "Body & Heat", hi: "शरीर और ताप" }, text: { en: "My body is medium build.", hi: "मेरा शरीर मध्यम आकार का है।" } },
			{ id: "p2", category: { en: "Body & Heat", hi: "शरीर और ताप" }, text: { en: "My body feels warm most of the time.", hi: "मेरा शरीर ज्यादातर समय गर्म रहता है।" } },
			{ id: "p3", category: { en: "Body & Heat", hi: "शरीर और ताप" }, text: { en: "I sweat easily.", hi: "मुझे आसानी से पसीना आता है।" } },
			{ id: "p4", category: { en: "Body & Heat", hi: "शरीर और ताप" }, text: { en: "My skin is sensitive or prone to rashes.", hi: "मेरी त्वचा संवेदनशील है या चकत्ते (rashes) जल्दी होते हैं।" } },
			{ id: "p5", category: { en: "Body & Heat", hi: "शरीर और ताप" }, text: { en: "I feel very hungry at regular intervals.", hi: "मुझे नियमित अंतराल पर बहुत तेज भूख लगती है।" } },
			{ id: "p6", category: { en: "Digestion", hi: "पाचन" }, text: { en: "I cannot tolerate skipping meals.", hi: "मैं भोजन छोड़ना (skip करना) बर्दाश्त नहीं कर सकता।" } },
			{ id: "p7", category: { en: "Digestion", hi: "पाचन" }, text: { en: "I prefer cold food and drinks.", hi: "मुझे ठंडा भोजन और पेय पसंद हैं।" } },
			{ id: "p8", category: { en: "Digestion", hi: "पाचन" }, text: { en: "I dislike hot weather.", hi: "मुझे गर्म मौसम पसंद नहीं है।" } },
			{ id: "p9", category: { en: "Mind", hi: "मन" }, text: { en: "I am ambitious and competitive.", hi: "मैं महत्वाकांक्षी और प्रतिस्पर्धी (competitive) हूँ।" } },
			{ id: "p10", category: { en: "Mind", hi: "मन" }, text: { en: "I get irritated easily.", hi: "मैं आसानी से चिड़चिड़ा हो जाता हूँ।" } },
			{ id: "p11", category: { en: "Mind", hi: "मन" }, text: { en: "I speak directly and confidently.", hi: "मैं स्पष्ट और आत्मविश्वास के साथ बोलता हूँ।" } },
			{ id: "p12", category: { en: "Mind", hi: "मन" }, text: { en: "I prefer leadership roles.", hi: "मुझे नेतृत्व (leadership) की भूमिकाएं पसंद हैं।" } },
		],
	},
	vata: {
		title: "Vata",
		colorVar: "--jh-bark-brown",
		description: {
			en: "Vata represents movement, breathing, and the nervous system.",
			hi: "वात शरीर में गति, श्वास और तंत्रिका तंत्र (nervous system) का प्रतिनिधित्व करता है।",
		},
		questions: [
			{ id: "v1", category: { en: "Body (Sharira)", hi: "शरीर" }, text: { en: "My body frame is thin or light.", hi: "मेरे शरीर का ढांचा पतला या हल्का है।" } },
			{ id: "v2", category: { en: "Body (Sharira)", hi: "शरीर" }, text: { en: "I lose weight easily.", hi: "मेरा वजन आसानी से कम हो जाता है।" } },
			{ id: "v3", category: { en: "Body (Sharira)", hi: "शरीर" }, text: { en: "My skin is dry or rough.", hi: "मेरी त्वचा रूखी या खुरदरी है।" } },
			{ id: "v4", category: { en: "Body (Sharira)", hi: "शरीर" }, text: { en: "My hair is dry or frizzy.", hi: "मेरे बाल रूखे या उलझे हुए हैं।" } },
			{ id: "v5", category: { en: "Body (Sharira)", hi: "शरीर" }, text: { en: "My hands and feet are usually cold.", hi: "मेरे हाथ और पैर आमतौर पर ठंडे रहते हैं।" } },
			{ id: "v6", category: { en: "Digestion", hi: "पाचन" }, text: { en: "My appetite changes frequently.", hi: "मेरी भूख बार-बार बदलती रहती है।" } },
			{ id: "v7", category: { en: "Digestion", hi: "पाचन" }, text: { en: "I experience bloating or gas.", hi: "मुझे पेट फूलने (bloating) या गैस की समस्या होती है।" } },
			{ id: "v8", category: { en: "Digestion", hi: "पाचन" }, text: { en: "My sleep is light or disturbed.", hi: "मेरी नींद कच्ची है या बार-बार टूटती है।" } },
			{ id: "v9", category: { en: "Mind", hi: "मन" }, text: { en: "I learn quickly but forget easily.", hi: "मैं जल्दी सीखता हूँ लेकिन आसानी से भूल भी जाता हूँ।" } },
			{ id: "v10", category: { en: "Mind", hi: "मन" }, text: { en: "I worry easily.", hi: "मैं आसानी से चिंतित हो जाता हूँ।" } },
			{ id: "v11", category: { en: "Mind", hi: "मन" }, text: { en: "My mood changes quickly.", hi: "मेरा मूड बहुत जल्दी बदलता है।" } },
			{ id: "v12", category: { en: "Mind", hi: "मन" }, text: { en: "I move or talk fast.", hi: "मैं तेजी से चलता या बोलता हूँ।" } },
		],
	},
};

const stepsKeys = ["kapha", "pitta", "vata"];

function PrakritiAssessment() {
	const location = useLocation();
	const [lang, setLang] = useState("en");
	const [step, setStep] = useState(0);
	const [answers, setAnswers] = useState({});
	const [results, setResults] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const currentDoshaKey = stepsKeys[step];
	const currentDosha = DOSHA_DATA[currentDoshaKey];

	const getAuthData = () => {
		const token = localStorage.getItem("token");
		if (!token) return null;
		try {
			const decoded = jwtDecode(token);
			return { token, userId: decoded.id, email: decoded.email };
		} catch {
			return null;
		}
	};

	useEffect(() => {
		if (location.state?.viewResult) fetchExistingResult();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.state]);

	const fetchExistingResult = async () => {
		const auth = getAuthData();
		if (!auth) return;

		try {
			const response = await authFetch(`${BACKEND_URL}/api/prakriti/assessment/getall`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
				body: JSON.stringify({ patientEmail: auth.email }),
			});

			if (response.ok) {
				const data = await response.json();
				if (data?.calculatedScores) {
					const percentages = data.calculatedScores;
					const sorted = Object.entries(percentages).sort((a, b) => b[1] - a[1]);
					setResults({ percentages, prakritiType: data.dominantDosha, sorted });
					setStep(3);
				}
			}
		} catch (error) {
			console.error("Error fetching existing result:", error);
		}
	};

	const submitToBackend = async (calculatedResults) => {
		const auth = getAuthData();
		if (!auth) return alert("Please log in to save your results.");

		setIsSubmitting(true);
		try {
			const response = await authFetch(`${BACKEND_URL}/api/prakriti/assessment`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
				body: JSON.stringify({ answers, results: calculatedResults }),
			});

			if (response.ok) alert("Assessment saved successfully!");
		} catch (error) {
			console.error("Failed to save:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAnswer = (questionId, value) => {
		setAnswers((prev) => ({ ...prev, [questionId]: value }));
	};

	const calculateResults = () => {
		const scores = { kapha: 0, pitta: 0, vata: 0 };
		const maxScorePerDosha = 12 * 4;

		Object.keys(answers).forEach((key) => {
			if (key.startsWith("k")) scores.kapha += answers[key];
			if (key.startsWith("p")) scores.pitta += answers[key];
			if (key.startsWith("v")) scores.vata += answers[key];
		});

		const percentages = {
			kapha: Math.round((scores.kapha / maxScorePerDosha) * 100),
			pitta: Math.round((scores.pitta / maxScorePerDosha) * 100),
			vata: Math.round((scores.vata / maxScorePerDosha) * 100),
		};

		const sorted = Object.entries(percentages).sort((a, b) => b[1] - a[1]);
		const [primary, secondary, tertiary] = sorted;

		let prakritiType = primary[0];
		if (primary[1] - secondary[1] <= 10) {
			prakritiType = `${primary[0]}-${secondary[0]}`;
			if (primary[1] - tertiary[1] <= 10) prakritiType = "Tridoshic (Vata-Pitta-Kapha)";
		}

		const finalResults = { percentages, prakritiType: prakritiType.toUpperCase(), sorted };
		setResults(finalResults);
		setStep(3);
		submitToBackend(finalResults);
	};

	const handleNext = () => {
		window.scrollTo(0, 0);
		if (step < 2) setStep(step + 1);
		else calculateResults();
	};

	const handleBack = () => {
		window.scrollTo(0, 0);
		if (step > 0) setStep(step - 1);
	};

	if (step === 3 && results) {
		return (
			<main className="bg-background pt-20 lg:pt-28">
				<div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
					<h2 className="font-display text-3xl text-foreground">{UI_TEXT.resultsTitle[lang]}</h2>

					<div className="mt-6 rounded-(--jh-radius-lg) bg-card p-6 text-center shadow-(--jh-shadow-card)">
						<h3 className="font-display text-2xl text-primary">{results.prakritiType}</h3>
						<p className="mt-1 text-sm text-muted-foreground">{UI_TEXT.resultsSub[lang]}</p>
					</div>

					<div className="mt-6 flex flex-col gap-4">
						{results.sorted.map(([dosha, pct]) => (
							<div key={dosha} className="flex items-center gap-3">
								<span className="w-16 shrink-0 text-sm font-semibold text-foreground">{dosha.toUpperCase()}</span>
								<div className="h-3 flex-1 overflow-hidden rounded-(--jh-radius-pill) bg-muted">
									<div
										className="h-full rounded-(--jh-radius-pill) transition-[width] duration-700 ease-[var(--jh-ease-organic)]"
										style={{ width: `${pct}%`, backgroundColor: `var(${DOSHA_DATA[dosha].colorVar})` }}
									/>
								</div>
								<span className="w-10 shrink-0 text-right text-sm text-muted-foreground">{pct}%</span>
							</div>
						))}
					</div>

					<Button
						onClick={() => {
							setResults(null);
							setStep(0);
						}}
						className="mt-8 w-full sm:w-auto"
					>
						<RotateCcw className="size-4" aria-hidden="true" />
						{UI_TEXT.btnRetake[lang]}
					</Button>
				</div>
			</main>
		);
	}

	return (
		<main className="bg-background pt-20 lg:pt-28">
			<div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
				<div className="flex justify-end gap-1 rounded-(--jh-radius-pill) bg-secondary p-1" role="group" aria-label="Language">
					{["en", "hi"].map((code) => (
						<button
							key={code}
							type="button"
							onClick={() => setLang(code)}
							aria-pressed={lang === code}
							className={cn(
								"rounded-(--jh-radius-pill) px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
								lang === code ? "bg-card text-primary shadow-(--jh-shadow-rest)" : "text-muted-foreground hover:text-foreground",
							)}
						>
							{code === "en" ? "English" : "हिंदी"}
						</button>
					))}
				</div>

				<div className="mt-6 flex items-center justify-center gap-2" aria-label="Assessment progress">
					{stepsKeys.map((key, index) => (
						<Fragment key={key}>
							<div
								className={cn(
									"flex h-9 items-center rounded-(--jh-radius-pill) border px-3 text-xs font-semibold transition-colors",
									index <= step ? "text-foreground" : "border-border text-muted-foreground",
								)}
								style={index <= step ? { borderColor: `var(${DOSHA_DATA[key].colorVar})`, color: `var(${DOSHA_DATA[key].colorVar})` } : undefined}
							>
								{DOSHA_DATA[key].title}
							</div>
							{index < 2 ? (
								<div className={cn("h-0.5 w-8 rounded-full transition-colors", index < step ? "bg-primary" : "bg-border")} aria-hidden="true" />
							) : null}
						</Fragment>
					))}
				</div>

				<div
					className="mt-6 rounded-(--jh-radius-md) px-4 py-3 text-sm font-medium"
					style={{ backgroundColor: `color-mix(in srgb, var(${currentDosha.colorVar}) 14%, transparent)`, color: `var(${currentDosha.colorVar})` }}
				>
					{currentDosha.description[lang]}
				</div>

				<div className="mt-6 flex flex-col gap-4">
					{currentDosha.questions.map((q) => (
						<fieldset key={q.id} className="rounded-(--jh-radius-lg) bg-card p-4 shadow-(--jh-shadow-rest) sm:p-5">
							<legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								{q.category[lang]}
							</legend>
							<p className="text-sm font-medium text-foreground sm:text-base">{q.text[lang]}</p>

							<div className="mt-3 flex flex-wrap gap-2 sm:gap-3">
								{OPTIONS.map((opt) => {
									const checked = answers[q.id] === opt.value;
									return (
										<label
											key={`${q.id}-${opt.value}`}
											className={cn(
												"flex cursor-pointer items-center gap-2 rounded-(--jh-radius-pill) border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
												checked ? "border-transparent text-white" : "border-border text-muted-foreground hover:border-ring",
											)}
											style={checked ? { backgroundColor: `var(${currentDosha.colorVar})` } : undefined}
										>
											<input
												type="radio"
												name={`question-${q.id}`}
												value={opt.value}
												checked={checked}
												onChange={() => handleAnswer(q.id, opt.value)}
												className="sr-only"
											/>
											{opt.label[lang]}
										</label>
									);
								})}
							</div>
						</fieldset>
					))}
				</div>

				<div className="mt-8 flex items-center justify-between gap-3">
					<Button type="button" variant="outline" onClick={handleBack} disabled={step === 0}>
						<ArrowLeft className="size-4" aria-hidden="true" />
						{UI_TEXT.btnBack[lang]}
					</Button>
					<Button type="button" onClick={handleNext} loading={isSubmitting} style={{ backgroundColor: `var(${currentDosha.colorVar})` }}>
						{step === 2 ? UI_TEXT.btnSubmit[lang] : UI_TEXT.btnContinue[lang]}
						<ArrowRight className="size-4" aria-hidden="true" />
					</Button>
				</div>
			</div>
		</main>
	);
}

export default PrakritiAssessment;
