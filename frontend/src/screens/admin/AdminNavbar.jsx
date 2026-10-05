import React from "react";
import { useTranslation } from "react-i18next";

import DashboardNavbar from "@/components/layout/DashboardNavbar";

function AdminNavBar() {
	const { t } = useTranslation();

	const navItems = [
		{ label: t("adminNav.dashboard"), to: "/admin-home" },
		{ label: t("adminNav.home"), to: "/" },
		{ label: t("adminNav.treatments"), to: "/treatments" },
		{ label: t("adminNav.doctors"), to: "/doctors" },
		{ label: t("adminNav.medicines"), to: "/medicines" },
		{ label: t("adminNav.blogsAndVideos"), to: "/blogs-videos" },
	];

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
