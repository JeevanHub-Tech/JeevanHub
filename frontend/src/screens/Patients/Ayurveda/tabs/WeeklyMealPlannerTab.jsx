import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

function MealCell({ meal }) {
	if (!meal || !meal.items?.length) return <span className="text-muted-foreground">-</span>;
	return (
		<div className="flex flex-col gap-1 py-1 text-xs">
			<ul className="list-disc pl-4 text-foreground">
				{meal.items.map((item, i) => <li key={i}>{item}</li>)}
			</ul>
			{meal.portion ? <p className="text-muted-foreground">Portion: {meal.portion}</p> : null}
			{meal.purpose ? <p className="italic text-muted-foreground">{meal.purpose}</p> : null}
		</div>
	);
}

function WeeklyMealPlannerTab({ plan }) {
	if (!plan || !plan.weeklyPlan?.length) {
		return <EmptyState title="No weekly plan yet" description="Generate a diet plan from the Overview tab to see the 7-day meal planner." />;
	}

	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Day</TableHead>
						<TableHead>Breakfast</TableHead>
						<TableHead>Mid Morning</TableHead>
						<TableHead>Lunch</TableHead>
						<TableHead>Evening Snack</TableHead>
						<TableHead>Dinner</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{plan.weeklyPlan.map((day) => (
						<TableRow key={day.day} className="align-top">
							<TableCell className="font-medium whitespace-nowrap">{day.day}</TableCell>
							<TableCell className="min-w-40 whitespace-normal align-top"><MealCell meal={day.breakfast} /></TableCell>
							<TableCell className="min-w-40 whitespace-normal align-top"><MealCell meal={day.midMorning} /></TableCell>
							<TableCell className="min-w-40 whitespace-normal align-top"><MealCell meal={day.lunch} /></TableCell>
							<TableCell className="min-w-40 whitespace-normal align-top"><MealCell meal={day.eveningSnack} /></TableCell>
							<TableCell className="min-w-40 whitespace-normal align-top"><MealCell meal={day.dinner} /></TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

export default WeeklyMealPlannerTab;
