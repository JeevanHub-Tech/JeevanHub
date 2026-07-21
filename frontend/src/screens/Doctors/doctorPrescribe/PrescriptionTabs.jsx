import { useState } from "react";
import { Pill, Salad, HeartPulse, FileText } from "lucide-react";

import { MedicineForm } from "./MedicineForm";
import { DietPlanForm } from "./DietPlanForm";
import { YogaPlanForm } from "./YogaPlanForm";
import { MedicalHistoryViewer } from "./MedicalHistoryViewer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const tabs = [
	{ id: "medicine", label: "Medicine", Icon: Pill },
	{ id: "diet", label: "Diet Plan", Icon: Salad },
	{ id: "yoga", label: "Yoga / Wellness", Icon: HeartPulse },
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
			case "history":
				return <MedicalHistoryViewer patientId={patientId} />;
			default:
				return null;
		}
	};

	return (
		<Card className="mx-auto max-w-[1800px] p-6">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="mb-6 grid h-auto grid-cols-2 sm:grid-cols-4">
					{tabs.map(({ id, label, Icon }) => (
						<TabsTrigger key={id} value={id}>
							<Icon data-icon="inline-start" />
							{label}
						</TabsTrigger>
					))}
				</TabsList>
				<TabsContent value={activeTab}>{renderForm()}</TabsContent>
			</Tabs>
		</Card>
	);
}
