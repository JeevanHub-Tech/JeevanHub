import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

function OverviewTab({ plan, isStale, onGenerate, generating, readOnly }) {
	if (!plan) {
		return (
			<EmptyState
				icon={Sparkles}
				title="No diet plan yet"
				description="Generate a personalized Ayurvedic diet plan based on this patient's dosha, health, and lifestyle."
				action={!readOnly ? <Button onClick={onGenerate} disabled={generating}>{generating ? "Generating…" : "Generate plan"}</Button> : null}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{!readOnly ? (
				<div className="flex items-center justify-between gap-3">
					{isStale ? (
						<Badge variant="warning">Plan may be outdated -- profile or assessment changed since it was generated</Badge>
					) : (
						<span className="text-xs text-muted-foreground">Generated {new Date(plan.generatedAt).toLocaleDateString()}</span>
					)}
					<Button size="sm" variant="outline" onClick={onGenerate} disabled={generating}>
						<RefreshCw size={14} /> {generating ? "Regenerating…" : "Regenerate plan"}
					</Button>
				</div>
			) : null}

			<Card>
				<CardHeader><CardTitle className="text-base">Patient health summary</CardTitle></CardHeader>
				<CardContent className="flex flex-col gap-2 text-sm">
					<p className="text-foreground">{plan.summary?.prakritiSummary}</p>
					{plan.summary?.healthConsiderations?.length ? (
						<ul className="list-disc pl-5 text-muted-foreground">
							{plan.summary.healthConsiderations.map((c, i) => <li key={i}>{c}</li>)}
						</ul>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle className="text-base">Why this plan</CardTitle></CardHeader>
				<CardContent className="flex flex-col gap-3 text-sm">
					<div>
						<p className="font-medium text-foreground">Dosha balance</p>
						<p className="text-muted-foreground">{plan.explanation?.doshaBalanceReasoning}</p>
					</div>
					{plan.explanation?.medicalConditionReasoning ? (
						<div>
							<p className="font-medium text-foreground">Medical considerations</p>
							<p className="text-muted-foreground">{plan.explanation.medicalConditionReasoning}</p>
						</div>
					) : null}
					{plan.explanation?.seasonalReasoning ? (
						<div>
							<p className="font-medium text-foreground">Seasonal benefits</p>
							<p className="text-muted-foreground">{plan.explanation.seasonalReasoning}</p>
						</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}

export default OverviewTab;
