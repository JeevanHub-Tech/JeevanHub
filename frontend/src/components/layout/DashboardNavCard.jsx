import { NavLink } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Clickable nav tile for dashboard hub screens (DoctorHomeScreen,
// RetailerDashboard, AdminPage). One implementation, configured per caller,
// instead of each role hand-rolling its own button grid + CSS.
function DashboardNavCard({ to, icon: Icon, label, description, badge, className }) {
	return (
		<NavLink
			to={to}
			className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
		>
			<Card
				className={cn(
					"cursor-pointer ring-foreground/10 transition-colors hover:bg-muted/60 hover:ring-foreground/20",
					className,
				)}
			>
				<CardContent className="flex items-center gap-3">
					{Icon ? (
						<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<Icon className="size-5" aria-hidden="true" />
						</span>
					) : null}
					<span className="min-w-0 flex-1">
						<span className="flex items-center gap-1.5">
							<span className="truncate text-sm font-semibold text-foreground">{label}</span>
							{badge > 0 ? (
								<Badge variant="destructive" className="h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
									{badge}
								</Badge>
							) : null}
						</span>
						{description ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{description}</span> : null}
					</span>
				</CardContent>
			</Card>
		</NavLink>
	);
}

export { DashboardNavCard };
