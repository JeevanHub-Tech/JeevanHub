import { Fragment, useState } from "react";
import { Leaf, Mail, Phone } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const DOSHA_LABELS = {
	VATA: "Vata",
	PITTA: "Pitta",
	KAPHA: "Kapha",
	"VATA-PITTA": "Vata-Pitta",
	"PITTA-VATA": "Pitta-Vata",
	"VATA-KAPHA": "Vata-Kapha",
	"KAPHA-VATA": "Kapha-Vata",
	"PITTA-KAPHA": "Pitta-Kapha",
	"KAPHA-PITTA": "Kapha-Pitta",
	"TRIDOSHIC (VATA-PITTA-KAPHA)": "Tridoshic",
};

const getInitials = (name) => {
	if (!name) return "";
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase();
};

export function PatientHeader({ patient, prakritiDosha }) {
	const [showPhoto, setShowPhoto] = useState(false);

	if (!patient) return null;

	// A single compact meta line instead of a grid of padded boxes — small,
	// de-emphasized details shouldn't each claim their own card real estate.
	// Each part carries a title so hovering it reveals what the detail actually is.
	const metaParts = [
		patient.gender && patient.age
			? { text: `${patient.gender}, ${patient.age} yrs`, title: "Gender and age" }
			: patient.gender
				? { text: patient.gender, title: "Gender" }
				: patient.age
					? { text: `${patient.age} yrs`, title: "Age" }
					: null,
		patient.address || patient.zipCode ? { text: patient.address || patient.zipCode, title: "Address" } : null,
	].filter(Boolean);

	return (
		<>
			<Card className="p-4.5">
				<div className="flex items-center gap-5">
					{patient.profileImage ? (
						<button
							type="button"
							title="Patient's profile picture — click to enlarge"
							onClick={() => setShowPhoto(true)}
							className="shrink-0 cursor-pointer transition-transform hover:scale-105"
						>
							<Avatar className="size-14 border-2 border-border">
								<AvatarImage src={patient.profileImage} alt={patient.firstName} />
								<AvatarFallback>{getInitials(patient.firstName)}</AvatarFallback>
							</Avatar>
						</button>
					) : (
						<Avatar className="size-14 shrink-0 border-2 border-border" title="Patient's profile picture (not uploaded yet)">
							<AvatarFallback>{getInitials(patient.firstName)}</AvatarFallback>
						</Avatar>
					)}

					<div className="min-w-0 flex-1">
						<div className="mb-1 flex flex-wrap items-center gap-2.5">
							<h1 className="text-lg font-bold text-foreground">
								{patient.firstName} {patient.lastName}
							</h1>
							{prakritiDosha ? (
								<Badge
									variant="secondary"
									className="gap-1"
									title={`Prakriti (body constitution): ${DOSHA_LABELS[prakritiDosha] || prakritiDosha} — the patient's dominant dosha from their Prakriti assessment`}
								>
									<Leaf size={13} /> {DOSHA_LABELS[prakritiDosha] || prakritiDosha}
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="gap-1 text-muted-foreground"
									title="Prakriti (body constitution): the patient hasn't completed a Prakriti assessment yet"
								>
									<Leaf size={13} /> Not yet assessed
								</Badge>
							)}
						</div>

						<div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
							{metaParts.map((part, i) => (
								<Fragment key={i}>
									{i > 0 ? <span className="text-border">&middot;</span> : null}
									<span title={part.title}>{part.text}</span>
								</Fragment>
							))}
							{patient.email ? (
								<>
									<span className="text-border">&middot;</span>
									<span className="inline-flex items-center gap-1" title="Email address">
										<Mail size={12} className="shrink-0 text-muted-foreground" />
										{patient.email}
									</span>
								</>
							) : null}
							{patient.phone ? (
								<>
									<span className="text-border">&middot;</span>
									<span className="inline-flex items-center gap-1" title="Phone number">
										<Phone size={12} className="shrink-0 text-muted-foreground" />
										{patient.phone}
									</span>
								</>
							) : null}
						</div>
					</div>
				</div>
			</Card>

			<Dialog open={showPhoto && !!patient.profileImage} onOpenChange={setShowPhoto}>
				<DialogContent className="max-w-md">
					<div className="flex flex-col items-center gap-3">
						<img
							src={patient.profileImage}
							alt={patient.firstName}
							className="max-h-[65vh] max-w-full rounded-lg object-contain"
						/>
						<p className="font-bold text-foreground">
							{patient.firstName} {patient.lastName}
						</p>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
