import { useState, useEffect } from "react";

import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const AdminAuditLogs = () => {
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
				<p className="text-center text-muted-foreground">Loading logs...</p>
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
			<DashboardPageHeader title="Admin Audit Logs" />

			<Card className="overflow-hidden p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Timestamp</TableHead>
								<TableHead>Admin</TableHead>
								<TableHead>Action</TableHead>
								<TableHead>Details</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{logs.length > 0 ? (
								logs.map((log) => (
									<TableRow key={log._id}>
										<TableCell className="whitespace-nowrap text-muted-foreground">
											{new Date(log.timestamp).toLocaleString()}
										</TableCell>
										<TableCell>{log.adminId ? `${log.adminId.firstName} ${log.adminId.lastName}` : "Unknown"}</TableCell>
										<TableCell className="font-semibold text-primary">{log.action}</TableCell>
										<TableCell>{log.details}</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
										No logs found.
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
