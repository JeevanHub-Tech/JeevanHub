import { useLocation, useParams } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Blog() {
	const { state } = useLocation();
	const { id } = useParams();
	const blog = state?.blog;

	if (!blog) {
		return (
			<main className="bg-background">
				<p className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
					No blog data found for ID: {id}. Maybe refresh?
				</p>
			</main>
		);
	}

	const fullHtmlContent = blog.description || "<h2>Error: Content not found.</h2>";
	const displayDate = blog.date ? new Date(blog.date).toLocaleString() : "Date Unavailable";
	const mainImageUrl = blog.image;

	return (
		<main className="bg-background">
			<div className="mx-auto max-w-3xl px-4 py-8">
				<Card className="p-6">
					{mainImageUrl ? (
						<img src={mainImageUrl} alt={blog.title || "Blog header"} className="mb-4 w-full rounded-lg" />
					) : null}

					<p className="mb-4 text-sm text-muted-foreground">
						By: {blog.authorName || "Unknown Author"} | Published: {displayDate}
					</p>

					<Separator />

					<div
						className="jh-blog-content pt-4 leading-relaxed text-foreground [&_a]:cursor-pointer [&_a]:text-primary [&_a]:underline [&_a:hover]:no-underline [&_a:visited]:text-primary/70 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h1]:font-display [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-(--jh-ink-strong) [&_h2]:font-display [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-(--jh-ink-strong) [&_h3]:font-display [&_h3]:mt-5 [&_h3]:mb-2.5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-(--jh-ink-strong) [&_img]:my-4 [&_img]:w-full [&_img]:rounded-lg [&_li]:text-foreground [&_li_p]:my-0 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_strong]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
						dangerouslySetInnerHTML={{ __html: fullHtmlContent }}
					/>
				</Card>
			</div>
		</main>
	);
}
