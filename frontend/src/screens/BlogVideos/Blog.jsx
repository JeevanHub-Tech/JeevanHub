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
	const mainImageUrl = blog.image || blog.content?.images?.[0]?.url;

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
						className="jh-blog-content pt-4 leading-relaxed text-foreground [&_a]:cursor-pointer [&_a]:text-primary [&_a]:underline [&_a:hover]:no-underline [&_a:visited]:text-primary/70 [&_li]:text-foreground [&_li_p]:my-0 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
						dangerouslySetInnerHTML={{ __html: fullHtmlContent }}
					/>
				</Card>
			</div>
		</main>
	);
}
