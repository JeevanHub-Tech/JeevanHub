import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

function AvoidList({ title, items }) {
	if (!items?.length) return null;
	return (
		<Card>
			<CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
			<CardContent>
				<ul className="list-disc pl-5 text-sm text-muted-foreground">
					{items.map((it, i) => <li key={i}>{it}</li>)}
				</ul>
			</CardContent>
		</Card>
	);
}

function FoodsToAvoidTab({ plan }) {
	if (!plan) {
		return <EmptyState title="No avoidance list yet" description="Generate a diet plan from the Overview tab to see foods to avoid." />;
	}

	const avoid = plan.foodsToAvoid || {};
	return (
		<div className="flex flex-col gap-4">
			<AvoidList title="Dosha-aggravating foods" items={avoid.doshaBased} />
			<AvoidList title="Medical-condition considerations" items={avoid.medicalBased} />
			<AvoidList title="Seasonal considerations" items={avoid.seasonalBased} />
		</div>
	);
}

export default FoodsToAvoidTab;
