import { CheckCircle2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/date";

// `isDoctorView`: the doctor's escape hatch when the patient hasn't
// generated a plan yet -- one concise Generate button, same as the
// patient's. Once a plan exists the doctor edits it via the Diet/Yoga
// panels' own Edit -> Save instead, so this becomes a disabled
// "Patient already generated" marker rather than a live Regenerate control
// (regenerating is the patient's call, not the doctor's).
function OverviewTab({ plan, isStale, readOnly, isDoctorView, onRegenerate, onDelete, onGenerate, generating, missingPrereqs }) {
	const { t } = useTranslation();

	if (!plan) {
		return (
			<EmptyState
				icon={Sparkles}
				title={t("ayurvedaDashboard.overview.noPlanTitle", "No plan yet")}
				description={isDoctorView
					? t("ayurvedaDashboard.overview.noPlanDoctorDesc", "This patient hasn't generated a plan yet. You can generate one now (from their Prakriti + wellness profile).")
					: missingPrereqs?.length
						? t("ayurvedaDashboard.overview.completePrereqs", "Complete {{prereqs}} first.", { prereqs: missingPrereqs.join(" and ") })
						: t("ayurvedaDashboard.overview.noPlanPatientDesc", "Generate a personalized Ayurvedic diet and yoga plan based on your dosha, health, and lifestyle.")}
				action={!readOnly || isDoctorView ? (
					<Button onClick={onGenerate} disabled={generating}>
						<Sparkles size={16} /> {generating ? t("ayurvedaDashboard.overview.generating", "Generating…") : t("ayurvedaDashboard.overview.generatePlan", "Generate plan")}
					</Button>
				) : null}
			/>
		);
	}

	if (isDoctorView) {
		return (
			<Button size="sm" variant="outline" disabled className="w-fit">
				<CheckCircle2 size={14} /> {t("ayurvedaDashboard.overview.patientAlreadyGenerated", "Patient already generated")}
			</Button>
		);
	}

	if (readOnly) return null;

	const isDoctorEdited = Boolean(plan?.doctorReview?.published || plan?.status === "doctor_approved" || plan?.status === "ai_modified");

	return (
		<div className="flex flex-wrap items-center justify-between gap-3">
			{isStale ? (
				<Badge variant="warning">{t("ayurvedaDashboard.overview.planOutdated", "Plan may be outdated -- profile or assessment changed since it was generated")}</Badge>
			) : (
				<span className="text-xs text-muted-foreground">{t("ayurvedaDashboard.overview.generatedOn", "Generated on {{date}}", { date: formatDate(plan.generatedAt) })}</span>
			)}
			<div className="flex gap-2">
				{!isDoctorEdited && (
					<Button size="sm" variant="outline" onClick={onRegenerate} disabled={generating}>
						<RefreshCw size={14} /> {generating ? t("ayurvedaDashboard.overview.regenerating", "Regenerating…") : t("ayurvedaDashboard.overview.regeneratePlan", "Regenerate plan")}
					</Button>
				)}
				<Button size="sm" variant="outline" onClick={onDelete} disabled={generating}>
					<Trash2 size={14} /> {t("ayurvedaDashboard.overview.deletePlan", "Delete plan")}
				</Button>
			</div>
		</div>
	);
}

export default OverviewTab;
