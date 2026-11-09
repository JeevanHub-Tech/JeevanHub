import { useContext } from "react";
import { Users, Stethoscope, Store, Receipt, Newspaper, ShieldCheck, FileClock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { DashboardNavCard } from "@/components/layout/DashboardNavCard";
import { AuthContext } from "@/context/AuthContext";

const AdminDashboard = () => {
	const { t } = useTranslation();
	const { auth } = useContext(AuthContext);

	const sections = [
		{ to: "/admin/users", icon: Users, label: t("adminDashboard.patientManagement", "Patient Management"), description: t("adminDashboard.patientManagementDesc", "View and manage patient accounts") },
		{ to: "/admin/consultations", icon: Stethoscope, label: t("adminDashboard.doctorManagement", "Doctor Management"), description: t("adminDashboard.doctorManagementDesc", "Review doctors and consultations") },
		{ to: "/admin/retailers", icon: Store, label: t("adminDashboard.retailerVerification", "Retailer Management & Verification"), description: t("adminDashboard.retailerVerificationDesc", "Manage retailers, verify onboarding & bank accounts") },
		{ to: "/admin/medicine-orders", icon: Store, label: t("adminDashboard.retailerManagement", "Medicine Orders"), description: t("adminDashboard.retailerManagementDesc", "Track retailer medicine orders") },
		{ to: "/admin/transactions", icon: Receipt, label: t("adminDashboard.transactions", "Transactions"), description: t("adminDashboard.transactionsDesc", "Track platform payments") },
		{ to: "/admin/blogs", icon: Newspaper, label: t("adminDashboard.blogs", "Blogs"), description: t("adminDashboard.blogsDesc", "Manage published articles") },
	];

	if (auth.user?.permissions?.manageAdmins) {
		sections.push({ to: "/admin/management", icon: ShieldCheck, label: t("adminDashboard.adminManagement"), description: t("adminDashboard.adminManagementDesc") });
		sections.push({ to: "/admin/audit-logs", icon: FileClock, label: t("adminDashboard.auditLogs"), description: t("adminDashboard.auditLogsDesc") });
	}

	return (
		<DashboardShell>
			<DashboardPageHeader title={t("adminDashboard.title")} description={t("adminDashboard.description")} />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{sections.map((section) => (
					<DashboardNavCard key={section.to} {...section} />
				))}
			</div>
		</DashboardShell>
	);
};

export default AdminDashboard;
