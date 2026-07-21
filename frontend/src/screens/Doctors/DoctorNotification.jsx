import { useState, useEffect, useContext } from "react";

import { AuthContext } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";

const DoctorNotification = () => {
	const { auth } = useContext(AuthContext);
	const doctorId = auth?.user?.id;

	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchNotifications = async () => {
			if (!auth?.token) {
				setLoading(false);
				return;
			}

			const queryParams = new URLSearchParams({
				userId: doctorId,
				role: "doctor",
			}).toString();

			try {
				const response = await authFetch(`${BACKEND_URL}/api/notifications?${queryParams}`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error("Failed to fetch notifications");
				}

				const data = await response.json();

				const unreadNotifications = data.filter((n) => n.isRead === false);

				setNotifications(unreadNotifications);
			} catch (err) {
				console.error("Error fetching notifications:", err);
				setError("Could not load notifications.");
			} finally {
				setLoading(false);
			}
		};

		fetchNotifications();
	}, [auth, doctorId]);

	if (loading) {
		return (
			<DashboardShell>
				<p className="text-center text-muted-foreground">Loading notifications...</p>
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
			<DashboardPageHeader title="Doctor Notifications" />

			<div className="mx-auto max-w-2xl">
				{notifications.length === 0 ? (
					<p className="text-center text-muted-foreground">No new notifications.</p>
				) : (
					<div className="flex flex-col gap-3">
						{notifications.map((notification) => (
							<Card key={notification._id} className="p-4">
								<p className="text-sm text-foreground/80">{notification.message}</p>
								<span className="mt-1 block text-xs text-muted-foreground">
									{new Date(notification.createdAt).toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</span>
							</Card>
						))}
					</div>
				)}
			</div>
		</DashboardShell>
	);
};

export default DoctorNotification;
