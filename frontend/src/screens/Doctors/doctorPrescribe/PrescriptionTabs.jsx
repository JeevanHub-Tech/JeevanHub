import { useState } from "react";
import { Pill, Salad, HeartPulse, FileText, Leaf } from "lucide-react";

import { MedicineForm } from "./MedicineForm";
import { DietPlanForm } from "./DietPlanForm";
import { YogaPlanForm } from "./YogaPlanForm";
import { MedicalHistoryViewer } from "./MedicalHistoryViewer";
import { OtherWellnessTab } from "./OtherWellnessTab";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AyurvedaDashboard from "../../Patients/Ayurveda/AyurvedaDashboard";

// "Prescription & Wellness" doctor-facing structure: the same 4 content
// sections the patient sees, plus Medical History.
const tabs = [
	{ id: "medicine", label: "Medicines, Herbs & Supplements", Icon: Pill },
	{ id: "diet", label: "Diet & Weekly Meal Planner", Icon: Salad },
	{ id: "yoga", label: "Yoga & Lifestyle", Icon: HeartPulse },
	{ id: "wellness", label: "Other Wellness Recommendations", Icon: Leaf },
	{ id: "history", label: "Medical History", Icon: FileText },
];

export function PrescriptionTabs({ bookingId, patientId, doctorId, onPrescribed }) {
	const [activeTab, setActiveTab] = useState("medicine");

	const renderForm = () => {
		switch (activeTab) {
			case "medicine":
				return <MedicineForm bookingId={bookingId} patientId={patientId} doctorId={doctorId} onPrescribed={onPrescribed} />;
			case "diet":
				return <DietPlanForm bookingId={bookingId} patientId={patientId} doctorId={doctorId} onPrescribed={onPrescribed} />;
			case "yoga":
				return <YogaPlanForm bookingId={bookingId} patientId={patientId} doctorId={doctorId} onPrescribed={onPrescribed} />;
			case "wellness":
				return <OtherWellnessTab patientId={patientId} bookingId={bookingId} />;
			case "history":
				return <MedicalHistoryViewer patientId={patientId} />;
			default:
				return null;
		}
	};

	return (
		<Card className="mx-auto flex max-w-[1800px] flex-col gap-6 p-6">
			{/* Read-only view of the patient's Prakriti assessment + wellness
			    profile -- the same inputs AI generation uses -- so the doctor has
			    context before reviewing/editing the Diet & Yoga panels below. */}
			<div className="rounded-(--jh-radius-lg) border border-border p-4">
				<AyurvedaDashboard patientId={patientId} readOnly embedded />
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<div className="mb-6 -mx-6 overflow-x-auto overflow-y-hidden px-6 sm:mx-0 sm:px-0 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
					<TabsList className="h-auto w-max min-w-full sm:w-full">
						{tabs.map(({ id, label, Icon }) => (
							<TabsTrigger key={id} value={id} className="shrink-0">
								<Icon data-icon="inline-start" />
								{label}
							</TabsTrigger>
						))}
					</TabsList>
				</div>
				<TabsContent value={activeTab}>{renderForm()}</TabsContent>
			</Tabs>
		</Card>
	);
}
