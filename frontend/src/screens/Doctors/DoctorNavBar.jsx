import React from "react";
import { useTranslation } from "react-i18next";

import DashboardNavbar from "@/components/layout/DashboardNavbar";

function DoctorNavBar() {
	const { t } = useTranslation();

	const navItems = [
		{ label: t("nav.home", "Home"), to: "/doctor-home" },
		{ label: t("nav.appointmentSlots", "Appointment Slots"), to: "/appointment-slots" },
		{ label: t("nav.patientList", "Patient List"), to: "/patient-list" },
		{ label: t("nav.appointmentHistory", "Appointment History"), to: "/appointment-history" },
		{ label: t("nav.patientReviews", "Patient's Reviews"), to: "/doctor-reviews" },
		{ label: t("nav.analytics", "Analytics"), to: "/doctor-analytics" },
		{ label: t("nav.myHealthBlogs", "My Health Blogs"), to: "/health-blogs" },
	];

	return (
		<DashboardNavbar
			navItems={navItems}
			profileTo="/profile/doctor"
			notificationsTo="/doctor-notifications"
			logoTo="/doctor-home"
		/>
	);
}

export default DoctorNavBar;
