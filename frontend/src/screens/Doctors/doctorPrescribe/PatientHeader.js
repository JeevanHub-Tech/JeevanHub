import React, { useState } from 'react';
import { Leaf, Mail, Phone, X } from 'lucide-react';
import './PatientHeader.css';

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
	"TRIDOSHIC (VATA-PITTA-KAPHA)": "Tridoshic"
};

// Helper function to calculate initials for the avatar fallback
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
			? { text: `${patient.gender}, ${patient.age} yrs`, title: 'Gender and age' }
			: (patient.gender ? { text: patient.gender, title: 'Gender' } : (patient.age ? { text: `${patient.age} yrs`, title: 'Age' } : null)),
		(patient.address || patient.zipCode) ? { text: patient.address || patient.zipCode, title: 'Address' } : null
	].filter(Boolean);

	return (
		<>
		<div className="patient-header-cards">
			<div className="patient-header-contents">

				{/* Avatar — clickable to view full-size when the patient has a real photo */}
				{patient.profileImage ? (
					<button
						type="button"
						className="patient-avatars patient-avatars-clickable"
						title="Patient's profile picture — click to enlarge"
						onClick={() => setShowPhoto(true)}
					>
						<img src={patient.profileImage} alt={patient.firstName} className="patient-avatar-image" />
					</button>
				) : (
					<div className="patient-avatars" title="Patient's profile picture (not uploaded yet)">
						<div className="patient-avatar-fallback">
							{getInitials(patient.firstName)}
						</div>
					</div>
				)}

				{/* Info */}
				<div className="patient-info-containers">
					<div className="patient-name-id-section">
						<h1 className="patient-name">{patient.firstName + " " + patient.lastName}</h1>
						{prakritiDosha ? (
							<span
								className="patient-dosha-tag"
								title={`Prakriti (body constitution): ${DOSHA_LABELS[prakritiDosha] || prakritiDosha} — the patient's dominant dosha from their Prakriti assessment`}
							>
								<Leaf size={13} /> {DOSHA_LABELS[prakritiDosha] || prakritiDosha}
							</span>
						) : (
							<span className="patient-dosha-tag muted" title="Prakriti (body constitution): the patient hasn't completed a Prakriti assessment yet">
								<Leaf size={13} /> Not yet assessed
							</span>
						)}
					</div>

					{/* Compact single-line meta strip */}
					<div className="patient-meta-line">
						{metaParts.map((part, i) => (
							<React.Fragment key={i}>
								{i > 0 && <span className="patient-meta-dot">·</span>}
								<span title={part.title}>{part.text}</span>
							</React.Fragment>
						))}
						{patient.email && (
							<>
								<span className="patient-meta-dot">·</span>
								<span className="patient-meta-contact" title="Email address"><Mail size={12} />{patient.email}</span>
							</>
						)}
						{patient.phone && (
							<>
								<span className="patient-meta-dot">·</span>
								<span className="patient-meta-contact" title="Phone number"><Phone size={12} />{patient.phone}</span>
							</>
						)}
					</div>
				</div>
			</div>
		</div>

		{showPhoto && patient.profileImage && (
			<div className="patient-photo-overlay" onClick={() => setShowPhoto(false)}>
				<div className="patient-photo-modal" onClick={(e) => e.stopPropagation()}>
					<button type="button" className="patient-photo-close" onClick={() => setShowPhoto(false)} aria-label="Close">
						<X size={20} />
					</button>
					<img src={patient.profileImage} alt={patient.firstName} className="patient-photo-full" />
					<p className="patient-photo-caption">{patient.firstName} {patient.lastName}</p>
				</div>
			</div>
		)}
		</>
	);
}
