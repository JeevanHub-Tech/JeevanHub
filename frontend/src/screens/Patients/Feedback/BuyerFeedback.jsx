import { useState } from "react";
import { ArrowLeft, Calendar, Frown, Laugh, Meh, MessageSquare, Smile, Star } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";

const RATING_MOODS = {
	1: { icon: Frown, label: "Poor - Not satisfied with the service" },
	2: { icon: Meh, label: "Fair - Below expectations" },
	3: { icon: Smile, label: "Good - Met expectations" },
	4: { icon: Laugh, label: "Very Good - Exceeded expectations" },
	5: { icon: Star, label: "Excellent - Outstanding service" },
};

const BuyerFeedback = () => {
	const navigate = useNavigate();
	const { id: orderId } = useParams();

	const [rating, setRating] = useState(0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [comment, setComment] = useState("");
	const [receivingDate, setReceivingDate] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (rating < 1) return;

		try {
			const token = localStorage.getItem("token");
			const res = await authFetch(`${BACKEND_URL}/api/orders/updateOrderReview/${orderId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ rating, comment, receivingDate }),
			});

			if (!res.ok) throw new Error(`Failed to submit feedback: ${res.statusText}`);

			setRating(0);
			setComment("");
			setReceivingDate("");
			alert("Feedback submitted successfully!");
			navigate(-1);
		} catch (err) {
			console.error("Error submitting feedback:", err.message);
			alert("Failed to submit feedback. Please try again.");
		}
	};

	const activeMood = RATING_MOODS[rating];

	return (
		<main className="bg-background pt-20 lg:pt-28">
			<div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between gap-3">
						<CardTitle className="font-display text-2xl">Rate your experience</CardTitle>
						<Button variant="ghost" size="icon" aria-label="Go back" onClick={() => navigate(-1)}>
							<ArrowLeft className="size-4" />
						</Button>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="flex flex-col gap-6">
							<div className="flex flex-col items-center gap-2 text-center">
								<Label className="text-sm font-semibold text-foreground">How would you rate this retailer?</Label>
								<div className="flex gap-1">
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											type="button"
											aria-label={`${star} star${star > 1 ? "s" : ""}`}
											onMouseEnter={() => setHoveredRating(star)}
											onMouseLeave={() => setHoveredRating(0)}
											onClick={() => setRating(star)}
											className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
										>
											<Star
												size={32}
												className={cn(
													star <= (hoveredRating || rating)
														? "fill-(--jh-turmeric-gold) text-(--jh-turmeric-gold)"
														: "text-muted-foreground",
												)}
											/>
										</button>
									))}
								</div>
								{activeMood ? (
									<p className="flex items-center gap-1.5 text-sm text-muted-foreground">
										<activeMood.icon className="size-4" aria-hidden="true" /> {activeMood.label}
									</p>
								) : null}
							</div>

							<div className="flex flex-col gap-1.5">
								<Label htmlFor="receiving-date" className="flex items-center gap-1.5">
									<Calendar size={14} aria-hidden="true" /> When did you receive the order?
								</Label>
								<DatePicker id="receiving-date" value={receivingDate} onChange={setReceivingDate} required />
							</div>

							<div className="flex flex-col gap-1.5">
								<Label htmlFor="buyer-comment" className="flex items-center gap-1.5">
									<MessageSquare size={14} aria-hidden="true" /> Share your experience (optional)
								</Label>
								<textarea
									id="buyer-comment"
									value={comment}
									onChange={(e) => setComment(e.target.value)}
									rows={3}
									placeholder="Tell us about packaging, delivery, etc."
									className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
								/>
							</div>

							<div className="flex gap-3">
								<Button type="submit" disabled={rating === 0} className="flex-1">
									Submit feedback
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setRating(0);
										setComment("");
										setReceivingDate("");
									}}
								>
									Clear
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</main>
	);
};

export default BuyerFeedback;
