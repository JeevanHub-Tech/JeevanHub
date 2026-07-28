import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AlertTriangle, Plus, ScanText, Trash2 } from "lucide-react";

import { AuthContext } from "../context/AuthContext";
import { BACKEND_URL } from "../config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const emptyMedicine = () => ({ name: "", dosage: "", frequency: "", duration: "", instructions: "" });

// Patient-only side panel shown next to an uploaded prescription: Gemini OCR
// runs automatically at upload time and lands here as an editable draft --
// the patient reviews it, corrects mistakes, fills in anything missing, and
// submits. Nothing here is ever shown to a doctor until submitted; the
// doctor dashboard only ever sees the locked, submitted result.
export function PatientVerificationPanel({ doc, patientId, onDocUpdate }) {
	const { auth } = useContext(AuthContext);
	const [retrying, setRetrying] = useState(false);
	const [saving, setSaving] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [form, setForm] = useState(null);

	const ocr = doc?.ocr;
	const verification = doc?.patientVerification;
	const isSubmitted = verification?.status === "submitted";

	useEffect(() => {
		const source = verification && verification.status !== "pending" ? verification : ocr;
		setForm({
			medicines: source?.medicines?.length ? source.medicines.map((m) => ({ ...m })) : [emptyMedicine()],
			doctorName: source?.doctorName || "",
			doctorRegistrationNumber: source?.doctorRegistrationNumber || "",
			prescriptionDate: source?.prescriptionDate || "",
			patientNameOnDocument: source?.patientNameOnDocument || "",
			notes: verification?.notes || "",
		});
		setError("");
	}, [doc?._id, ocr?.status, ocr?.analyzedAt, verification?.status, verification?.submittedAt]);

	const headers = { Authorization: `Bearer ${auth.token}` };

	const retryOcr = async () => {
		setRetrying(true);
		setError("");
		try {
			const response = await axios.post(
				`${BACKEND_URL}/api/patients/${patientId}/medical-history/${doc._id}/ocr/retry`,
				{},
				{ headers }
			);
			onDocUpdate?.(response.data.medicalHistoryDoc);
		} catch (err) {
			setError(err.response?.data?.message || "Something went wrong, please try again.");
		} finally {
			setRetrying(false);
		}
	};

	const updateMedicine = (index, field, value) => {
		setForm((f) => ({
			...f,
			medicines: f.medicines.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
		}));
	};

	const addMedicine = () => setForm((f) => ({ ...f, medicines: [...f.medicines, emptyMedicine()] }));
	const removeMedicine = (index) => setForm((f) => ({ ...f, medicines: f.medicines.filter((_, i) => i !== index) }));

	const save = async (submit) => {
		(submit ? setSubmitting : setSaving)(true);
		setError("");
		try {
			const url = `${BACKEND_URL}/api/patients/${patientId}/medical-history/${doc._id}/verification${submit ? "/submit" : ""}`;
			const method = submit ? axios.post : axios.put;
			const response = await method(url, form, { headers });
			onDocUpdate?.(response.data.medicalHistoryDoc);
		} catch (err) {
			setError(err.response?.data?.message || "Something went wrong, please try again.");
		} finally {
			(submit ? setSubmitting : setSaving)(false);
		}
	};

	const status = ocr?.status || "pending";

	return (
		<div className="flex h-full w-full flex-col gap-3 overflow-y-auto border-t border-border p-4 md:w-96 md:border-t-0 md:border-l">
			<h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
				<ScanText className="size-4 text-primary" />
				{isSubmitted ? "Submitted prescription" : "Review & verify prescription"}
			</h4>

			{(status === "pending" || status === "processing") && !isSubmitted ? (
				<p className="text-sm text-muted-foreground">Transcribing your document…</p>
			) : null}

			{status === "failed" && !isSubmitted ? (
				<div className="flex flex-col gap-2">
					<p className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
						{ocr?.error || "OCR failed."}
					</p>
					<Button size="sm" onClick={retryOcr} loading={retrying}>
						Retry OCR
					</Button>
				</div>
			) : null}

			{status === "done" && form ? (
				<>
					{isSubmitted ? (
						<p className="rounded-lg border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
							Submitted -- this is final and no longer editable. Your doctor now sees this data.
						</p>
					) : ocr.unclearNotes ? (
						<p className="flex items-start gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--jh-turmeric-gold)_35%,transparent)] bg-[color-mix(in_srgb,var(--jh-turmeric-gold)_12%,transparent)] p-2.5 text-xs text-[#7a5a1e]">
							<AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
							{ocr.unclearNotes}
						</p>
					) : null}

					<div className="grid grid-cols-2 gap-2">
						<div>
							<p className="mb-1 text-xs font-medium text-muted-foreground">Doctor name</p>
							<Input
								value={form.doctorName}
								onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))}
								disabled={isSubmitted}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<p className="mb-1 text-xs font-medium text-muted-foreground">Reg. number</p>
							<Input
								value={form.doctorRegistrationNumber}
								onChange={(e) => setForm((f) => ({ ...f, doctorRegistrationNumber: e.target.value }))}
								disabled={isSubmitted}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<p className="mb-1 text-xs font-medium text-muted-foreground">Date</p>
							<Input
								value={form.prescriptionDate}
								onChange={(e) => setForm((f) => ({ ...f, prescriptionDate: e.target.value }))}
								disabled={isSubmitted}
								className="h-8 text-xs"
							/>
						</div>
						<div>
							<p className="mb-1 text-xs font-medium text-muted-foreground">Patient name on doc</p>
							<Input
								value={form.patientNameOnDocument}
								onChange={(e) => setForm((f) => ({ ...f, patientNameOnDocument: e.target.value }))}
								disabled={isSubmitted}
								className="h-8 text-xs"
							/>
						</div>
					</div>

					<div>
						<div className="mb-1 flex items-center justify-between">
							<p className="text-xs font-medium text-muted-foreground">Medicines</p>
							{!isSubmitted ? (
								<button type="button" onClick={addMedicine} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
									<Plus className="size-3" /> Add
								</button>
							) : null}
						</div>
						<div className="flex flex-col gap-2">
							{form.medicines.map((m, i) => (
								<div key={i} className="rounded-lg border border-border p-2">
									<div className="mb-1.5 grid grid-cols-2 gap-1.5">
										<Input placeholder="Name" value={m.name} onChange={(e) => updateMedicine(i, "name", e.target.value)} disabled={isSubmitted} className="h-7 text-xs" />
										<Input placeholder="Dosage" value={m.dosage} onChange={(e) => updateMedicine(i, "dosage", e.target.value)} disabled={isSubmitted} className="h-7 text-xs" />
										<Input placeholder="Frequency" value={m.frequency} onChange={(e) => updateMedicine(i, "frequency", e.target.value)} disabled={isSubmitted} className="h-7 text-xs" />
										<Input placeholder="Duration" value={m.duration} onChange={(e) => updateMedicine(i, "duration", e.target.value)} disabled={isSubmitted} className="h-7 text-xs" />
									</div>
									<div className="flex items-center gap-1.5">
										<Input placeholder="Instructions" value={m.instructions} onChange={(e) => updateMedicine(i, "instructions", e.target.value)} disabled={isSubmitted} className="h-7 flex-1 text-xs" />
										{!isSubmitted && form.medicines.length > 1 ? (
											<button type="button" onClick={() => removeMedicine(i)} aria-label="Remove medicine" className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
												<Trash2 className="size-3.5" />
											</button>
										) : null}
									</div>
								</div>
							))}
						</div>
					</div>

					<div>
						<p className="mb-1 text-xs font-medium text-muted-foreground">Notes</p>
						<Textarea
							value={form.notes}
							onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
							disabled={isSubmitted}
							className="min-h-16 text-xs"
						/>
					</div>

					{!isSubmitted ? (
						<div className="flex flex-wrap gap-2">
							<Button size="sm" variant="outline" onClick={() => save(false)} loading={saving}>
								Save draft
							</Button>
							<Button size="sm" onClick={() => save(true)} loading={submitting}>
								Submit to doctor
							</Button>
							<Button size="sm" variant="ghost" onClick={retryOcr} loading={retrying}>
								Re-run OCR
							</Button>
						</div>
					) : null}
				</>
			) : null}

			{error ? <p className="text-xs text-destructive">{error}</p> : null}
		</div>
	);
}
