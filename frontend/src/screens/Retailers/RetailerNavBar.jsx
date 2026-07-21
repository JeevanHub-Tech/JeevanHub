import React from "react";
import { useLocation } from "react-router-dom";

import DashboardNavbar from "@/components/layout/DashboardNavbar";

function RetailerNavBar() {
	const location = useLocation();
	const onManageProducts = location.pathname.includes("/manage-products");

	const navItems = [
		{ label: "Home", to: "/retailer-home" },
		...(onManageProducts
			? [
					{ label: "Add items", to: "/manage-products/add" },
					{ label: "My items", to: "/manage-products/items" },
				]
			: [{ label: "Products", to: "/manage-products/items" }]),
		{ label: "Orders", to: "/my-orders" },
		{ label: "Analytics", to: "/retailer-analytics" },
		{ label: "Customer Support", to: "/customer-support" },
	];

	return (
		<DashboardNavbar
			navItems={navItems}
			profileTo="/profile/retailer"
			notificationsTo="/retailer-notifications"
			logoTo="/retailer-home"
		/>
	);
}

export default RetailerNavBar;
