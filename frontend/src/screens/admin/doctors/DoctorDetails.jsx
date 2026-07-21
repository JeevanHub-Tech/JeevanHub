import { Briefcase, GraduationCap } from "lucide-react";

import { Card } from "@/components/ui/card";

const DetailsTab = ({ doctor }) => {
	if (!doctor) return null;

	return (
		<Card className="p-6">
			<h3 className="flex items-center gap-2 border-b border-border pb-4 text-xl font-semibold text-foreground">
				<Briefcase className="size-5" /> Professional Details
			</h3>
			<div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
				<div className="flex flex-col rounded-lg border border-border bg-muted/40 p-5 transition-transform hover:-translate-y-0.5 hover:shadow-md">
					<h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
						<GraduationCap className="size-4 text-primary" /> Education & Certificate
					</h4>
					<ul className="flex flex-col gap-4">
						<li className="flex flex-col text-foreground/80">
							<span className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">Education:</span>
							{doctor.education || "Not specified"}
						</li>
						<li className="flex flex-col text-foreground/80">
							<span className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">Certificate:</span>
							{doctor.certificate ? (
								<a
									href={doctor.certificate}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary underline hover:no-underline"
								>
									View Certificate
								</a>
							) : (
								"Not provided"
							)}
						</li>
					</ul>
				</div>

				<div className="flex flex-col rounded-lg border border-border bg-muted/40 p-5 transition-transform hover:-translate-y-0.5 hover:shadow-md">
					<h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
						<Briefcase className="size-4 text-primary" /> Professional Info
					</h4>
					<p className="mb-4 flex flex-col text-foreground/80">
						<span className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">Specialization:</span>
						{doctor.specialization?.length > 0 ? doctor.specialization.join(", ") : "Not specified"}
					</p>
					<p className="mb-4 flex flex-col text-foreground/80">
						<span className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">Experience:</span>
						{doctor.experience || 0} years
					</p>
					<p className="mb-0 flex flex-col text-foreground/80">
						<span className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground">Zip Code:</span>
						{typeof doctor.zipCode === "object" && doctor.zipCode !== null
							? doctor.zipCode.specific || doctor.zipCode.pincode || "Not specified"
							: doctor.zipCode || "Not specified"}
					</p>
				</div>
			</div>
		</Card>
	);
};

export default DetailsTab;
