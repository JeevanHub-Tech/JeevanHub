import React from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import DashboardNavbar from "@/components/layout/DashboardNavbar";

function RetailerNavBar() {
	const { t } = useTranslation();
	const location = useLocation();
	const onManageProducts = location.pathname.includes("/manage-products");

	const navItems = [
		{ label: t("retailerNav.home", "Home"), to: "/retailer-home" },
		...(onManageProducts
			? [
					{ label: t("retailerNav.addItems", "Add items"), to: "/manage-products/add" },
					{ label: t("retailerNav.myItems", "My items"), to: "/manage-products/items" },
				]
			: [{ label: t("retailerNav.products", "Products"), to: "/manage-products/items" }]),
		{ label: t("retailerNav.orders", "Orders"), to: "/my-orders" },
		{ label: t("retailerNav.analytics", "Analytics"), to: "/retailer-analytics" },
		{ label: t("retailerNav.customerSupport", "Customer Support"), to: "/customer-support" },
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
