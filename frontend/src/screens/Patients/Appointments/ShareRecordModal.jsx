import { useEffect, useState } from "react";
import { Link as LinkIcon, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";

const selectClassName =
	"h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// Lets a patient share context with their doctor ahead of / shortly after a specific
// booking — either an external file (a photo/PDF of an outside prescription) or a
// reference to one of their own past prescriptions on this platform.
const ShareRecordModal = ({ bookingId, onClose, onShared, initialMode = "upload" }) => {
	const [mode, setMode] = useState(initialMode); // 'upload' | 'reference'
	const [file, setFile] = useState(null);
	const [note, setNote] = useState("");
	const [ownBookings, setOwnBookings] = useState([]);
	const [selectedBookingId, setSelectedBookingId] = useState("");
	const [loadingOwnBookings, setLoadingOwnBookings] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (mode !== "reference" || ownBookings.length > 0) return;

		const fetchOwnBookings = async () => {
			setLoadingOwnBookings(true);
			try {
				const response = await authFetch(
					`${BACKEND_URL}/api/bookings/sharing/own-bookings?excludeBookingId=${bookingId}`,
				);
				if (response.ok) {
					const data = await response.json();
					setOwnBookings(data.bookings || []);
				}
			} catch (err) {
				console.error("Error fetching your own bookings:", err);
			} finally {
				setLoadingOwnBookings(false);
			}
		};

		fetchOwnBookings();
	}, [mode, bookingId, ownBookings.length]);

	const handleSubmit = async () => {
		if (mode === "upload" && !file) {
			alert("Please choose a file to upload.");
			return;
		}
		if (mode === "reference" && !selectedBookingId) {
			alert("Please select a prescription to link.");
			return;
		}

		setSubmitting(true);
		try {
			const formData = new FormData();
			if (mode === "upload") {
				formData.append("file", file);
			} else {
				formData.append("referencedBookingId", selectedBookingId);
			}
			formData.append("note", note);

			const response = await authFetch(`${BACKEND_URL}/api/bookings/${bookingId}/shared-records`, {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				throw new Error(errData.error || "Failed to share record");
			}

			alert("Shared with your doctor successfully.");
			onShared?.();
			onClose();
		} catch (err) {
			console.error("Error sharing record:", err);
			alert(`Error: ${err.message}`);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-lg">
				<DialogTitle>Share a prescription with your doctor</DialogTitle>
				<DialogDescription>
					Upload a photo or PDF of an outside prescription, or link one of your own prescriptions
					from this platform, so your doctor has it for reference around this appointment.
				</DialogDescription>

				<div className="flex gap-1 rounded-lg bg-secondary p-1" role="group" aria-label="Share method">
					<button
						type="button"
						onClick={() => setMode("upload")}
						className={cn(
							"flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
							mode === "upload" ? "bg-card text-primary shadow-(--jh-shadow-rest)" : "text-muted-foreground hover:text-foreground",
						)}
					>
						<Upload size={16} /> Upload a file
					</button>
					<button
						type="button"
						onClick={() => setMode("reference")}
						className={cn(
							"flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
							mode === "reference" ? "bg-card text-primary shadow-(--jh-shadow-rest)" : "text-muted-foreground hover:text-foreground",
						)}
					>
						<LinkIcon size={16} /> Link a past prescription
					</button>
				</div>

				{mode === "upload" ? (
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="share-record-file">Prescription photo or PDF</Label>
						<input
							id="share-record-file"
							type="file"
							accept="image/*,application/pdf"
							onChange={(e) => setFile(e.target.files[0])}
							className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-secondary-foreground"
						/>
					</div>
				) : (
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="share-record-reference">Choose a past prescription</Label>
						{loadingOwnBookings ? (
							<p className="text-sm text-muted-foreground">Loading your prescriptions...</p>
						) : ownBookings.length === 0 ? (
							<p className="text-sm text-muted-foreground">You don't have any prescriptions on this platform yet.</p>
						) : (
							<select
								id="share-record-reference"
								value={selectedBookingId}
								onChange={(e) => setSelectedBookingId(e.target.value)}
								className={selectClassName}
							>
								<option value="">Select one...</option>
								{ownBookings.map((b) => (
									<option key={b._id} value={b._id}>
										Dr. {b.doctorName} — {new Date(b.dateOfAppointment).toLocaleDateString()}
										{b.recommendedSupplements?.length > 0
											? ` (${b.recommendedSupplements.map((s) => s.medicineName).join(", ")})`
											: ""}
									</option>
								))}
							</select>
						)}
					</div>
				)}

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="share-record-note">Note (optional)</Label>
					<textarea
						id="share-record-note"
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="Any context for your doctor..."
						rows={2}
						className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
					/>
				</div>

				<Button onClick={handleSubmit} disabled={submitting} className="w-full">
					{submitting ? (
						<>
							<Loader2 className="size-4 animate-spin" /> Sharing...
						</>
					) : (
						"Share with doctor"
					)}
				</Button>
			</DialogContent>
		</Dialog>
	);
};

export default ShareRecordModal;
