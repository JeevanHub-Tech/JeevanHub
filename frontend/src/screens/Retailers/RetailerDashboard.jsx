import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { UserRound, PackageSearch, BarChart3, ClipboardList, Headset } from "lucide-react";

import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { DashboardNavCard } from "@/components/layout/DashboardNavCard";
import { AuthContext } from "@/context/AuthContext";

function RetailerDashboard() {
	const { t } = useTranslation();
	const { auth } = useContext(AuthContext);
	const firstName = auth.user?.firstName || "Retailer";

	const navCards = [
		{ to: "/profile/retailer", icon: UserRound, label: t("retailerDashboard.cards.profile", "Your Profile"), description: t("retailerDashboard.cards.profileDesc", "View and edit your retailer profile") },
		{ to: "/manage-products", icon: PackageSearch, label: t("retailerDashboard.cards.manageProducts", "Manage Products"), description: t("retailerDashboard.cards.manageProductsDesc", "Add and update your listings") },
		{ to: "/retailer-analytics", icon: BarChart3, label: t("retailerDashboard.cards.analytics", "Analytics"), description: t("retailerDashboard.cards.analyticsDesc", "Track sales and performance") },
		{ to: "/my-orders", icon: ClipboardList, label: t("retailerDashboard.cards.myOrders", "My Orders"), description: t("retailerDashboard.cards.myOrdersDesc", "Review incoming orders") },
		{ to: "/customer-support", icon: Headset, label: t("retailerDashboard.cards.customerSupport", "Customer Support"), description: t("retailerDashboard.cards.customerSupportDesc", "Get help with your account") },
	];

	return (
		<DashboardShell>
			<DashboardPageHeader
				title={t("retailerDashboard.greeting", "Hi {{name}}!", { name: firstName })}
				description={t("retailerDashboard.description", "Welcome back! Let's showcase your products and connect with potential buyers effortlessly.")}
			/>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{navCards.map((card) => (
					<DashboardNavCard key={card.to} {...card} />
				))}
			</div>
		</DashboardShell>
	);
}

export default RetailerDashboard;
