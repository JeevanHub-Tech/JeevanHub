import { useContext } from "react";
import { UserRound, PackageSearch, BarChart3, ClipboardList, Headset } from "lucide-react";

import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { DashboardNavCard } from "@/components/layout/DashboardNavCard";
import { AuthContext } from "@/context/AuthContext";

const navCards = [
	{ to: "/profile/retailer", icon: UserRound, label: "Your Profile", description: "View and edit your retailer profile" },
	{ to: "/manage-products", icon: PackageSearch, label: "Manage Products", description: "Add and update your listings" },
	{ to: "/retailer-analytics", icon: BarChart3, label: "Analytics", description: "Track sales and performance" },
	{ to: "/my-orders", icon: ClipboardList, label: "My Orders", description: "Review incoming orders" },
	{ to: "/customer-support", icon: Headset, label: "Customer Support", description: "Get help with your account" },
];

function RetailerDashboard() {
	const { auth } = useContext(AuthContext);
	const firstName = auth.user?.firstName || "Retailer";

	return (
		<DashboardShell>
			<DashboardPageHeader
				title={`Hi ${firstName}!`}
				description="Welcome back! Let's showcase your products and connect with potential buyers effortlessly."
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
