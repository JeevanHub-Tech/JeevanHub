import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pill, Salad, HeartPulse, Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MedicinesHerbsSupplementsTab from "./MedicinesHerbsSupplementsTab";
import WeeklyMealPlannerSection from "./WeeklyMealPlannerSection";
import YogaLifestyleTab from "./YogaLifestyleTab";
import OtherWellnessTab from "./OtherWellnessTab";
import AyurvedaDashboard from "../Ayurveda/AyurvedaDashboard";

const TAB_DEFS = [
	{ id: "medicines", key: "prescriptionWellness.tabMedicines", fallback: "Medicines, Herbs & Supplements", Icon: Pill },
	{ id: "diet", key: "prescriptionWellness.tabDiet", fallback: "Diet / Weekly Meal Planner", Icon: Salad },
	{ id: "yoga", key: "prescriptionWellness.tabYoga", fallback: "Yoga & Lifestyle", Icon: HeartPulse },
	{ id: "wellness", key: "prescriptionWellness.tabWellness", fallback: "Other Wellness Recommendations", Icon: Leaf },
];
const TAB_IDS = TAB_DEFS.map((t) => t.id);

function PrescriptionWellnessPage() {
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const requestedTab = searchParams.get("tab");
	const activeTab = TAB_IDS.includes(requestedTab) ? requestedTab : "diet";
	const setActiveTab = (id) => setSearchParams((prev) => {
		const next = new URLSearchParams(prev);
		next.set("tab", id);
		return next;
	}, { replace: true });

	const [planRefreshKey, setPlanRefreshKey] = useState(0);

	return (
		<main className="bg-background">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
				<div>
					<h1 className="font-display text-2xl text-foreground">
						{t("prescriptionWellness.title", "Prescription & Wellness")}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("prescriptionWellness.subtitle", "Your medicines, meal plan, yoga routine, and wellness recommendations -- all in one place.")}
					</p>
				</div>

				<div className="rounded-(--jh-radius-lg) border border-border p-4">
					<AyurvedaDashboard embedded onPlanChanged={() => setPlanRefreshKey((k) => k + 1)} />
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<div className="-mx-4 overflow-x-auto overflow-y-hidden px-4 sm:mx-0 sm:px-0 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
						<TabsList className="h-auto w-max min-w-full sm:w-full">
							{TAB_DEFS.map(({ id, key, fallback, Icon }) => (
								<TabsTrigger key={id} value={id} className="shrink-0">
									<Icon data-icon="inline-start" />
									{t(key, fallback)}
								</TabsTrigger>
							))}
						</TabsList>
					</div>
					<TabsContent value="medicines"><MedicinesHerbsSupplementsTab /></TabsContent>
					<TabsContent value="diet"><WeeklyMealPlannerSection key={planRefreshKey} /></TabsContent>
					<TabsContent value="yoga"><YogaLifestyleTab key={planRefreshKey} /></TabsContent>
					<TabsContent value="wellness"><OtherWellnessTab /></TabsContent>
				</Tabs>
			</div>
		</main>
	);
}

export default PrescriptionWellnessPage;
