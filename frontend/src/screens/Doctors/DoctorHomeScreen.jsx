import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { CalendarRange, ClipboardList, Users, BarChart3, BookOpen, Star } from "lucide-react";

import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { DashboardNavCard } from "@/components/layout/DashboardNavCard";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/AuthContext";

const navCards = [
	{ to: "/appointment-slots", icon: CalendarRange, label: "Appointment Slots", description: "Manage your availability" },
	{ to: "/patient-list", icon: Users, label: "Patient List", description: "View patients under your care" },
	{ to: "/doctor-analytics", icon: BarChart3, label: "Analytics", description: "Track consultations and growth" },
	{ to: "/health-blogs", icon: BookOpen, label: "My Health Blogs", description: "Publish and manage articles" },
	{ to: "/doctor-reviews", icon: Star, label: "Patient's Reviews", description: "See feedback from patients" },
];

function DoctorHomeScreen() {
	const { auth } = useContext(AuthContext);
	const firstName = auth.user?.firstName || "Doctor";

	return (
		<DashboardShell>
			<DashboardPageHeader
				title={`Hi Dr. ${firstName}`}
				description="Welcome back! Let's manage appointments and patient records efficiently."
				actions={
					<Button render={<NavLink to="/current-requests" />}>
						<ClipboardList data-icon="inline-start" />
						Current Requests
					</Button>
				}
			/>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{navCards.map((card) => (
					<DashboardNavCard key={card.to} {...card} />
				))}
			</div>
		</DashboardShell>
	);
}

export default DoctorHomeScreen;
