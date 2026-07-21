import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const RatingModal = ({ isOpen, onClose, onSubmit, rating, setRating, review, setReview }) => {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent>
				<DialogTitle>Rate your experience</DialogTitle>
				<DialogDescription>Let us know how your consultation went.</DialogDescription>

				<div className="flex justify-center gap-1" role="radiogroup" aria-label="Rating">
					{[1, 2, 3, 4, 5].map((star) => (
						<button
							key={star}
							type="button"
							role="radio"
							aria-checked={star === rating}
							aria-label={`${star} star${star > 1 ? "s" : ""}`}
							onClick={() => setRating(star)}
							className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
						>
							<Star
								size={28}
								className={cn(star <= rating ? "fill-(--jh-turmeric-gold) text-(--jh-turmeric-gold)" : "text-muted-foreground")}
							/>
						</button>
					))}
				</div>

				<textarea
					value={review}
					onChange={(e) => setReview(e.target.value)}
					placeholder="Write your review (optional)"
					rows={3}
					className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
				/>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Close
					</Button>
					<Button onClick={onSubmit} disabled={!rating}>
						Submit
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RatingModal;
