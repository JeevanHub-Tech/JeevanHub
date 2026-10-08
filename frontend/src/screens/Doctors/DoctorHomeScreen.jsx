import { useContext } from "react";
import { NavLink } from "react-router-dom";
import { CalendarRange, Users, BarChart3, BookOpen, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { DashboardNavCard } from "@/components/layout/DashboardNavCard";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/context/AuthContext";

function DoctorHomeScreen() {
	const { t } = useTranslation();
	const { auth } = useContext(AuthContext);
	const firstName = auth.user?.firstName || "Doctor";

	const navCards = [
		{
			to: "/appointment-slots",
			icon: CalendarRange,
			label: t("doctorHome.cards.appointmentSlots", "Appointment Slots"),
			description: t("doctorHome.cards.appointmentSlotsDesc", "Manage your availability"),
		},
		{
			to: "/patient-list",
			icon: Users,
			label: t("doctorHome.cards.patientList", "Patient List"),
			description: t("doctorHome.cards.patientListDesc", "View patients under your care"),
		},
		{
			to: "/doctor-analytics",
			icon: BarChart3,
			label: t("doctorHome.cards.analytics", "Analytics"),
			description: t("doctorHome.cards.analyticsDesc", "Track consultations and growth"),
		},
		{
			to: "/health-blogs",
			icon: BookOpen,
			label: t("doctorHome.cards.healthBlogs", "My Health Blogs"),
			description: t("doctorHome.cards.healthBlogsDesc", "Publish and manage articles"),
		},
		{
			to: "/doctor-reviews",
			icon: Star,
			label: t("doctorHome.cards.patientReviews", "Patient's Reviews"),
			description: t("doctorHome.cards.patientReviewsDesc", "See feedback from patients"),
		},
	];

	return (
		<DashboardShell>
			<DashboardPageHeader
				title={t("doctorHome.greeting", "Hi Dr. {{name}}", { name: firstName })}
				description={t("doctorHome.description", "Welcome back! Let's manage appointments and patient records efficiently.")}
				actions={
					<Button render={<NavLink to="/appointment-slots" />}>
						<CalendarRange data-icon="inline-start" />
						{t("doctorHome.todayAppointments", "Today's Appointments")}
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
