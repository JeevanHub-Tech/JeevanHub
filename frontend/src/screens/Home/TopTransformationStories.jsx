import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Play } from "lucide-react";

import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import logo from "../../media/logo.png";
import v from "../../media/mov_bbb.mp4";
import { BACKEND_URL } from "../../config";

const videos = [
	{
		id: 1,
		titleKey: "homeScreen.storiesSection.videos.v1Title",
		descKey: "homeScreen.storiesSection.videos.v1Desc",
		title: "Reversing Fatty Liver Naturally",
		description: "How Ayurvedic diet and herbs helped restore liver health in months.",
		videoUrl: v,
		poster: "/images/Fatty Liver Treatment.jpg",
	},
	{
		id: 2,
		titleKey: "homeScreen.storiesSection.videos.v2Title",
		descKey: "homeScreen.storiesSection.videos.v2Desc",
		title: "Calming Anxiety with Ayurveda",
		description: "Brahmi, pranayama, and routine — a real journey to a calmer mind.",
		videoUrl: v,
		poster: "/images/Detox.jpg",
	},
	{
		id: 3,
		titleKey: "homeScreen.storiesSection.videos.v3Title",
		descKey: "homeScreen.storiesSection.videos.v3Desc",
		title: "Healing Chronic Joint Pain",
		description: "Panchakarma and Ayurvedic care that brought lasting relief.",
		videoUrl: v,
		poster: "/images/jointpain.jpg",
	},
	{
		id: 4,
		titleKey: "homeScreen.storiesSection.videos.v4Title",
		descKey: "homeScreen.storiesSection.videos.v4Desc",
		title: "Clearing Skin the Natural Way",
		description: "A holistic skincare transformation rooted in Ayurvedic wisdom.",
		videoUrl: v,
		poster: "/images/skinacne.jpg",
	},
	{
		id: 5,
		titleKey: "homeScreen.storiesSection.videos.v5Title",
		descKey: "homeScreen.storiesSection.videos.v5Desc",
		title: "Building Immunity with Ojas",
		description: "Daily rituals and herbs that rebuilt strength and vitality.",
		videoUrl: v,
		poster: "/images/Immunity Boosting.jpg",
	},
];

const StorySlide = ({ item, sectionType }) => {
	const { t } = useTranslation();
	const title = item.titleKey ? t(item.titleKey, item.title) : item.title;
	const description = item.descKey ? t(item.descKey, item.description) : item.description;

	return (
		<CarouselItem className="basis-9/10 sm:basis-1/2 lg:basis-1/3">
			<div className="group flex h-full cursor-pointer flex-col">
				{sectionType === "Video" ? (
					<div className="relative overflow-hidden rounded-[14px] shadow-[0_12px_28px_-16px_rgba(30,38,20,0.4)] transition-all duration-300 ease-out will-change-transform group-hover:-translate-y-1.5 group-hover:shadow-[0_22px_44px_-14px_rgba(30,38,20,0.35)]">
						<video
							className="block aspect-3/2 w-full bg-muted object-cover transition-transform duration-500 ease-out group-hover:scale-104"
							src={item.videoUrl}
							poster={item.poster}
							preload="none"
							aria-label={title}
							controls
						/>
						<span className="pointer-events-none absolute top-[calc((100%_/_3_*_2)_-_58px)] left-4 z-10 flex size-11 items-center justify-center rounded-full bg-black/55 backdrop-blur-[2px]">
							<Play className="size-4.5 fill-white text-white" aria-hidden="true" />
						</span>
					</div>
				) : (
					<div
						className="relative overflow-hidden rounded-[14px] shadow-[0_12px_28px_-16px_rgba(30,38,20,0.4)] transition-all duration-300 ease-out will-change-transform group-hover:-translate-y-1.5 group-hover:shadow-[0_22px_44px_-14px_rgba(30,38,20,0.35)]"
						role="link"
						tabIndex={0}
						aria-label={title}
						onKeyDown={(e) => {
							if (e.key === "Enter") window.location.href = `/blog/${item.id}`;
						}}
						onClick={() => (window.location.href = `/blog/${item.id}`)}
					>
						<img
							className="block aspect-3/2 w-full bg-muted object-cover transition-transform duration-500 ease-out group-hover:scale-104"
							src={item.imageUrl}
							alt={title}
						/>
					</div>
				)}
				<div className="pt-4">
					<h2 className="font-display m-0 mb-1.5 line-clamp-2 text-lg leading-tight font-semibold text-foreground">
						{title}
					</h2>
					<p className="m-0 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
				</div>
			</div>
		</CarouselItem>
	);
};

