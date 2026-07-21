import { Headset } from "lucide-react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function CustomerSupport() {
	return (
		<DashboardShell>
			<Card className="mx-auto flex max-w-2xl flex-col items-center gap-5 p-10 text-center sm:p-14">
				<div className="flex size-24 items-center justify-center rounded-full bg-primary/10">
					<Headset className="size-11 text-primary" />
				</div>
				<h1 className="text-3xl font-bold text-foreground">Customer Support</h1>
				<p className="max-w-md text-lg leading-relaxed text-muted-foreground">
					We are building a dedicated support center to assist you with your queries and concerns. Our team is working
					hard to bring this feature to you very soon!
				</p>
				<Badge variant="secondary" className="uppercase tracking-wide">
					Coming Soon
				</Badge>
			</Card>
		</DashboardShell>
	);
}

export default CustomerSupport;
