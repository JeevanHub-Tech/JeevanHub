import { useContext } from "react";
import { Users, Stethoscope, Store, Receipt, Newspaper, ShieldCheck, FileClock } from "lucide-react";

import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { DashboardNavCard } from "@/components/layout/DashboardNavCard";
import { AuthContext } from "@/context/AuthContext";

const AdminDashboard = () => {
	const { auth } = useContext(AuthContext);

	const sections = [
		{ to: "/admin/users", icon: Users, label: "Patient Management", description: "View and manage patient accounts" },
		{ to: "/admin/consultations", icon: Stethoscope, label: "Doctor Management", description: "Review doctors and consultations" },
		{ to: "/admin/medicine-orders", icon: Store, label: "Retailer Management", description: "Manage retailers and medicine orders" },
		{ to: "/admin/transactions", icon: Receipt, label: "Transactions", description: "Track platform payments" },
		{ to: "/admin/blogs", icon: Newspaper, label: "Blogs", description: "Manage published articles" },
	];

	if (auth.user?.permissions?.manageAdmins) {
		sections.push({ to: "/admin/management", icon: ShieldCheck, label: "Admin Management", description: "Manage admin accounts and roles" });
		sections.push({ to: "/admin/audit-logs", icon: FileClock, label: "Audit Logs", description: "Review admin activity history" });
	}

	return (
		<DashboardShell>
			<DashboardPageHeader title="Admin Dashboard" description="Manage patients, doctors, retailers, and platform content." />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{sections.map((section) => (
					<DashboardNavCard key={section.to} {...section} />
				))}
			</div>
		</DashboardShell>
	);
};

export default AdminDashboard;
