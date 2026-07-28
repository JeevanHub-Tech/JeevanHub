import { ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Doctor-only side panel: read-only view of the patient's final, submitted
// prescription data. Doctors never see the raw Gemini OCR draft or an
// unsubmitted patient edit -- the backend only ever hands this endpoint
// docs where patientVerification.status === 'submitted' (see
// forDoctorView in patientController.js), exposed here as `finalPrescription`.
export function FinalPrescriptionPanel({ doc }) {
	const data = doc?.finalPrescription;
	if (!data) return null;

	return (
		<div className="flex h-full w-full flex-col gap-3 overflow-y-auto border-t border-border p-4 md:w-96 md:border-t-0 md:border-l">
			<h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
				<ClipboardCheck className="size-4 text-primary" />
				Patient-verified prescription
				<Badge variant="success">Verified</Badge>
			</h4>

			<div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
				<div>
					<p className="text-muted-foreground">Doctor</p>
					<p className="font-medium text-foreground">{data.doctorName || "—"}</p>
				</div>
				<div>
					<p className="text-muted-foreground">Reg. number</p>
					<p className="font-medium text-foreground">{data.doctorRegistrationNumber || "—"}</p>
				</div>
				<div>
					<p className="text-muted-foreground">Date</p>
					<p className="font-medium text-foreground">{data.prescriptionDate || "—"}</p>
				</div>
				<div>
					<p className="text-muted-foreground">Patient (on doc)</p>
					<p className="font-medium text-foreground">{data.patientNameOnDocument || "—"}</p>
				</div>
			</div>

			<div>
				<p className="mb-1 text-xs font-medium text-muted-foreground">Medicines</p>
				<div className="flex flex-col gap-1.5">
					{(data.medicines || []).map((m, i) => (
						<div key={i} className="rounded-lg border border-border bg-muted/40 p-2 text-xs">
							<p className="font-semibold text-foreground">{m.name || "—"}</p>
							<p className="text-muted-foreground">
								{[m.dosage, m.frequency, m.duration].filter(Boolean).join(" · ") || "—"}
							</p>
							{m.instructions ? <p className="mt-0.5 text-muted-foreground">{m.instructions}</p> : null}
						</div>
					))}
				</div>
			</div>

			{data.notes ? (
				<div>
					<p className="mb-1 text-xs font-medium text-muted-foreground">Patient notes</p>
					<p className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs whitespace-pre-wrap text-foreground">
						{data.notes}
					</p>
				</div>
			) : null}

			{data.submittedAt ? (
				<p className="text-[0.65rem] text-muted-foreground">
					Submitted {new Date(data.submittedAt).toLocaleString()}
				</p>
			) : null}
		</div>
	);
}
