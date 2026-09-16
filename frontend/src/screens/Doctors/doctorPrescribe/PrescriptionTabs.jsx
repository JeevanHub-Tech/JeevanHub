import { useState, useEffect } from "react";
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
	{ id: "medicine", label: "Medicines & Supplements", Icon: Pill },
	{ id: "diet", label: "Diet & Meal Planner", Icon: Salad },
	{ id: "yoga", label: "Yoga & Lifestyle", Icon: HeartPulse },
	{ id: "wellness", label: "Other Wellness", Icon: Leaf },
	{ id: "history", label: "Medical History", Icon: FileText },
];

export function PrescriptionTabs({ bookingId, patientId, doctorId, dietPlanRequested, defaultTab, onPrescribed }) {
	const [activeTab, setActiveTab] = useState(defaultTab || "medicine");

	useEffect(() => {
		if (defaultTab) {
			setActiveTab(defaultTab);
		}
	}, [defaultTab]);

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
		<Card className="flex w-full min-w-0 flex-col gap-6 p-4 sm:p-6 shadow-(--jh-shadow-rest)">
			{/* Read-only view of the patient's Prakriti assessment + wellness
			    profile -- the same inputs AI generation uses -- so the doctor has
			    context before reviewing/editing the Diet & Yoga panels below. */}
			<div className="rounded-(--jh-radius-lg) border border-border p-4">
				<AyurvedaDashboard patientId={patientId} readOnly embedded />
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
				<div className="w-full min-w-0 mb-6">
					<TabsList className="grid w-full h-auto grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5 p-1.5 bg-muted/60 rounded-xl">
						{tabs.map(({ id, label, Icon }) => (
							<TabsTrigger
								key={id}
								value={id}
								className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-xs"
							>
								<Icon size={15} className="shrink-0 text-primary" />
								<span className="truncate">{label}</span>
								{id === "diet" && dietPlanRequested ? (
									<span className="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
										Paid
									</span>
								) : null}
							</TabsTrigger>
						))}
					</TabsList>
				</div>
				<TabsContent value={activeTab} className="min-w-0 w-full">{renderForm()}</TabsContent>
			</Tabs>
		</Card>
	);
}
