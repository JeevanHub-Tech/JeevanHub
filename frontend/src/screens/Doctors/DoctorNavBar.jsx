import React from "react";

import DashboardNavbar from "@/components/layout/DashboardNavbar";

function DoctorNavBar() {
	const navItems = [
		{ label: "Home", to: "/doctor-home" },
		{ label: "Appointment Slots", to: "/appointment-slots" },
		{ label: "Patient List", to: "/patient-list" },
		{ label: "Appointment History", to: "/appointment-history" },
		{ label: "Patient's Reviews", to: "/doctor-reviews" },
		{ label: "Analytics", to: "/doctor-analytics" },
		{ label: "My Health Blogs", to: "/health-blogs" },
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
