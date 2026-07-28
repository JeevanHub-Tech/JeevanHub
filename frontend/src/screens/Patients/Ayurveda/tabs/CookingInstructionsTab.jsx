import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

function CookingInstructionsTab({ plan }) {
	const meals = plan?.cookingInstructions?.meals || [];
	const guidelines = plan?.cookingInstructions?.generalGuidelines || [];

	if (!plan) {
		return <EmptyState title="No cooking instructions yet" description="Generate a diet plan from the Overview tab to see cooking guidance." />;
	}

	return (
		<div className="flex flex-col gap-4">
			{meals.map((m, i) => (
				<Card key={i}>
					<CardHeader><CardTitle className="text-base">{m.mealContext}</CardTitle></CardHeader>
					<CardContent className="flex flex-col gap-2 text-sm">
						<p><span className="font-medium text-foreground">Cooking method: </span><span className="text-muted-foreground">{m.cookingMethod}</span></p>
						<p><span className="font-medium text-foreground">Preparation style: </span><span className="text-muted-foreground">{m.preparationStyle}</span></p>
						{m.spicesHerbs?.length ? (
							<div className="flex flex-wrap gap-1.5">
								{m.spicesHerbs.map((s, j) => <Badge key={j} variant="secondary">{s}</Badge>)}
							</div>
						) : null}
						{m.goodCombinations?.length ? (
							<p><span className="font-medium text-foreground">Combine with: </span><span className="text-muted-foreground">{m.goodCombinations.join(", ")}</span></p>
						) : null}
						{m.avoidCombinations?.length ? (
							<p><span className="font-medium text-destructive">Avoid combining with: </span><span className="text-muted-foreground">{m.avoidCombinations.join(", ")}</span></p>
						) : null}
					</CardContent>
				</Card>
			))}

			{guidelines.length ? (
				<Card>
					<CardHeader><CardTitle className="text-base">General guidelines</CardTitle></CardHeader>
					<CardContent>
						<ul className="list-disc pl-5 text-sm text-muted-foreground">
							{guidelines.map((g, i) => <li key={i}>{g}</li>)}
						</ul>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}

export default CookingInstructionsTab;
