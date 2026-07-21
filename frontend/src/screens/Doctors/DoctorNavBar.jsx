import React, { useContext, useEffect, useState } from "react";

import DashboardNavbar from "@/components/layout/DashboardNavbar";
import { AuthContext } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";

function DoctorNavBar() {
	const { auth } = useContext(AuthContext);
	const doctorId = auth.user?.id || auth.user?._id;
	const [pendingCount, setPendingCount] = useState(0);

	useEffect(() => {
		const fetchPendingCount = async () => {
			if (!doctorId) return;
			try {
				const token = localStorage.getItem("token");
				const response = await authFetch(`${BACKEND_URL}/api/bookings/doctor/${doctorId}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (response.ok) {
					const data = await response.json();
					const requestsArray = Array.isArray(data.bookings) ? data.bookings : [];
					const activeRequests = requestsArray.filter(
						(request) => request.requestAccept === "pending" && (request.amountPaid === 0 || (request.paymentScreenshots && request.paymentScreenshots.length > 0))
					);
					setPendingCount(activeRequests.length);
				}
			} catch (error) {
				console.error("Error fetching pending requests count:", error);
			}
		};

		fetchPendingCount();

		if (!doctorId) return;

		const token = localStorage.getItem("token");
		const sseUrl = `${BACKEND_URL}/api/bookings/stream-notifications/${doctorId}?token=${token}`;
		const eventSource = new EventSource(sseUrl);

		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.type === "booking_update") {
					fetchPendingCount();
				}
			} catch (e) {
				console.error("Error parsing SSE data:", e);
			}
		};

		return () => eventSource.close();
	}, [doctorId]);

	const navItems = [
		{ label: "Home", to: "/doctor-home" },
		{ label: "Current Requests", to: "/current-requests", badge: pendingCount },
		{ label: "Appointment Slots", to: "/appointment-slots" },
		{ label: "Patient List", to: "/patient-list" },
		{ label: "Patient's Reviews", to: "/doctor-reviews" },
		{ label: "Analytics", to: "/doctor-analytics" },
		{ label: "My Health Blogs", to: "/health-blogs" },
	];

	return (
		<DashboardNavbar
			navItems={navItems}
			profileTo="/profile/doctor"
			notificationsTo="/doctor-notifications"
			logoTo="/doctor-home"
		/>
	);
}

export default DoctorNavBar;
