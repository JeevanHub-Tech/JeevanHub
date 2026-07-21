import { useState, useEffect } from "react";
import { MessageSquareText, Star } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";

const StarRating = ({ rating }) => (
	<div className="mb-4 flex gap-0.5">
		{[...Array(5)].map((_, index) => (
			<Star
				key={index}
				className={index < (rating || 0) ? "size-4.5 fill-primary text-primary" : "size-4.5 text-muted-foreground/40"}
			/>
		))}
	</div>
);

const Feedback = ({ doctorId }) => {
	const [reviewedBookings, setReviewedBookings] = useState([]);
	const [loadingReviewedBookings, setLoadingReviewedBookings] = useState(true);

	const [reviewedOrders, setReviewedOrders] = useState([]);
	const [loadingReviewedOrders, setLoadingReviewedOrders] = useState(true);

	const [feedbackList, setFeedbackList] = useState([]);

	useEffect(() => {
		const fetchReviewedBookings = async () => {
			try {
				const token = localStorage.getItem("token");
				const res = await authFetch(`${BACKEND_URL}/api/bookings/doctor/reviews/${doctorId}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!res.ok) {
					if (res.status === 404) {
						setReviewedBookings([]);
						return;
					}
					throw new Error("Failed to fetch reviewed bookings");
				}

				const data = await res.json();
				setReviewedBookings(data.bookings || []);
			} catch (error) {
				console.error("Error fetching reviewed bookings:", error);
			} finally {
				setLoadingReviewedBookings(false);
			}
		};

		if (doctorId) fetchReviewedBookings();
	}, [doctorId]);

	useEffect(() => {
		const fetchReviewedOrders = async () => {
			try {
				const token = localStorage.getItem("token");
				const res = await authFetch(`${BACKEND_URL}/api/orders/reviews/${doctorId}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!res.ok) {
					if (res.status === 404) {
						setReviewedOrders([]);
						return;
					}
					throw new Error("Failed to fetch reviewed orders");
				}

				const data = await res.json();
				setReviewedOrders(data.orders || []);
			} catch (error) {
				console.error("Error fetching reviewed orders:", error);
			} finally {
				setLoadingReviewedOrders(false);
			}
		};

		if (doctorId) fetchReviewedOrders();
	}, [doctorId]);

	useEffect(() => {
		if (!loadingReviewedBookings && !loadingReviewedOrders) {
			const bookingsFeedback = reviewedBookings.map((b) => ({
				id: b._id,
				reviewerName: b.patientName,
				date: b.dateOfAppointment || b.createdAt,
				rating: b.rating,
				comment: b.review,
				type: "Patient's Review",
			}));

			const ordersFeedback = reviewedOrders.map((o) => ({
				id: o._id,
				reviewerName: o.retailers?.join(", ") || "Unknown Retailer",
				date: o.review?.createdAt || o.createdAt,
				rating: o.review?.rating,
				comment: o.review?.comment,
				type: "Order",
			}));

			const merged = [...bookingsFeedback, ...ordersFeedback].sort((a, b) => new Date(b.date) - new Date(a.date));

			setFeedbackList(merged);
		}
	}, [reviewedBookings, reviewedOrders, loadingReviewedBookings, loadingReviewedOrders]);

	return (
		<Card className="p-6">
			<h3 className="flex items-center gap-2 border-b border-border pb-4 text-xl font-semibold text-foreground">
				<MessageSquareText className="size-5" /> Feedback History
			</h3>

			<div className="mt-5 flex flex-col gap-4">
				{feedbackList.length > 0 ? (
					feedbackList.map((fb) => (
						<div key={fb.id} className="rounded-lg border border-border bg-muted/40 p-5">
							<div className="mb-3 flex items-center justify-between gap-2">
								<Badge variant="secondary">{fb.reviewerName}</Badge>
								<span className="text-sm font-medium text-muted-foreground">
									{new Date(fb.date).toLocaleDateString("en-GB", {
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</span>
							</div>
							<StarRating rating={fb.rating} />
							<p className="border-l border-border pl-4 text-[0.95rem] leading-relaxed text-foreground/80">
								&quot;{fb.comment}&quot;
							</p>
							<span className="mt-2 block text-sm text-muted-foreground">({fb.type})</span>
						</div>
					))
				) : (
					<p className="py-8 text-center text-muted-foreground">No feedback has been submitted yet.</p>
				)}
			</div>
		</Card>
	);
};

export default Feedback;
