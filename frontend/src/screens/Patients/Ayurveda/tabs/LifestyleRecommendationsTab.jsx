import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

function LifestyleRecommendationsTab({ plan, dosha }) {
	const doshaRecs = [
		...(dosha?.doshaProfile?.primary?.lifestyleRecommendations || []),
		...(dosha?.doshaProfile?.secondary?.lifestyleRecommendations || []),
	];
	const planRecs = plan?.lifestyleRecommendations || [];

	if (!doshaRecs.length && !planRecs.length) {
		return <EmptyState title="No lifestyle recommendations yet" description="Complete the dosha assessment and generate a diet plan to see recommendations here." />;
	}

	return (
		<div className="flex flex-col gap-4">
			{doshaRecs.length ? (
				<Card>
					<CardHeader><CardTitle className="text-base">Based on your Prakriti</CardTitle></CardHeader>
					<CardContent>
						<ul className="list-disc pl-5 text-sm text-muted-foreground">
							{doshaRecs.map((r, i) => <li key={i}>{r}</li>)}
						</ul>
					</CardContent>
				</Card>
			) : null}
			{planRecs.length ? (
				<Card>
					<CardHeader><CardTitle className="text-base">Based on your diet plan</CardTitle></CardHeader>
					<CardContent>
						<ul className="list-disc pl-5 text-sm text-muted-foreground">
							{planRecs.map((r, i) => <li key={i}>{r}</li>)}
						</ul>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}

export default LifestyleRecommendationsTab;
