import { useState, useEffect, useCallback } from "react";
import { HeartPulse, Sun, Moon, Plus, X, Send, ExternalLink, Loader2, Search, PenLine, Check } from "lucide-react";

import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { SourceBadge } from "@/components/ui/SourceBadge";

const COMMON_ASANAS = [
	"Surya Namaskara (Sun Salutation)",
	"Vrikshasana (Tree Pose)",
	"Trikonasana (Triangle Pose)",
	"Bhujangasana (Cobra Pose)",
	"Adho Mukha Svanasana (Downward Dog)",
	"Balasana (Child's Pose)",
	"Shavasana (Corpse Pose)",
	"Pranayama (Breathing Exercise)",
	"Paschimottanasana (Seated Forward Bend)",
	"Ustrasana (Camel Pose)",
];

const AsanaEditor = ({ title, Icon, planType, planData, addAsana, removeAsana, updateAsanaLink, onSuggestVideo, suggestingFor }) => {
	const [input, setInput] = useState("");
	const [youtubeUrl, setYoutubeUrl] = useState("");
	const datalistId = `asana-options-${planType}`;

	const isYouTubeUrl = (url) => {
		if (!url) return true;
		try {
			const u = new URL(url);
			const host = u.hostname.replace(/^www\./, "");
			return host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com";
		} catch {
			return false;
		}
	};

	const handleAdd = () => {
		const name = input.trim();
		const link = youtubeUrl.trim();
		if (!name) return;
		if (link && !isYouTubeUrl(link)) {
			alert("Please enter a valid YouTube URL (youtube.com or youtu.be), or leave it blank.");
			return;
		}
		addAsana(planType, { name, link });
		setInput("");
		setYoutubeUrl("");
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAdd();
		}
	};

	const handleSuggest = async () => {
		const name = input.trim();
		if (!name) {
			alert("Type an asana name first, then request a video suggestion.");
			return;
		}
		const link = await onSuggestVideo(name);
		if (link) setYoutubeUrl(link);
	};

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="rounded-t-xl border-b border-border bg-muted/40 px-4 py-3">
				<h4 className="flex items-center gap-2.5 text-base font-bold text-foreground">
					<Icon className="size-5 text-primary" />
					{title}
				</h4>
			</div>

			<div className="flex flex-1 flex-col gap-4 p-4">
				<div className="flex flex-col gap-2.5 rounded-lg border border-dashed border-border p-3">
					<div className="flex flex-col gap-1">
						<label className="text-xs font-semibold text-muted-foreground">Asana name</label>
						<Input
							list={datalistId}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Type or choose an asana..."
							onKeyDown={handleKeyPress}
						/>
						<datalist id={datalistId}>
							{COMMON_ASANAS.map((asana) => (
								<option key={asana} value={asana} />
							))}
						</datalist>
					</div>

					<div className="flex flex-col gap-1">
						<label className="text-xs font-semibold text-muted-foreground">Video link (optional)</label>
						<div className="flex gap-2">
							<Input
								type="url"
								value={youtubeUrl}
								onChange={(e) => setYoutubeUrl(e.target.value)}
								placeholder="Auto-fetched if left blank"
								onKeyDown={handleKeyPress}
								className="flex-1"
							/>
							<Button type="button" variant="outline" onClick={handleSuggest} disabled={suggestingFor === input.trim()} title="Suggest a video for this asana">
								{suggestingFor === input.trim() ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
							</Button>
						</div>
					</div>

					<Button type="button" onClick={handleAdd} className="self-end">
						<Plus data-icon="inline-start" size={16} /> Add asana
					</Button>
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-xs font-semibold text-muted-foreground">Selected Asanas ({planData.length}):</label>
					<div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-muted/40 p-2">
						{planData.length > 0 ? (
							<div className="flex flex-col gap-2">
								{planData.map(({ name, link }) => (
									<div
										key={name}
										className="flex flex-col gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm"
									>
										<div className="flex items-center justify-between gap-2">
											<span className="min-w-0 truncate font-medium text-foreground">{name}</span>
											<div className="flex shrink-0 items-center gap-1">
												{link ? (
													<a
														href={link}
														target="_blank"
														rel="noopener noreferrer"
														className="flex items-center text-primary hover:underline"
														title="Open video"
													>
														<ExternalLink size={14} />
													</a>
												) : null}
												<button
													type="button"
													onClick={() => removeAsana(planType, name)}
													className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
												>
													<X size={14} />
												</button>
											</div>
										</div>
										<Input
											type="url"
											value={link || ""}
											onChange={(e) => updateAsanaLink(planType, name, e.target.value)}
											placeholder="Paste YouTube video link"
											className="h-8 text-xs"
										/>
									</div>
								))}
							</div>
						) : (
							<p className="py-6 text-center text-sm text-muted-foreground italic">No asanas added yet.</p>
						)}
					</div>
				</div>
			</div>
		</Card>
	);
};

