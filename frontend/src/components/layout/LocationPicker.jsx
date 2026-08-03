import { useState } from "react";
import { MapPin, LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUserLocation } from "@/hooks/useUserLocation";
import { cn } from "@/lib/utils";

// Amazon-style "deliver to" control: click the location label in the navbar to
// enter a 6-digit pincode manually instead of relying on browser geolocation.
function LocationPicker({ fallback = "Your location", savedLocation = null, className }) {
	const { location, pincode, setManualPincode, clearManualPincode, pincodeStatus } = useUserLocation(
		fallback,
		savedLocation,
	);
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState(pincode);

	const handleSubmit = async (e) => {
		e.preventDefault();
		const ok = await setManualPincode(draft.trim());
		if (ok) setOpen(false);
	};

	const handleUseCurrentLocation = () => {
		clearManualPincode();
		setDraft("");
		setOpen(false);
	};

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (next) setDraft(pincode);
			}}
		>
			<PopoverTrigger
				className={cn(
					"flex items-center gap-1.5 rounded-md text-xs font-medium text-primary-foreground/70 transition-colors hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
					className,
				)}
			>
				<MapPin className="size-3.5" aria-hidden="true" />
				{location}
			</PopoverTrigger>
			<PopoverContent align="start" className="w-64">
				<form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
					<div className="flex flex-col gap-0.5">
						<p className="text-sm font-semibold text-foreground">Choose your location</p>
						<p className="text-xs text-muted-foreground">Enter a 6-digit pincode to see accurate delivery options.</p>
					</div>
					<Input
						value={draft}
						onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 6))}
						placeholder="e.g. 110001"
						inputMode="numeric"
						maxLength={6}
						aria-label="Pincode"
					/>
					{pincodeStatus === "error" ? (
						<p className="text-xs text-destructive">Please enter a valid 6-digit pincode.</p>
					) : null}
					<div className="flex gap-2">
						<Button type="submit" size="sm" className="flex-1" disabled={pincodeStatus === "loading"}>
							{pincodeStatus === "loading" ? "Checking..." : "Confirm"}
						</Button>
						<Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={handleUseCurrentLocation}>
							<LocateFixed className="size-3.5" aria-hidden="true" />
							Use current
						</Button>
					</div>
				</form>
			</PopoverContent>
		</Popover>
	);
}

export default LocationPicker;
