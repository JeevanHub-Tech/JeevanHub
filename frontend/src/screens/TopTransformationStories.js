import React, { useEffect, useRef } from "react";
import "./TopTransformationStories.css";
import logo from "../media/logo.png";
import v from "../media/mov_bbb.mp4";

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
		title: "Video 1: Fitness Transformation",
		description: "Watch how this individual transformed their fitness journey.",
		videoUrl: v,
	},
	{
		id: 2,
		title: "Video 2: Weight Loss Success",
		description: "A story of a dramatic weight loss transformation.",
		videoUrl: v,
	},
	{
		id: 3,
		title: "Video 3: Health Transformation",
		description:
			"See how someone changed their life through a health-focused approach.",
		videoUrl: v,
	},
	{
		id: 4,
		title: "Video 4: Bodybuilding Journey",
		description: "A bodybuilding transformation story that will inspire you.",
		videoUrl: v,
	},
	{
		id: 5,
		title: "Video 5: Overcoming Adversity",
		description: "A powerful story of overcoming challenges through fitness.",
		videoUrl: v,
	},
];

// Dynamic blogs fetched from backend

const SwiperCarouselSection = ({ items, sectionType }) => {
	const handleVideoClick = (videoElement) => {
		if (videoElement.paused || videoElement.ended) {
			videoElement.play();
		} else {
			videoElement.pause();
		}
	};

	return (
		<div className="swiper-carousel-section">
			<h2>{sectionType} Highlights</h2>
			<Swiper
				effect={"coverflow"}
				grabCursor={true}
				centeredSlides={true}
				slidesPerView={"auto"}
				spaceBetween={0}
				coverflowEffect={{
					rotate: 0,
					stretch: 0,
					depth: 100,
					modifier: 1,
					slideShadows: true,
				}}
				keyboard={{ enabled: true }}
				mousewheel={{ thresholdDelta: 70 }}
				loop={true}
				pagination={{
					el: `.swiper-pagination-${sectionType.toLowerCase()}`,
					clickable: true,
				}}
				modules={[EffectCoverflow, Pagination, Keyboard, Mousewheel]}
				breakpoints={{
					640: { slidesPerView: "auto", spaceBetween: 0 },
					768: { slidesPerView: "auto", spaceBetween: 0 },
					1024: { slidesPerView: "auto", spaceBetween: 0 },
					1560: { slidesPerView: "auto", spaceBetween: 0 },
				}}
			>
				{items.map((item) => (
					<SwiperSlide key={item.id}>
						<div className="swiper-slide-content">
							{sectionType === "Video" ? (
								<video
									className="swiper-slide-video"
									src={item.videoUrl}
									preload="metadata"
									onClick={(e) => handleVideoClick(e.target)}
									controls={false}
								/>
							) : (
								<div 
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
				const response = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/webhook/getAllBlogs`);
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