const asanasToStr = (list) => (Array.isArray(list) ? list.map((a) => a.name).join(", ") : "");

// Which content the patient currently sees: doctorReview fields once
// published, otherwise the raw AI fields. Mirrors resolveDisplayYogaPlan()
// in backend/controllers/ayurvedaYogaPlanController.js.
function resolveActiveContent(plan) {
	if (!plan) return null;
	if (plan.status === "ai_modified" || plan.status === "doctor_approved") {
		return { morning: plan.doctorReview?.morning || [], evening: plan.doctorReview?.evening || [] };
	}
	return { morning: plan.morning || [], evening: plan.evening || [] };
}

// Doctor-facing review of the patient's AI-generated yoga plan (patient
// triggers generation from their own Prescription & Wellness page). The
// doctor can view it read-only, then Edit -> Save as a silent draft --
// nothing reaches the patient until "Submit Prescription" publishes it.
export function YogaPlanForm({ patientId, bookingId }) {
	const [plan, setPlan] = useState(null);
	const [loadingExisting, setLoadingExisting] = useState(true);
	const [saving, setSaving] = useState(false);
	const [editing, setEditing] = useState(false);
	const [error, setError] = useState(null);
	const [suggestingFor, setSuggestingFor] = useState(null);

	const [formPlan, setFormPlan] = useState({ morning: [], evening: [] });
	const [notes, setNotes] = useState("");

	const fetchExisting = useCallback(async () => {
		if (!patientId) {
			setLoadingExisting(false);
			return;
		}
		try {
			const response = await authFetch(`${BACKEND_URL}/api/ayurveda/yoga-plan/patient/${patientId}`);
			if (response.ok) {
				const data = await response.json();
				setPlan(data);
			}
		} catch (err) {
			console.error("Error fetching yoga plan:", err);
		} finally {
			setLoadingExisting(false);
		}
	}, [patientId]);

	useEffect(() => {
		fetchExisting();
	}, [fetchExisting]);

	const startEditing = () => {
		const active = resolveActiveContent(plan);
		setFormPlan({ morning: active?.morning || [], evening: active?.evening || [] });
		setNotes(plan?.doctorReview?.notes || "");
		setEditing(true);
	};

	const addAsana = (planType, asana) => {
		const item = { name: (asana.name || "").trim(), link: (asana.link || "").trim() };
		if (!item.name) return;
		setFormPlan((prev) => {
			if (prev[planType].some((a) => a.name.toLowerCase() === item.name.toLowerCase())) return prev;
			return { ...prev, [planType]: [...prev[planType], item] };
		});
	};

	const removeAsana = (planType, name) => {
		setFormPlan((prev) => ({ ...prev, [planType]: prev[planType].filter((a) => a.name !== name) }));
	};

	const updateAsanaLink = (planType, name, link) => {
		setFormPlan((prev) => ({ ...prev, [planType]: prev[planType].map((a) => (a.name === name ? { ...a, link } : a)) }));
	};

	const handleSuggestVideo = async (asanaName) => {
		setSuggestingFor(asanaName);
		try {
			const response = await authFetch(`${BACKEND_URL}/api/diet-yoga/yoga/video-suggest`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ asanaName }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.message || "Failed to suggest a video");
			return data.videos?.[0]?.link || "";
		} catch (err) {
			console.error("Error suggesting video:", err);
			alert(err.message);
			return "";
		} finally {
			setSuggestingFor(null);
		}
	};

	// Always a silent draft save -- nothing reaches the patient until
	// "Submit Prescription" publishes it.
	const submitReview = async (fp = formPlan, notesVal = notes) => {
		setSaving(true);
		setError(null);
		try {
			const response = await authFetch(`${BACKEND_URL}/api/ayurveda/yoga-plan/patient/${patientId}/review`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ bookingId, morning: fp.morning, evening: fp.evening, notes: notesVal }),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || data.message || "Failed to save yoga plan review");
			setPlan(data.plan);
			setEditing(false);
		} catch (err) {
			console.error("Error reviewing yoga plan:", err);
			setError(err.message);
			alert(err.message);
		} finally {
			setSaving(false);
		}
	};

	// Save the current active content unchanged as the doctor's draft.
	const saveAsIs = async () => {
		const active = resolveActiveContent(plan);
		const fp = { morning: active?.morning || [], evening: active?.evening || [] };
		setFormPlan(fp);
		submitReview(fp, notes);
	};

	if (loadingExisting) {
		return (
			<Card className="overflow-hidden p-0">
				<div className="border-b border-border bg-muted/40 px-6 py-4">
					<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
						<HeartPulse className="size-6 text-primary" />
						Yoga & Lifestyle
					</h3>
				</div>
				<div className="p-6">
					<p className="py-6 text-center text-muted-foreground">Checking for an existing plan...</p>
				</div>
			</Card>
		);
	}

	if (!plan) {
		return (
			<Card className="overflow-hidden p-0">
				<div className="border-b border-border bg-muted/40 px-6 py-4">
					<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
						<HeartPulse className="size-6 text-primary" />
						Yoga & Lifestyle
					</h3>
				</div>
				<div className="p-6">
					<EmptyState
						icon={HeartPulse}
						title="No AI yoga plan yet"
						description="This patient hasn't generated a plan yet. Use the Generate button above to create one, then review and approve it here."
					/>
				</div>
			</Card>
		);
	}

	const active = resolveActiveContent(plan);

	return (
		<Card className="overflow-hidden p-0">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-6 py-4">
				<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
					<HeartPulse className="size-6 text-primary" />
					Yoga & Lifestyle
				</h3>
				<div className="flex items-center gap-2">
					{plan.doctorReview?.reviewedAt && !plan.doctorReview?.published ? (
						<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Draft -- not sent yet</span>
					) : null}
					<SourceBadge status={plan.status} />
				</div>
			</div>
			<div className="p-6">
				{!editing ? (
					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="rounded-lg border border-border p-3">
								<h5 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
									<Sun size={14} /> Morning
								</h5>
								<p className="text-sm text-foreground">{asanasToStr(active?.morning) || "—"}</p>
							</div>
							<div className="rounded-lg border border-border p-3">
								<h5 className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
									<Moon size={14} /> Evening
								</h5>
								<p className="text-sm text-foreground">{asanasToStr(active?.evening) || "—"}</p>
							</div>
						</div>
						{plan.doctorReview?.notes ? (
							<div>
								<h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Doctor's notes</h5>
								<p className="text-sm text-foreground">{plan.doctorReview.notes}</p>
							</div>
						) : null}
						<div className="flex flex-wrap gap-2">
							<Button type="button" variant="outline" onClick={startEditing}>
								<PenLine data-icon="inline-start" size={16} /> Edit
							</Button>
							<Button type="button" onClick={saveAsIs} disabled={saving}>
								{saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Check data-icon="inline-start" size={16} />}
								Save
							</Button>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
							<AsanaEditor
								title="Morning Plan"
								Icon={Sun}
								planType="morning"
								planData={formPlan.morning}
								addAsana={addAsana}
								removeAsana={removeAsana}
								updateAsanaLink={updateAsanaLink}
								onSuggestVideo={handleSuggestVideo}
								suggestingFor={suggestingFor}
							/>
							<AsanaEditor
								title="Evening Plan"
								Icon={Moon}
								planType="evening"
								planData={formPlan.evening}
								addAsana={addAsana}
								removeAsana={removeAsana}
								updateAsanaLink={updateAsanaLink}
								onSuggestVideo={handleSuggestVideo}
								suggestingFor={suggestingFor}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<label className="text-xs font-semibold text-muted-foreground">Doctor's notes (optional)</label>
							<Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
						</div>
						<div className="flex flex-wrap gap-2">
							<Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
								Cancel
							</Button>
							<Button type="button" onClick={() => submitReview()} disabled={saving}>
								{saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" size={16} />}
								Save
							</Button>
						</div>
					</div>
				)}
				{error ? <p className="mt-4 text-sm text-destructive">Error: {error}</p> : null}
			</div>
		</Card>
	);
}
