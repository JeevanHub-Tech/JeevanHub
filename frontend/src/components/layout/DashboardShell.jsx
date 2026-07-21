import { cn } from "@/lib/utils";

// Shared content shell for authenticated dashboard screens (Doctor, Retailer,
// Admin, Patient home/hub pages). Navbar clearance comes from RoutePageShell
// (App.jsx) - this only owns the max-width/padding grid all four roles share.
function DashboardShell({ children, className }) {
	return (
		<main className={cn("min-h-screen bg-background", className)}>
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
		</main>
	);
}

function DashboardPageHeader({ title, description, actions, className }) {
	return (
		<div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
			<div>
				<h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
				{description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
			</div>
			{actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
		</div>
	);
}

export { DashboardShell, DashboardPageHeader };
