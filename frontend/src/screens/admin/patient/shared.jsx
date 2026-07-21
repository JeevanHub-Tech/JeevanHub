import { cn } from "@/lib/utils";

// Shared across the admin patient-profile tabs (Prescriptions, Diet Plan) —
// a labelled value, optionally with a leading icon (diet prep/cook stats).
function FieldStat({ icon: Icon, label, value, className }) {
	return (
		<div className={cn("flex items-start gap-3", className)}>
			{Icon ? (
				<span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-(--jh-radius-sm) bg-secondary text-muted-foreground">
					<Icon size={18} />
				</span>
			) : null}
			<div>
				<p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
				<p className="text-sm font-semibold text-foreground">{value}</p>
			</div>
		</div>
	);
}

export { FieldStat };
