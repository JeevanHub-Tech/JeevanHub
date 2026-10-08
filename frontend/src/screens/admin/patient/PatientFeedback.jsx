import React, { useState, useEffect } from 'react';
import { MessageSquareText, Star } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { authFetch } from '../../../utils/authFetch';
import { BACKEND_URL } from '../../../config';

const StarRating = ({ rating }) => {
	return (
		<div className="flex gap-1">
			{[...Array(5)].map((_, index) => (
				<Star
					key={index}
					size={18}
					className={cn(index < rating ? "fill-(--jh-turmeric-gold) text-(--jh-turmeric-gold)" : "fill-transparent text-border")}
				/>
			))}
		</div>
	);
};

const Feedback = ({ patientId }) => {
	const [feedbackList, setFeedbackList] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const fetchFeedback = async () => {
			if (!patientId) return;
			setLoading(true);
			const token = localStorage.getItem("token");
			const headers = { Authorization: `Bearer ${token}` };

			try {
				const [bookingsRes, ordersRes] = await Promise.all([
					authFetch(`${BACKEND_URL}/api/bookings/patient/reviews/${patientId}`, { headers }),
					authFetch(`${BACKEND_URL}/api/orders/reviews/${patientId}`, { headers }),
				]);

				let reviewedBookings = [];
				if (bookingsRes.ok) {
					const data = await bookingsRes.json();
					reviewedBookings = data.bookings || [];
				}

				let reviewedOrders = [];
				if (ordersRes.ok) {
					const data = await ordersRes.json();
					reviewedOrders = data.orders || [];
				}

				if (!isMounted) return;

				const bookingsFeedback = reviewedBookings.map((b) => ({
					id: b._id,
					doctorName: b.doctorName,
					date: b.dateOfAppointment || b.createdAt,
					rating: b.rating,
					comment: b.review,
					type: "Booking",
				}));

				const ordersFeedback = reviewedOrders.map((o) => ({
					id: o._id,
					doctorName: (o.retailers || []).join(", "),
					date: o.review?.createdAt || o.createdAt,
					rating: o.review?.rating,
					comment: o.review?.comment,
					type: "Order",
				}));

				const merged = [...bookingsFeedback, ...ordersFeedback].sort(
					(a, b) => new Date(b.date) - new Date(a.date)
				);

				setFeedbackList(merged);
			} catch (error) {
				console.error("❌ Error fetching feedback:", error);
			} finally {
				if (isMounted) setLoading(false);
			}
		};

		fetchFeedback();

		return () => {
			isMounted = false;
		};
	}, [patientId]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 font-display text-xl">
					<MessageSquareText size={20} /> Feedback History
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				{feedbackList.length > 0 ? (
					feedbackList.map((fb) => (
						<div key={fb.id} className="flex flex-col gap-3 rounded-(--jh-radius-md) border border-border bg-secondary/40 p-5">
							<div className="flex flex-col items-start">
								<span className="mb-1 text-lg font-bold text-foreground">{fb.doctorName}</span>
								<span className="text-sm text-muted-foreground">
									{new Date(fb.date).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'long',
										year: 'numeric',
									})}
								</span>
							</div>
							<StarRating rating={fb.rating} />
							<p className="w-full rounded-(--jh-radius-sm) border border-border bg-card p-4 text-sm leading-relaxed text-foreground">
								"{fb.comment}"
							</p>
						</div>
					))
				) : (
					<EmptyState icon={MessageSquareText} title="No feedback yet" description="Submitted reviews for consultations and orders will appear here." />
				)}
			</CardContent>
		</Card>
	);
};

export default Feedback;
