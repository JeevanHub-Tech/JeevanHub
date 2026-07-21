import { useState, useEffect, useContext } from "react";
import { AlertCircle, Bell, Check, Info, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AuthContext } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";

const TYPE_META = {
	order: { icon: Package, className: "text-(--jh-turmeric-gold)" },
	payment: { icon: AlertCircle, className: "text-primary" },
	system: { icon: Info, className: "text-muted-foreground" },
	default: { icon: Bell, className: "text-(--jh-bark-brown)" },
};

const Notification = () => {
	const { auth } = useContext(AuthContext);
	const patientId = auth?.user?.id;

	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchNotifications = async () => {
			if (!auth?.token) {
				setLoading(false);
				return;
			}

			const queryParams = new URLSearchParams({ patientId, role: "patient" }).toString();

			try {
				const response = await authFetch(`${BACKEND_URL}/api/notifications?${queryParams}`, {
					method: "GET",
					headers: { "Content-Type": "application/json" },
				});

				if (!response.ok) throw new Error("Failed to fetch notifications");

				const data = await response.json();
				setNotifications(data.filter((n) => n.isRead === false));
			} catch (err) {
				console.error("Error fetching notifications:", err);
				setError("Could not load notifications.");
			} finally {
				setLoading(false);
			}
		};

		fetchNotifications();

		// Auto-refresh every 30 seconds
		const interval = setInterval(fetchNotifications, 30000);
		return () => clearInterval(interval);
	}, [auth, patientId]);

	const markAsRead = async (id) => {
		try {
			const response = await authFetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
			});

			if (response.ok) {
				setNotifications((prev) => prev.filter((n) => n._id !== id));
			}
		} catch (err) {
			console.error("Error marking notification as read:", err);
		}
	};

	return (
		<main className="bg-background pt-20 lg:pt-28">
			<div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
				<div className="flex items-center justify-between gap-3">
					<h1 className="font-display text-3xl text-foreground">Your notifications</h1>
					{notifications.length > 0 ? <Badge>{notifications.length} new</Badge> : null}
				</div>

				<div className="mt-6">
					{loading ? (
						<p className="text-sm text-muted-foreground">Loading notifications...</p>
					) : error ? (
						<p className="rounded-(--jh-radius-md) bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
					) : notifications.length === 0 ? (
						<EmptyState icon={Bell} title="No new notifications" description="You're all caught up." />
					) : (
						<ul className="flex flex-col gap-3">
							{notifications.map((notification) => {
								const meta = TYPE_META[notification.type] || TYPE_META.default;
								const Icon = meta.icon;
								return (
									<li
										key={notification._id}
										className="flex items-start gap-3 rounded-(--jh-radius-lg) bg-card p-4 shadow-(--jh-shadow-rest)"
									>
										<span className={`mt-0.5 shrink-0 ${meta.className}`}>
											<Icon size={18} aria-hidden="true" />
										</span>

										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-2">
												<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
													{notification.type?.toUpperCase() || "SYSTEM"}
												</span>
												<span className="shrink-0 text-xs text-muted-foreground">
													{new Date(notification.createdAt).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
											</div>
											<p className="mt-1 text-sm text-foreground">{notification.message}</p>
										</div>

										<button
											type="button"
											onClick={() => markAsRead(notification._id)}
											title="Mark as read"
											aria-label="Mark as read"
											className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
										>
											<Check size={16} />
										</button>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			</div>
		</main>
	);
};

export default Notification;
