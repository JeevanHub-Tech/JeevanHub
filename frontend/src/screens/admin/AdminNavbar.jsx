import React from "react";

import DashboardNavbar from "@/components/layout/DashboardNavbar";

const navItems = [
	{ label: "Dashboard", to: "/admin-home" },
	{ label: "Home", to: "/" },
	{ label: "Treatments", to: "/treatments" },
	{ label: "Doctors", to: "/doctors" },
	{ label: "Medicines", to: "/medicines" },
	{ label: "Blogs and Videos", to: "/blogs-videos" },
];

function AdminNavBar() {
	return (
		<DashboardNavbar
			navItems={navItems}
			profileTo="/admin/profile"
			notificationsTo="/notifications"
			logoTo="/admin-home"
		/>
	);
}

export default AdminNavBar;