const StoryCarouselSection = ({ items, sectionType }) => {
	const { t } = useTranslation();
	const [api, setApi] = useState(null);
	const [selected, setSelected] = useState(0);

	useEffect(() => {
		if (!api) return;
		const onSelect = () => setSelected(api.selectedScrollSnap());
		onSelect();
		api.on("select", onSelect);
		return () => api.off("select", onSelect);
	}, [api]);

	return (
		<div className="max-w-300 mx-auto [&:not(:first-child)]:mt-14 sm:[&:not(:first-child)]:mt-24">
			<div className="mb-8 max-w-160">
				<h2 className="font-display m-0 mb-2.5 text-3xl leading-tight font-semibold tracking-tight text-foreground text-balance">
					{sectionType === "Video" ? t("homeScreen.storiesSection.videoTitle", "Real journeys, real healing") : t("homeScreen.storiesSection.blogTitle", "From the journal")}
				</h2>
				<p className="m-0 text-base leading-relaxed text-muted-foreground">
					{sectionType === "Video"
						? t("homeScreen.storiesSection.videoSubtitle", "Short films from people who chose the Ayurvedic path.")
						: t("homeScreen.storiesSection.blogSubtitle", "Notes and guidance from our practitioners.")}
				</p>
			</div>

			<Carousel setApi={setApi} opts={{ align: "start" }} className="pb-11">
				<CarouselContent>
					{items.map((item) => (
						<StorySlide key={item.id} item={item} sectionType={sectionType} />
					))}
				</CarouselContent>
			</Carousel>

			<div className="mt-3 flex justify-center gap-1.75">
				{items.map((item, i) => (
					<button
						key={item.id}
						type="button"
						aria-label={`Go to slide ${i + 1}`}
						onClick={() => api?.scrollTo(i)}
						className={`h-0.75 w-5.5 rounded-sm transition-colors ${i === selected ? "bg-primary" : "bg-[color-mix(in_srgb,var(--jh-olive-leaf)_35%,transparent)]"}`}
					/>
				))}
			</div>
		</div>
	);
};

const TopTransformation = () => {
	const [dynamicBlogs, setDynamicBlogs] = useState([]);

	useEffect(() => {
		const fetchBlogs = async () => {
			try {
				const response = await fetch(`${BACKEND_URL || "http://localhost:8080"}/api/webhook/getAllBlogs`);
				const data = await response.json();
				if (Array.isArray(data)) {
					const mappedBlogs = data.slice(0, 5).map((blog) => {
						const rawHtmlContent = blog.description;
						const previewText = rawHtmlContent ? rawHtmlContent.replace(/<[^>]*>/g, "").slice(0, 80) : "No content available...";

						return {
							id: blog._id,
							title: blog.title,
							description: previewText + "...",
							imageUrl: blog.url || blog.image || logo,
							link: `/blog/${blog._id}`,
						};
					});
					setDynamicBlogs(mappedBlogs);
				}
			} catch (error) {
				console.error("Failed to fetch blogs for home page:", error);
			}
		};
		fetchBlogs();
	}, []);

	return (
		<div className="px-5 py-16 sm:px-12 sm:py-24">
			<StoryCarouselSection items={videos} sectionType="Video" />
			{dynamicBlogs.length > 0 && <StoryCarouselSection items={dynamicBlogs} sectionType="Blog" />}
		</div>
	);
};

export default TopTransformation;
