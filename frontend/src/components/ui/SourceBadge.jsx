import { Sparkles, UserCheck, PenLine, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Shared AI-vs-doctor provenance labels, matching backend/constants/contentSource.js
// exactly so the same status string drives both the DB and the UI.
export const SOURCE_LABELS = {
    ai: "AI Generated",
    doctor: "Doctor Provided",
    ai_modified: "AI Generated + Doctor Modified",
    doctor_approved: "Doctor Approved",
};

// Doctor-approved content always outranks AI-only content in the UI hierarchy.
export const SOURCE_ORDER = ["ai", "ai_modified", "doctor", "doctor_approved"];

const SOURCE_CONFIG = {
    ai: { variant: "secondary", icon: Sparkles },
    doctor: { variant: "success", icon: Stethoscope },
    ai_modified: { variant: "warning", icon: PenLine },
    doctor_approved: { variant: "success", icon: UserCheck },
};

export function SourceBadge({ status, className, ...props }) {
    const config = SOURCE_CONFIG[status] || SOURCE_CONFIG.ai;
    const label = SOURCE_LABELS[status] || SOURCE_LABELS.ai;
    const Icon = config.icon;
    return (
        <Badge variant={config.variant} className={className} {...props}>
            <Icon className="size-3" aria-hidden="true" />
            {label}
        </Badge>
    );
}

export default SourceBadge;
