import { memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleCheck, ShieldAlert, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FALLBACK_IMAGE =
	"https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const MedicineCard = ({ medicine, cartQuantity, addToCart, handleQuantityChange }) => {
	const navigate = useNavigate();
	const medicineId = medicine._id || medicine.id;

	const stopPropagation = (e) => {
		e.stopPropagation();
		e.preventDefault();
	};

	const handleAddToCart = (e) => {
		stopPropagation(e);
		addToCart(medicine);
	};

	const handleQuantity = (e, delta) => {
		stopPropagation(e);
		handleQuantityChange(medicine._id, delta);
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			navigate(`/medicines/${medicineId}`);
		}
	};

	const hasReviews = medicine.numReviews > 0;

	return (
		<Link
			to={`/medicines/${medicineId}`}
			className="block h-full w-full max-w-70 no-underline"
			aria-label={`View details of ${medicine.name}`}
		>
			<Card
				className="h-full gap-0 py-0 transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-(--jh-shadow-hover) focus:-translate-y-1 focus:shadow-(--jh-shadow-hover)"
				onKeyDown={handleKeyDown}
				tabIndex={0}
				role="link"
			>
				<div className="relative w-full overflow-hidden rounded-t-[inherit] bg-white pt-[100%]">
					<img
						src={medicine.images?.[0] || FALLBACK_IMAGE}
						alt={medicine.name}
						loading="lazy"
						onError={(e) => {
							e.currentTarget.onerror = null;
							e.currentTarget.src = FALLBACK_IMAGE;
						}}
						className="absolute inset-0 size-full object-contain p-4 transition-transform duration-300 ease-out hover:scale-106"
					/>
				</div>

				<div className="flex flex-1 flex-col gap-2 p-4">
					<h3 className="m-0 line-clamp-2 h-11 text-base leading-[1.375rem] font-semibold text-foreground">
						{medicine.name}
					</h3>

					<div className="flex items-center gap-1.5 text-sm">
						{hasReviews ? (
							<>
								<Star className="size-3.5 fill-chart-2 text-chart-2" aria-hidden="true" />
								<span className="font-semibold text-foreground">{medicine.rating?.toFixed(1) ?? "0.0"}</span>
								<span className="text-muted-foreground">({medicine.numReviews})</span>
							</>
						) : (
							<span className="text-muted-foreground">No ratings yet</span>
						)}
					</div>

					<p className="m-0 text-xl font-bold text-primary">₹{medicine.price}</p>

					<div className="flex min-h-6.5 flex-wrap items-start gap-1.5 overflow-hidden">
						{medicine.diseasesTreated?.slice(0, 2).map((disease) => (
							<Badge key={disease} variant="secondary" className="font-normal">
								{disease}
							</Badge>
						))}
					</div>

					<div className="flex items-center gap-1.5 text-sm">
						{medicine.prescription ? (
							<>
								<ShieldAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" />
								<span className="font-medium text-destructive">Prescription required</span>
							</>
						) : (
							<>
								<CircleCheck className="size-4 shrink-0 text-(--jh-olive-deep)" aria-hidden="true" />
								<span className="font-medium text-(--jh-olive-deep)">No prescription required</span>
							</>
						)}
					</div>

					<div className="mt-auto flex justify-center pt-1">
						{cartQuantity > 0 ? (
							<div className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-(--jh-cream-tint) p-1.5">
								<button
									onClick={(e) => handleQuantity(e, -1)}
									className="flex size-9 items-center justify-center rounded-lg border border-input bg-card text-xl font-bold text-foreground transition-colors hover:border-primary hover:bg-(--jh-sage-pale)"
									aria-label="Decrease quantity"
									type="button"
								>
									−
								</button>
								<span className="min-w-8 text-center text-lg font-semibold">{cartQuantity}</span>
								<button
									onClick={(e) => handleQuantity(e, 1)}
									className="flex size-9 items-center justify-center rounded-lg border border-input bg-card text-xl font-bold text-foreground transition-colors hover:border-primary hover:bg-(--jh-sage-pale)"
									aria-label="Increase quantity"
									type="button"
								>
									+
								</button>
							</div>
						) : (
							<Button onClick={handleAddToCart} className="w-full" aria-label={`Add ${medicine.name} to cart`} type="button">
								Add to Cart
							</Button>
						)}
					</div>
				</div>
			</Card>
		</Link>
	);
};

export default memo(MedicineCard);
