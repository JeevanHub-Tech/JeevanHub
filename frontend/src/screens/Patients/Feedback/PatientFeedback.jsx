import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";

const ratingMessages = {
	1: "Poor - Not satisfied with the consultation",
	2: "Fair - Below expectations",
	3: "Good - Satisfactory consultation",
	4: "Very Good - Excellent care and advice",
	5: "Excellent - Outstanding medical care",
};

const PatientFeedback = () => {
	const [rating, setRating] = useState(0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [comment, setComment] = useState("");
	const navigate = useNavigate();
	const { id: appointmentId } = useParams();

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (rating < 1) return alert("Please provide a rating");

		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/bookings/rating-review/${appointmentId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				body: JSON.stringify({ rating, review: comment }),
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.error || "Failed to submit feedback");
			}

			alert("Feedback submitted successfully!");
			navigate(-1);
		} catch (error) {
			console.error("Error submitting feedback:", error);
			alert("Failed to submit feedback. Please try again.");
		}
	};

	return (
		<main className="bg-background pt-20 lg:pt-28">
			<div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
				<Card>
					<CardHeader>
						<CardTitle className="font-display text-2xl">Rate your doctor's session</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="flex flex-col gap-6">
							<div className="flex flex-col items-center gap-2 text-center">
								<Label className="text-sm font-semibold text-foreground">
									How would you rate this doctor's consultation?
								</Label>
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
								{rating > 0 ? <p className="text-sm text-muted-foreground">{ratingMessages[rating]}</p> : null}
							</div>

							<div className="flex flex-col gap-1.5">
								<Label htmlFor="feedback-comment">Share your experience</Label>
								<textarea
									id="feedback-comment"
									value={comment}
									onChange={(e) => setComment(e.target.value)}
									rows={4}
									placeholder="Please share your experience with the doctor. How was the consultation? Were your concerns addressed? Any other feedback about the treatment or care received?"
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

export default PatientFeedback;
