import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const AdminAuditLogs = () => {
	const { t } = useTranslation();
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchLogs();
	}, []);

	const fetchLogs = async () => {
		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/auth/admin/audit-logs`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				const data = await response.json();
				setLogs(data);
			} else {
				setError("Failed to fetch audit logs.");
			}
		} catch (err) {
			setError("Error fetching logs.");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<DashboardShell>
				<p className="text-center text-muted-foreground">{t("adminAuditLogs.loading")}</p>
			</DashboardShell>
		);
	}

	if (error) {
		return (
			<DashboardShell>
				<p className="text-center text-destructive">{error}</p>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<DashboardPageHeader title={t("adminAuditLogs.title")} />

			<Card className="overflow-hidden p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("adminAuditLogs.table.timestamp")}</TableHead>
								<TableHead>{t("adminAuditLogs.table.admin")}</TableHead>
								<TableHead>{t("adminAuditLogs.table.action")}</TableHead>
								<TableHead>{t("adminAuditLogs.table.details")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{logs.length > 0 ? (
								logs.map((log) => (
									<TableRow key={log._id}>
										<TableCell className="whitespace-nowrap text-muted-foreground">
											{new Date(log.timestamp).toLocaleString()}
										</TableCell>
										<TableCell>{log.adminId ? `${log.adminId.firstName} ${log.adminId.lastName}` : t("adminAuditLogs.unknown")}</TableCell>
										<TableCell className="font-semibold text-primary">{log.action}</TableCell>
										<TableCell>{log.details}</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
										{t("adminAuditLogs.noLogsFound")}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</Card>
		</DashboardShell>
	);
};

export default AdminAuditLogs;
