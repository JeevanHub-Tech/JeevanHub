import { useState, useEffect } from "react";
import { MessageSquareText, Star, Package } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";

const StarRating = ({ rating }) => (
	<div className="mb-3 flex gap-0.5">
		{[...Array(5)].map((_, index) => (
			<Star
				key={index}
				className={index < rating ? "size-4 fill-primary text-primary" : "size-4 text-muted-foreground/40"}
			/>
		))}
	</div>
);

const fetchFeedbackByRetailerId = async (retailerId, setFeedback, setLoading, setError) => {
	setLoading(true);
	setError(null);
	try {
		const token = localStorage.getItem("token");
		const response = await authFetch(`${BACKEND_URL}/api/orders/getFeedbackByRetailerId/${retailerId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Failed to fetch feedback.");
		}

		const data = await response.json();
		setFeedback(data.feedback);
	} catch (error) {
		console.error("Error fetching retailer's feedback:", error);
		setError(error.message);
	} finally {
		setLoading(false);
	}
};

const RetailerFeedbackTab = ({ retailerId }) => {
	const [, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [feedback, setFeedback] = useState([]);

	useEffect(() => {
		if (retailerId) {
			fetchFeedbackByRetailerId(retailerId, setFeedback, setLoading, setError);
		}
	}, [retailerId]);

	if (error) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Package />
					</EmptyMedia>
					<EmptyDescription>{error}</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	if (!feedback || feedback.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Package />
					</EmptyMedia>
					<EmptyTitle>No Feedback Found</EmptyTitle>
					<EmptyDescription>This retailer does not have any Feedback history yet.</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<Card className="p-7">
			<h3 className="mb-6 flex items-center gap-3 border-b border-border pb-4 text-xl font-semibold text-foreground">
				<MessageSquareText className="size-5.5" /> Customer Feedback & Reviews
			</h3>

			<div className="flex flex-col gap-6">
				{feedback.map((fb) => (
					<div
						key={fb.id}
						className="flex items-start gap-4 rounded-lg border border-border p-4 transition-transform hover:-translate-y-1 hover:shadow-md"
					>
						<Avatar className="size-11 shrink-0">
							<AvatarFallback className="uppercase">{fb.customerName.charAt(0)}</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<div className="mb-1 flex flex-wrap items-center justify-between gap-2">
								<span className="font-semibold text-foreground">{fb.customerName}</span>
								<span className="text-xs text-muted-foreground">
									{new Date(fb.date).toLocaleDateString("en-GB", {
										day: "numeric",
										month: "long",
										year: "numeric",
									})}
								</span>
							</div>
							<StarRating rating={fb.rating} />
							<p className="text-sm leading-relaxed text-foreground/80">&quot;{fb.comment}&quot;</p>
						</div>
					</div>
				))}
			</div>
		</Card>
	);
};

export default RetailerFeedbackTab;
