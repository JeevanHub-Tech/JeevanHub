import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { renderTwitterEmbeds } from "@/lib/twitterWidgets";
import { formatDate } from "@/lib/date";

export default function Blog() {
	const { t, i18n } = useTranslation();
	const { state } = useLocation();
	const { id } = useParams();
	const navigate = useNavigate();
	const contentRef = useRef(null);

	const [blog, setBlog] = useState(state?.blog || null);
	const [loading, setLoading] = useState(!state?.blog);
	const [isTranslating, setIsTranslating] = useState(false);
	const [showTranslated, setShowTranslated] = useState(i18n.language === "hi");
	const [translatedData, setTranslatedData] = useState(
		state?.blog?.translations?.hi || null
	);

	// Fetch blog data if not present in router state
	useEffect(() => {
		if (!blog && id) {
			setLoading(true);
			axios
				.get(`/api/blogs/${id}`)
				.then((res) => {
					setBlog(res.data);
					if (res.data?.translations?.hi) {
						setTranslatedData(res.data.translations.hi);
					}
				})
				.catch((err) => console.error("Error fetching blog:", err))
				.finally(() => setLoading(false));
		}
	}, [id, blog]);

	// Auto translate if Hindi is selected and translation isn't loaded yet
	const handleTranslate = async () => {
		if (translatedData) {
			setShowTranslated(true);
			return;
		}

		if (!blog?._id && !id) return;
		const blogId = blog?._id || id;

		setIsTranslating(true);
		try {
			const res = await axios.post(`/api/blogs/${blogId}/translate`, {
				targetLang: "hi",
			});
			setTranslatedData(res.data);
			setShowTranslated(true);
		} catch (error) {
			console.error("Translation request error:", error);
		} finally {
			setIsTranslating(false);
		}
	};

	// Auto-trigger when switching to Hindi
	useEffect(() => {
		if (i18n.language === "hi") {
			if (translatedData) {
				setShowTranslated(true);
			} else if (blog) {
				handleTranslate();
			}
		} else {
			setShowTranslated(false);
		}
	}, [i18n.language, blog]);

	useEffect(() => {
		if (contentRef.current) renderTwitterEmbeds(contentRef.current);
	}, [blog, showTranslated, translatedData]);

	if (loading) {
		return (
			<main className="flex min-h-[60vh] items-center justify-center bg-background">
				<Loader2 className="size-8 animate-spin text-primary" />
			</main>
		);
	}

	if (!blog) {
		return (
			<main className="bg-background">
				<p className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
					{t("blogsVideos.noBlogFound", "No blog data found. Please refresh or explore our other articles.")}
				</p>
			</main>
		);
	}

	const displayTitle = showTranslated && translatedData?.title ? translatedData.title : blog.title;
	const displayCategory = showTranslated && translatedData?.category ? translatedData.category : blog.category;
	const displayContent = showTranslated && translatedData?.description ? translatedData.description : (blog.description || "<h2>Content not found.</h2>");
	const displayDate = formatDate(blog.date, "Date unavailable");
	const mainImageUrl = blog.image;

	return (
		<main className="min-h-screen bg-background">
			<div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<Button variant="ghost" className="w-fit" onClick={() => navigate(-1)}>
						<ArrowLeft data-icon="inline-start" className="mr-2 size-4" />
						{t("blogsVideos.backToBlogs", "Back to blogs")}
					</Button>

					{/* AI Translation Switch */}
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							if (showTranslated) {
								setShowTranslated(false);
							} else {
								handleTranslate();
							}
						}}
						disabled={isTranslating}
						className="gap-2 rounded-full border-primary/30 text-xs font-semibold hover:bg-primary/10"
					>
						{isTranslating ? (
							<>
								<Loader2 className="size-3.5 animate-spin" />
								{t("blogsVideos.translating", "Translating to Hindi...")}
							</>
						) : showTranslated ? (
							<>
								<Globe className="size-3.5 text-primary" />
								{t("blogsVideos.viewOriginal", "View Original English")}
							</>
						) : (
							<>
								<Sparkles className="size-3.5 text-amber-500" />
								{t("blogsVideos.translateToHindi", "Translate to Hindi (हिंदी)")}
							</>
						)}
					</Button>
				</div>

				{mainImageUrl ? (
					<img
						src={mainImageUrl}
						alt={displayTitle || "Blog header"}
						className="h-56 w-full rounded-2xl object-cover sm:h-72 shadow-sm"
						onError={(e) => {
							e.currentTarget.onerror = null;
							e.currentTarget.style.display = "none";
						}}
					/>
				) : null}

				<div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="font-sans text-3xl sm:text-4xl font-bold text-foreground">{displayTitle}</h1>
					</div>

					{displayCategory ? (
						<Badge variant="secondary" className="w-fit font-medium">
							{displayCategory}
						</Badge>
					) : null}

					<p className="text-sm text-muted-foreground">
						{t("blogsVideos.writtenBy", { author: blog.authorName || "Ayurvedic Doctor", defaultValue: `By ${blog.authorName || "Doctor"}` })} · {displayDate}
					</p>
				</div>

				<div
					ref={contentRef}
					className="jh-blog-content py-4 leading-relaxed text-foreground [&_a]:cursor-pointer [&_a]:text-primary [&_a]:underline [&_a:hover]:no-underline [&_a:visited]:text-primary/70 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-(--jh-ink-strong) [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-(--jh-ink-strong) [&_h3]:mt-5 [&_h3]:mb-2.5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-(--jh-ink-strong) [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg [&_li]:text-foreground [&_li_p]:my-0 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_strong]:font-semibold [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
					dangerouslySetInnerHTML={{ __html: displayContent }}
				/>
			</div>
		</main>
	);
}
