import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PatientVerificationPanel } from "@/components/PatientVerificationPanel";
import { FinalPrescriptionPanel } from "@/components/FinalPrescriptionPanel";

// Renders a medical-history document (image or PDF) inline in an overlay so
// patients/doctors never have to leave the site to view it. `sidePanel`
// selects which side panel (if any) renders alongside the document:
//   - "verify": patient's own upload -- editable OCR-draft review/submit form.
//   - "final": doctor's view -- read-only, patient-submitted data only.
//   - omitted: no side panel, just the document.
export function DocumentViewerModal({ doc, onClose, patientId, sidePanel, onDocUpdate }) {
	if (!doc) return null;

	const isImage = doc.mimeType?.startsWith("image/");
	const hasPanel = sidePanel === "verify" || sidePanel === "final";

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className={`flex h-[85vh] max-h-[85vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 ${hasPanel ? "max-w-6xl" : "max-w-3xl"}`}
			>
				<div className="flex items-center justify-between border-b border-border px-5 py-3">
					<DialogTitle className="truncate pr-6 text-base">{doc.fileName}</DialogTitle>
				</div>
				<div className="flex flex-1 flex-col overflow-hidden md:flex-row">
					<div className="flex flex-1 items-center justify-center overflow-auto bg-secondary/60">
						{isImage ? (
							<img src={doc.url} alt={doc.fileName} className="max-h-full max-w-full object-contain" />
						) : (
							<iframe src={doc.url} title={doc.fileName} className="size-full border-0" />
						)}
					</div>
					{sidePanel === "verify" ? (
						<PatientVerificationPanel doc={doc} patientId={patientId} onDocUpdate={onDocUpdate} />
					) : null}
					{sidePanel === "final" ? <FinalPrescriptionPanel doc={doc} /> : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
