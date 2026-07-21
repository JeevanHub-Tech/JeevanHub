import { useState, useEffect } from "react";
import { HeartPulse, Sun, Moon, Plus, X, ListTodo, Send, ExternalLink, Loader2 } from "lucide-react";

import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

const AsanaPlanCard = ({ title, Icon, planType, planData, addAsana, removeAsana }) => {
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

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="rounded-t-xl border-b border-border bg-muted/40 px-4 py-3">
				<h4 className="flex items-center gap-2.5 text-base font-bold text-foreground">
					<Icon className="size-5 text-primary" />
					{title}
				</h4>
			</div>

			<div className="flex flex-1 flex-col gap-4 p-4">
				<div className="flex flex-wrap gap-2">
					<Input
						list={datalistId}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type or choose an asana..."
						onKeyDown={handleKeyPress}
						className="min-w-[140px] flex-1"
					/>
					<datalist id={datalistId}>
						{COMMON_ASANAS.map((asana) => (
							<option key={asana} value={asana} />
						))}
					</datalist>
					<Input
						type="url"
						value={youtubeUrl}
						onChange={(e) => setYoutubeUrl(e.target.value)}
						placeholder="YouTube link (optional)"
						onKeyDown={handleKeyPress}
						className="min-w-[140px] flex-1"
					/>
					<Button type="button" size="icon" onClick={handleAdd}>
						<Plus />
					</Button>
				</div>

				<div className="flex flex-col gap-2">
					<label className="text-xs font-semibold text-muted-foreground">Selected Asanas ({planData.length}):</label>
					<div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-muted/40 p-2">
						{planData.length > 0 ? (
							<div className="flex flex-col gap-2">
								{planData.map(({ name, link }) => (
									<div
										key={name}
										className="flex items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm"
									>
										{link ? (
											<a
												href={link}
												target="_blank"
												rel="noopener noreferrer"
												className="flex min-w-0 items-center gap-1.5 truncate font-medium text-primary hover:underline"
												title="Open video"
											>
												{name} <ExternalLink size={14} className="shrink-0" />
											</a>
										) : (
											<span className="min-w-0 truncate text-foreground">{name}</span>
										)}
										<button
											type="button"
											onClick={() => removeAsana(planType, name)}
											className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
										>
											<X size={14} />
										</button>
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

export function YogaPlanForm({ bookingId, patientId, doctorId, onPrescribed }) {
	const [yogaPlan, setYogaPlan] = useState({
		morning: [],
		evening: [],
	});

	const [loading, setLoading] = useState(false);
	const [loadingExisting, setLoadingExisting] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchExisting = async () => {
			if (!bookingId) {
				setLoadingExisting(false);
				return;
			}
			try {
				const response = await authFetch(`${BACKEND_URL}/api/diet-yoga/booking/${bookingId}`);
				if (response.ok) {
					const data = await response.json();
					const existingYoga = data?.dietYoga?.yoga;
					if (existingYoga) {
						setYogaPlan({
							morning: existingYoga.morning || [],
							evening: existingYoga.evening || [],
						});
					}
				}
			} catch (err) {
				console.error("Error fetching existing yoga plan:", err);
			} finally {
				setLoadingExisting(false);
			}
		};

		fetchExisting();
	}, [bookingId]);

	const addAsana = (planType, asana) => {
		const item =
			typeof asana === "string" ? { name: asana.trim(), link: "" } : { name: (asana.name || "").trim(), link: (asana.link || "").trim() };

		if (!item.name) return;

		setYogaPlan((prev) => {
			if (prev[planType].some((a) => a.name.toLowerCase() === item.name.toLowerCase())) {
				return prev;
			}
			return {
				...prev,
				[planType]: [...prev[planType], item],
			};
		});
	};

	const removeAsana = (planType, asanaName) => {
		setYogaPlan((prev) => ({
			...prev,
			[planType]: prev[planType].filter((a) => a.name !== asanaName),
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (yogaPlan.morning.length === 0 && yogaPlan.evening.length === 0) {
			alert("Please add at least one asana to a plan.");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await authFetch(`${BACKEND_URL}/api/diet-yoga/yoga`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bookingId: bookingId,
					patientId: patientId,
					doctorId: doctorId,
					yogaPlan: yogaPlan,
				}),
			});

			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				throw new Error(errData.message || "Failed to submit yoga plan");
			}

			await response.json();
			alert("The yoga plan has been successfully prescribed.");
			onPrescribed?.();
		} catch (err) {
			console.error("Submission Error:", err);
			setError(err.message);
			alert(`Error: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const planDetails = [
		{ id: "morning", title: "Morning Plan", Icon: Sun },
		{ id: "evening", title: "Evening Plan", Icon: Moon },
	];

	if (loadingExisting) {
		return (
			<Card className="overflow-hidden p-0">
				<div className="border-b border-border bg-muted/40 px-6 py-4">
					<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
						<HeartPulse className="size-6 text-primary" />
						Prescribe Yoga & Wellness Plan
					</h3>
				</div>
				<div className="p-6">
					<p className="py-6 text-center text-muted-foreground">Checking for an existing plan...</p>
				</div>
			</Card>
		);
	}

	return (
		<Card className="overflow-hidden p-0">
			<div className="border-b border-border bg-muted/40 px-6 py-4">
				<h3 className="flex items-center gap-3 text-lg font-bold text-foreground">
					<HeartPulse className="size-6 text-primary" />
					Prescribe Yoga & Wellness Plan
				</h3>
			</div>
			<div className="p-6">
				<form onSubmit={handleSubmit} className="flex flex-col gap-6">
					<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
						{planDetails.map((plan) => (
							<AsanaPlanCard
								key={plan.id}
								title={plan.title}
								Icon={plan.Icon}
								planType={plan.id}
								planData={yogaPlan[plan.id]}
								addAsana={addAsana}
								removeAsana={removeAsana}
							/>
						))}
					</div>

					<div className="rounded-lg border border-border bg-muted/40 p-5">
						<h4 className="mb-3 flex items-center gap-2 font-bold text-foreground">
							<ListTodo size={18} className="text-primary" />
							Plan Summary
						</h4>
						<div className="grid grid-cols-1 gap-2 text-sm text-foreground/80 sm:grid-cols-2">
							<div>
								<strong className="text-foreground">Morning:</strong> {yogaPlan.morning.length} asanas
							</div>
							<div>
								<strong className="text-foreground">Evening:</strong> {yogaPlan.evening.length} asanas
							</div>
						</div>
					</div>

					{error ? <p className="text-sm text-destructive">Error: {error}</p> : null}

					<Button type="submit" disabled={loading} className="self-end">
						{loading ? (
							<>
								<Loader2 className="animate-spin" data-icon="inline-start" size={18} />
								Prescribing...
							</>
						) : (
							<>
								<Send data-icon="inline-start" size={18} />
								Prescribe Yoga Plan
							</>
						)}
					</Button>
				</form>
			</div>
		</Card>
	);
}
