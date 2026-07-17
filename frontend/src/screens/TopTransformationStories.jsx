import React, { useEffect, useRef } from "react";
import "./TopTransformationStories.css";
import logo from "../media/logo.png";
import v from "../media/mov_bbb.mp4";
import { BACKEND_URL } from '../config';

// Import Swiper and required modules
import { Swiper, SwiperSlide } from "swiper/react";
import {
	EffectCoverflow,
	Pagination,
	Keyboard,
	Mousewheel,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

const videos = [
	{
		id: 1,
		title: "Reversing Fatty Liver Naturally",
		description: "How Ayurvedic diet and herbs helped restore liver health in months.",
		videoUrl: v,
		poster: "/images/Fatty Liver Treatment.jpg",
	},
	{
		id: 2,
		title: "Calming Anxiety with Ayurveda",
		description: "Brahmi, pranayama, and routine — a real journey to a calmer mind.",
		videoUrl: v,
		poster: "/images/Detox.jpg",
	},
	{
		id: 3,
		title: "Healing Chronic Joint Pain",
		description: "Panchakarma and Ayurvedic care that brought lasting relief.",
		videoUrl: v,
		poster: "/images/jointpain.jpg",
	},
	{
		id: 4,
		title: "Clearing Skin the Natural Way",
		description: "A holistic skincare transformation rooted in Ayurvedic wisdom.",
		videoUrl: v,
		poster: "/images/skinacne.jpg",
	},
	{
		id: 5,
		title: "Building Immunity with Ojas",
		description: "Daily rituals and herbs that rebuilt strength and vitality.",
		videoUrl: v,
		poster: "/images/Immunity Boosting.jpg",
	},
];

// Dynamic blogs fetched from backend

const SwiperCarouselSection = ({ items, sectionType }) => {
	return (
		<div className="swiper-carousel-section">
			<div className="stories-head">
					<h2>{sectionType === "Video" ? "Real journeys, real healing" : "From the journal"}</h2>
					<p>{sectionType === "Video" ? "Short films from people who chose the Ayurvedic path." : "Notes and guidance from our practitioners."}</p>
				</div>
			<Swiper
				grabCursor={true}
				slidesPerView={1.1}
				spaceBetween={20}
				keyboard={{ enabled: true }}
				mousewheel={{ thresholdDelta: 70 }}
				pagination={{
					el: `.swiper-pagination-${sectionType.toLowerCase()}`,
					clickable: true,
				}}
				modules={[Pagination, Keyboard, Mousewheel]}
				breakpoints={{
					640: { slidesPerView: 2.1, spaceBetween: 22 },
					1024: { slidesPerView: 3, spaceBetween: 26 },
				}}
			>
				{items.map((item) => (
					<SwiperSlide key={item.id}>
						<div className="swiper-slide-content">
							{sectionType === "Video" ? (
								<video
									className="swiper-slide-video"
									src={item.videoUrl}
									poster={item.poster}
									preload="none"
									aria-label={item.title}
									controls
								/>
							) : (
								<div 
									role="link"
										tabIndex={0}
										aria-label={item.title}
										onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/blog/${item.id}`; }}
										onClick={() => window.location.href = `/blog/${item.id}`}
									style={{ cursor: "pointer" }}
								>
									<img
										className="swiper-slide-image"
										src={item.imageUrl}
										alt={item.title}
									/>
								</div>
							)}
							<div className="swiper-slide-text">
								<h2>{item.title}</h2>
								<p>{item.description}</p>
							</div>
						</div>
					</SwiperSlide>
				))}
				<div
					className={`swiper-pagination swiper-pagination-${sectionType.toLowerCase()}`}
				></div>
			</Swiper>
		</div>
	);
};

const TopTransformation = () => {
	const [dynamicBlogs, setDynamicBlogs] = React.useState([]);

	useEffect(() => {
		const fetchBlogs = async () => {
			try {
				const response = await fetch(`${BACKEND_URL || 'http://localhost:8080'}/api/webhook/getAllBlogs`);
				const data = await response.json();
				if (Array.isArray(data)) {
					// Map backend blog data to the format expected by the carousel
					const mappedBlogs = data.slice(0, 5).map(blog => {
						const rawHtmlContent = blog.description;
						const previewText = rawHtmlContent
							? rawHtmlContent.replace(/<[^>]*>/g, "").slice(0, 80)
							: "No content available...";
							
						return {
							id: blog._id,
							title: blog.title,
							description: previewText + "...",
							imageUrl: blog.url || blog.image || logo, // use logo as fallback
							link: `/blog/${blog._id}`
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
		<div className="top-transformation">
			<SwiperCarouselSection items={videos} sectionType="Video" />
			{dynamicBlogs.length > 0 && (
				<SwiperCarouselSection items={dynamicBlogs} sectionType="Blog" />
			)}
		</div>
	);
};

export default TopTransformation;
