import { RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

function OverviewTab({ plan, isStale, readOnly, onRegenerate, onDelete, onGenerate, generating, missingPrereqs }) {
	if (!plan) {
		return (
			<EmptyState
				icon={Sparkles}
				title="No diet plan yet"
				description={readOnly
					? "This patient hasn't generated a diet plan yet."
					: missingPrereqs?.length
						? `Complete ${missingPrereqs.join(" and ")} first.`
						: "Generate a personalized Ayurvedic diet plan based on your dosha, health, and lifestyle."}
				action={!readOnly ? (
					<Button onClick={onGenerate} disabled={generating}>
						<Sparkles size={16} /> {generating ? "Generating…" : "Generate personalized diet plan"}
					</Button>
				) : null}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			{!readOnly ? (
				<div className="flex flex-wrap items-center justify-between gap-3">
					{isStale ? (
						<Badge variant="warning">Plan may be outdated -- profile or assessment changed since it was generated</Badge>
					) : (
						<span className="text-xs text-muted-foreground">Generated {new Date(plan.generatedAt).toLocaleDateString()}</span>
					)}
					<div className="flex gap-2">
						<Button size="sm" variant="outline" onClick={onRegenerate} disabled={generating}>
							<RefreshCw size={14} /> {generating ? "Regenerating…" : "Regenerate plan"}
						</Button>
						<Button size="sm" variant="outline" onClick={onDelete} disabled={generating}>
							<Trash2 size={14} /> Delete plan
						</Button>
					</div>
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
