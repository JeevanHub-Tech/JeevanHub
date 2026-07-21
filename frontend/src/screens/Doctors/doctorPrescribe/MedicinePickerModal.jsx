import { useState, useEffect, useMemo } from "react";
import { Search, X, ChevronLeft, ChevronRight, ArrowLeft, Check, Loader2, Pill } from "lucide-react";

import { BACKEND_URL } from "../../../config";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const BACKEND = BACKEND_URL || "http://localhost:8080";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=600&auto=format&fit=crop";

const resolveImages = (medicine) => {
	const imgs = (medicine.images || []).filter(Boolean).map((img) => (img.startsWith("http") ? img : `${BACKEND}/${img}`));
	return imgs.length > 0 ? imgs : [FALLBACK_IMAGE];
};

// Full-screen medicine browser the doctor uses to pick an inventory item to prescribe.
// Mirrors the patient's browse → detail experience, ending in "Select this medicine".
export function MedicinePickerModal({ onSelect, onClose }) {
	const [medicines, setMedicines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");

	const [detailMedicine, setDetailMedicine] = useState(null);
	const [imageIndex, setImageIndex] = useState(0);

	useEffect(() => {
		const fetchMedicines = async () => {
			try {
				const response = await fetch(`${BACKEND}/api/medicines`);
				if (!response.ok) throw new Error("Failed to load medicines");
				const data = await response.json();
				setMedicines(Array.isArray(data) ? data : []);
			} catch (err) {
				console.error("Error loading medicines:", err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchMedicines();
	}, []);

	const filtered = useMemo(() => {
		if (!searchTerm.trim()) return medicines;
		const q = searchTerm.toLowerCase();
		return medicines.filter(
			(m) => m.name?.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
		);
	}, [medicines, searchTerm]);

	const openDetail = (medicine) => {
		setDetailMedicine(medicine);
		setImageIndex(0);
	};

	const confirmSelect = (medicine) => {
		onSelect(medicine);
		onClose();
	};

	const detailImages = detailMedicine ? resolveImages(detailMedicine) : [];

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="flex h-[88vh] max-w-[1100px] flex-col gap-0 p-0">
				<DialogHeader className="flex-row items-center justify-between border-b border-border px-6 py-4">
					{detailMedicine ? (
						<button
							className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
							onClick={() => setDetailMedicine(null)}
						>
							<ArrowLeft size={18} /> Back to all medicines
						</button>
					) : (
						<DialogTitle className="flex items-center gap-2.5">
							<Pill size={20} /> Select a medicine from inventory
						</DialogTitle>
					)}
				</DialogHeader>

				{detailMedicine ? (
					<div className="grid flex-1 grid-cols-1 gap-7 overflow-y-auto p-6 sm:grid-cols-2">
						<div>
							<div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted/40">
								{detailImages.length > 1 ? (
									<button
										className="absolute top-1/2 left-2.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/85 text-foreground"
										onClick={() => setImageIndex((i) => (i === 0 ? detailImages.length - 1 : i - 1))}
									>
										<ChevronLeft size={20} />
									</button>
								) : null}
								<img
									src={detailImages[imageIndex]}
									alt={detailMedicine.name}
									className="size-full object-contain"
									onError={(e) => {
										e.currentTarget.onerror = null;
										e.currentTarget.src = FALLBACK_IMAGE;
									}}
								/>
								{detailImages.length > 1 ? (
									<button
										className="absolute top-1/2 right-2.5 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/85 text-foreground"
										onClick={() => setImageIndex((i) => (i === detailImages.length - 1 ? 0 : i + 1))}
									>
										<ChevronRight size={20} />
									</button>
								) : null}
							</div>
							{detailImages.length > 1 ? (
								<div className="mt-3 flex justify-center gap-1.5">
									{detailImages.map((_, idx) => (
										<span
											key={idx}
											onClick={() => setImageIndex(idx)}
											className={
												idx === imageIndex
													? "size-2 scale-125 cursor-pointer rounded-full bg-primary"
													: "size-2 cursor-pointer rounded-full bg-muted-foreground/30"
											}
										/>
									))}
								</div>
							) : null}
						</div>

						<div>
							<h3 className="mb-3 text-2xl font-extrabold text-foreground">{detailMedicine.name}</h3>
							<div className="mb-4 flex flex-wrap gap-2">
								{detailMedicine.category ? <Badge variant="secondary">{detailMedicine.category}</Badge> : null}
								{detailMedicine.prescription ? (
									<Badge variant="destructive">Rx Required</Badge>
								) : (
									<Badge className="bg-primary/15 text-primary hover:bg-primary/15">No Prescription</Badge>
								)}
							</div>
							<div className="mb-1 text-2xl font-extrabold text-primary">₹{detailMedicine.price}</div>
							{detailMedicine.retailerId ? (
								<p className="mb-5 text-sm text-muted-foreground">
									Sold by {detailMedicine.retailerId.firstName || ""} {detailMedicine.retailerId.lastName || ""}
								</p>
							) : null}
							<div className="mb-5">
								<h4 className="mb-1.5 text-sm font-bold text-foreground">Description</h4>
								<p className="text-sm leading-relaxed text-foreground/80">
									{detailMedicine.description || "No description provided."}
								</p>
							</div>
							<div>
								{detailMedicine.quantity > 0 ? (
									<span className="text-sm font-semibold text-primary">In stock ({detailMedicine.quantity} available)</span>
								) : (
									<span className="text-sm font-semibold text-destructive">Out of stock</span>
								)}
							</div>
						</div>
					</div>
				) : (
					<>
						<div className="mx-6 mt-4.5 flex items-center gap-2.5 rounded-lg border border-input px-3.5 py-2.5">
							<Search size={18} className="shrink-0 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search by name, category, or description..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								autoFocus
								className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
							/>
							{searchTerm ? (
								<button onClick={() => setSearchTerm("")} className="shrink-0 text-muted-foreground">
									<X size={16} />
								</button>
							) : null}
						</div>

						<div className="flex-1 overflow-y-auto p-6">
							{loading ? (
								<div className="flex items-center justify-center gap-2.5 py-16 text-muted-foreground">
									<Loader2 className="size-7 animate-spin" /> Loading medicines...
								</div>
							) : error ? (
								<div className="flex items-center justify-center py-16 text-muted-foreground">{error}</div>
							) : filtered.length === 0 ? (
								<div className="flex items-center justify-center py-16 text-muted-foreground">No medicines match your search.</div>
							) : (
								<div className="grid grid-cols-1 gap-4.5 [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
									{filtered.map((medicine) => {
										const img = resolveImages(medicine)[0];
										return (
											<Card
												key={medicine._id}
												className="cursor-pointer gap-3 overflow-hidden py-0 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
												onClick={() => openDetail(medicine)}
											>
												<div className="flex h-[150px] items-center justify-center overflow-hidden bg-muted/40">
													<img
														src={img}
														alt={medicine.name}
														className="size-full object-cover"
														loading="lazy"
														onError={(e) => {
															e.currentTarget.onerror = null;
															e.currentTarget.src = FALLBACK_IMAGE;
														}}
													/>
												</div>
												<div className="flex flex-1 flex-col gap-2 p-3">
													<h4 className="truncate text-sm font-bold text-foreground" title={medicine.name}>
														{medicine.name}
													</h4>
													<div className="mt-auto flex items-center justify-between gap-2">
														<span className="text-base font-bold text-primary">₹{medicine.price}</span>
														{medicine.category ? (
															<Badge variant="secondary" className="text-[11px]">
																{medicine.category}
															</Badge>
														) : null}
													</div>
													<Button
														variant="outline"
														size="sm"
														onClick={(e) => {
															e.stopPropagation();
															confirmSelect(medicine);
														}}
													>
														<Check data-icon="inline-start" /> Select
													</Button>
												</div>
											</Card>
										);
									})}
								</div>
							)}
						</div>
					</>
				)}

				{detailMedicine ? (
					<div className="flex justify-end border-t border-border p-4">
						<Button size="lg" onClick={() => confirmSelect(detailMedicine)}>
							<Check data-icon="inline-start" /> Select this medicine
						</Button>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

export default MedicinePickerModal;
