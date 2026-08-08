import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pill, Salad, HeartPulse, Leaf } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MedicinesHerbsSupplementsTab from "./MedicinesHerbsSupplementsTab";
import WeeklyMealPlannerSection from "./WeeklyMealPlannerSection";
import YogaLifestyleTab from "./YogaLifestyleTab";
import OtherWellnessTab from "./OtherWellnessTab";
import AyurvedaDashboard from "../Ayurveda/AyurvedaDashboard";

// Unified "Prescription & Wellness" section (replaces the previously
// separate "Prescription" / diet-yoga page and "Ayurveda wellness" page):
// Medicines, Herbs & Supplements | Diet / Weekly Meal Planner |
// Yoga & Lifestyle | Other Wellness Recommendations.
const TABS = [
	{ id: "medicines", label: "Medicines, Herbs & Supplements", Icon: Pill },
	{ id: "diet", label: "Diet / Weekly Meal Planner", Icon: Salad },
	{ id: "yoga", label: "Yoga & Lifestyle", Icon: HeartPulse },
	{ id: "wellness", label: "Other Wellness Recommendations", Icon: Leaf },
];
const TAB_IDS = TABS.map((t) => t.id);

function PrescriptionWellnessPage() {
	// Active tab lives in the URL (not local state) so navigating away (e.g.
	// clicking a medicine link) and coming back restores the same tab instead
	// of resetting to the default.
	const [searchParams, setSearchParams] = useSearchParams();
	const requestedTab = searchParams.get("tab");
	const activeTab = TAB_IDS.includes(requestedTab) ? requestedTab : "diet";
	const setActiveTab = (id) => setSearchParams((prev) => {
		const next = new URLSearchParams(prev);
		next.set("tab", id);
		return next;
	}, { replace: true });

	// Wellness intake (profile/dosha) sits above the tabs, always visible --
	// it's the input that feeds AI generation for the tabs below, not one of
	// the tabs itself. Bumping planRefreshKey remounts
	// WeeklyMealPlannerSection so it refetches after the patient updates
	// their intake info.
	const [planRefreshKey, setPlanRefreshKey] = useState(0);

	return (
		<main className="bg-background">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
				<div>
					<h1 className="font-display text-2xl text-foreground">Prescription & Wellness</h1>
					<p className="text-sm text-muted-foreground">
						Your medicines, meal plan, yoga routine, and wellness recommendations -- all in one place.
					</p>
				</div>

				<div className="rounded-(--jh-radius-lg) border border-border p-4">
					<AyurvedaDashboard embedded onPlanChanged={() => setPlanRefreshKey((k) => k + 1)} />
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<div className="-mx-4 overflow-x-auto overflow-y-hidden px-4 sm:mx-0 sm:px-0 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
						<TabsList className="h-auto w-max min-w-full sm:w-full">
							{TABS.map(({ id, label, Icon }) => (
								<TabsTrigger key={id} value={id} className="shrink-0">
									<Icon data-icon="inline-start" />
									{label}
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
