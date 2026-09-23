import { CheckCircle2, Circle, MapPin, PackageCheck, RotateCcw, Truck } from "lucide-react";

// Delhivery's own status types, mapped to something a patient can read at a glance.
const STATUS_ICONS = {
	DL: PackageCheck,
	RT: RotateCcw,
	OT: Truck,
	IT: Truck,
	OP: Truck,
	PP: Truck,
	M: Circle,
};

const formatWhen = (value) => {
	if (!value) return "";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleString("en-IN", {
		day: "numeric",
		month: "short",
		hour: "numeric",
		minute: "2-digit",
	});
};

/**
 * Vertical courier scan timeline, newest first (the backend already sorts it).
 * @param {Array} timeline entries of { status, statusCode, location, timestamp, remarks }
 */
function TrackingTimeline({ timeline = [] }) {
	if (!timeline.length) {
		return (
			<p className="text-sm text-muted-foreground">
				No courier scans yet. The first update appears once Delhivery picks the parcel up.
			</p>
		);
	}

	return (
		<ol className="flex flex-col">
			{timeline.map((entry, index) => {
				const Icon = STATUS_ICONS[entry.statusCode] || CheckCircle2;
				const isLatest = index === 0;
				const isLast = index === timeline.length - 1;

				return (
					<li key={`${entry.statusCode || "scan"}-${entry.timestamp || index}`} className="flex gap-3">
						{/* Rail: dot per scan, connector to the next one. */}
						<div className="flex flex-col items-center">
							<span
								className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
									isLatest ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
								}`}
							>
								<Icon className="size-3.5" />
							</span>
							{!isLast ? <span className="w-px flex-1 bg-border" /> : null}
						</div>

						<div className={`flex flex-col gap-0.5 ${isLast ? "pb-0" : "pb-4"}`}>
							<p className={`text-sm ${isLatest ? "font-medium text-foreground" : "text-foreground/90"}`}>
								{entry.status || "Update"}
							</p>
							<div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
								{entry.timestamp ? <span>{formatWhen(entry.timestamp)}</span> : null}
								{entry.location ? (
									<span className="flex items-center gap-1">
										<MapPin className="size-3" />
										{entry.location}
									</span>
								) : null}
							</div>
							{entry.remarks ? <p className="text-xs text-muted-foreground">{entry.remarks}</p> : null}
						</div>
					</li>
				);
			})}
		</ol>
	);
}

export default TrackingTimeline;
