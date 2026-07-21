import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthContext } from "../../../context/AuthContext";
import { BACKEND_URL } from "../../../config";

function Field({ label, htmlFor, children }) {
	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={htmlFor}>{label}</Label>
			{children}
		</div>
	);
}

function SelectField({ label, value, onChange, options }) {
	const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
	return (
		<Field label={label} htmlFor={id}>
			<Select value={value} onValueChange={(next) => onChange({ target: { value: next } })}>
				<SelectTrigger id={id}>
					<SelectValue placeholder="Select..." />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option} value={option}>
							{option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}

const traitOptions = {
	bodyBuild: ["Thin", "Well Built"],
	height: ["Small", "Medium", "Tall"],
	appearance: ["Prominent", "Normal"],
	skinTexture: ["Dry", "Oily", "Combination"],
	hairType: ["Thin", "Thick", "Curly"],
	voiceQuality: ["Soft", "Moderate", "Loud"],
	digestion: ["Regular", "Irregular", "Mixed"],
	bodyTemperature: ["Feels Cold Easily", "Feels Hot Easily"],
	thirstLevel: ["Frequent", "Normal", "Intense"],
	appetite: ["Strong", "Weak", "Irregular"],
	dietaryHabits: ["Heavy", "Medium", "Light"],
	decisionMakingAbility: ["Often Changes Decision", "Sometimes Changes Decision", "Rarely Changes Decision"],
	comprehension: ["Quick", "Delayed"],
	politeness: ["Polite/Humble", "Sometimes Polite", "Rarely Polite"],
	emotionalStability: ["Calm and composed", "Balanced", "Rarely Disturbed"],
};

const heightLabel = { Small: "Short", Medium: "Medium", Tall: "Tall" };

function PrakritiDetermination() {
	const navigate = useNavigate();
	const { auth } = useContext(AuthContext);
	const patientEmail = auth.user?.email;

	const [physicalTraits, setPhysicalTraits] = useState({
		bodyBuild: "",
		height: "",
		appearance: "",
		skinTexture: "",
		hairType: "",
		voiceQuality: "",
	});
	const [physiologicalTraits, setPhysiologicalTraits] = useState({
		digestion: "",
		bodyTemperature: "",
		thirstLevel: "",
		sleepingPattern: "",
		appetite: "",
		dietaryHabits: "",
	});
	const [psychologicalTraits, setPsychologicalTraits] = useState({
		decisionMakingAbility: "",
		comprehension: "",
	});
	const [behavioralTraits, setBehavioralTraits] = useState({
		politeness: "",
		emotionalStability: "",
	});
	const [isFormValid, setIsFormValid] = useState(false);

	useEffect(() => {
		const groups = [physicalTraits, physiologicalTraits, psychologicalTraits, behavioralTraits];
		setIsFormValid(groups.every((group) => Object.values(group).every((value) => value !== "")));
	}, [physicalTraits, physiologicalTraits, psychologicalTraits, behavioralTraits]);

	const handleSaveClick = async () => {
		if (!isFormValid) {
			alert("Please fill out all fields before saving.");
			return;
		}

		const prakritiData = {
			patientEmail,
			physicalTraits,
			physiologicalTraits,
			psychologicalTraits,
			behavioralTraits,
		};

		try {
			const response = await fetch(`${BACKEND_URL}/api/prakriti`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(prakritiData),
			});

			if (response.ok) {
				alert("Prakriti Determination saved successfully!");
				navigate("/patient-home");
			} else {
				const errorData = await response.json();
				alert(errorData.error || "Failed to save Prakriti Determination.");
			}
		} catch (error) {
			console.error("Error saving Prakriti Determination:", error);
			alert("An error occurred while saving. Please try again.");
		}
	};

	const handleSkipClick = () => navigate("/patient-home");

	return (
		<main className="bg-background">
			<div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
				<h1 className="font-display text-3xl leading-tight text-foreground sm:text-4xl">
					Prakriti Determination Form
				</h1>
				<p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
					Unlock personalized care. Complete this short assessment so we can match you with the
					doctor best suited to your needs.
				</p>

				<form className="mt-8 grid gap-5 sm:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Physical traits</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<SelectField
								label="Body build"
								value={physicalTraits.bodyBuild}
								onChange={(e) => setPhysicalTraits({ ...physicalTraits, bodyBuild: e.target.value })}
								options={traitOptions.bodyBuild}
							/>
							<SelectField
								label="Height"
								value={physicalTraits.height}
								onChange={(e) => setPhysicalTraits({ ...physicalTraits, height: e.target.value })}
								options={traitOptions.height}
							/>
							<SelectField
								label="Appearance (veins/tendons)"
								value={physicalTraits.appearance}
								onChange={(e) => setPhysicalTraits({ ...physicalTraits, appearance: e.target.value })}
								options={traitOptions.appearance}
							/>
							<SelectField
								label="Skin texture"
								value={physicalTraits.skinTexture}
								onChange={(e) => setPhysicalTraits({ ...physicalTraits, skinTexture: e.target.value })}
								options={traitOptions.skinTexture}
							/>
							<SelectField
								label="Hair type"
								value={physicalTraits.hairType}
								onChange={(e) => setPhysicalTraits({ ...physicalTraits, hairType: e.target.value })}
								options={traitOptions.hairType}
							/>
							<SelectField
								label="Voice quality"
								value={physicalTraits.voiceQuality}
								onChange={(e) => setPhysicalTraits({ ...physicalTraits, voiceQuality: e.target.value })}
								options={traitOptions.voiceQuality}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Physiological traits</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<SelectField
								label="Digestion"
								value={physiologicalTraits.digestion}
								onChange={(e) => setPhysiologicalTraits({ ...physiologicalTraits, digestion: e.target.value })}
								options={traitOptions.digestion}
							/>
							<SelectField
								label="Body temperature"
								value={physiologicalTraits.bodyTemperature}
								onChange={(e) => setPhysiologicalTraits({ ...physiologicalTraits, bodyTemperature: e.target.value })}
								options={traitOptions.bodyTemperature}
							/>
							<SelectField
								label="Thirst level"
								value={physiologicalTraits.thirstLevel}
								onChange={(e) => setPhysiologicalTraits({ ...physiologicalTraits, thirstLevel: e.target.value })}
								options={traitOptions.thirstLevel}
							/>
							<Field label="Sleeping pattern (hours per night)" htmlFor="sleeping-pattern">
								<Input
									id="sleeping-pattern"
									type="number"
									value={physiologicalTraits.sleepingPattern}
									onChange={(e) => setPhysiologicalTraits({ ...physiologicalTraits, sleepingPattern: e.target.value })}
									placeholder="e.g., 7"
									required
								/>
							</Field>
							<SelectField
								label="Appetite"
								value={physiologicalTraits.appetite}
								onChange={(e) => setPhysiologicalTraits({ ...physiologicalTraits, appetite: e.target.value })}
								options={traitOptions.appetite}
							/>
							<SelectField
								label="Dietary habits"
								value={physiologicalTraits.dietaryHabits}
								onChange={(e) => setPhysiologicalTraits({ ...physiologicalTraits, dietaryHabits: e.target.value })}
								options={traitOptions.dietaryHabits}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Psychological traits</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<SelectField
								label="Decision-making ability"
								value={psychologicalTraits.decisionMakingAbility}
								onChange={(e) => setPsychologicalTraits({ ...psychologicalTraits, decisionMakingAbility: e.target.value })}
								options={traitOptions.decisionMakingAbility}
							/>
							<SelectField
								label="Comprehension / grasping power"
								value={psychologicalTraits.comprehension}
								onChange={(e) => setPsychologicalTraits({ ...psychologicalTraits, comprehension: e.target.value })}
								options={traitOptions.comprehension}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Behavioral traits</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4">
							<SelectField
								label="Politeness"
								value={behavioralTraits.politeness}
								onChange={(e) => setBehavioralTraits({ ...behavioralTraits, politeness: e.target.value })}
								options={traitOptions.politeness}
							/>
							<SelectField
								label="Emotional stability"
								value={behavioralTraits.emotionalStability}
								onChange={(e) => setBehavioralTraits({ ...behavioralTraits, emotionalStability: e.target.value })}
								options={traitOptions.emotionalStability}
							/>
						</CardContent>
					</Card>

					<div className="flex items-center justify-between gap-3 sm:col-span-2">
						<Button type="button" variant="outline" onClick={handleSkipClick}>
							Skip
						</Button>
						<Button type="button" onClick={handleSaveClick} disabled={!isFormValid}>
							Save <ArrowRight className="size-4" aria-hidden="true" />
						</Button>
					</div>
				</form>
			</div>
		</main>
	);
}

export default PrakritiDetermination;
