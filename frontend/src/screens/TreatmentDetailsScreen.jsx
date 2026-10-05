import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
	getTreatmentData,
	ayurvedicConsultationsEn,
	ayurvedicConsultationsHi,
} from "@/data/treatmentData";

function ConcernCard({ concern, index }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [imageFailed, setImageFailed] = useState(false);
	const reversed = index % 2 === 0;

	return (
		<Card
			className={cn(
				"group flex-col gap-0 rounded-[22px] border-(--jh-line) p-0 shadow-(--jh-shadow-rest) ring-0 transition-all duration-300 [transition-timing-function:var(--jh-ease-organic)] hover:-translate-y-1 hover:shadow-(--jh-shadow-hover) md:flex-row md:items-stretch",
				reversed && "md:flex-row-reverse"
			)}
		>
			<div
				className={cn(
					"relative flex-none overflow-hidden bg-(--jh-sage-pale) md:max-w-[40%] md:flex-[0_0_40%]",
					"aspect-[4/3] w-full sm:aspect-video md:aspect-auto",
					imageFailed && "flex items-center justify-center"
				)}
			>
				{imageFailed ? (
					<Leaf aria-hidden="true" className="size-14 text-(--jh-olive-leaf)/40" />
				) : (
					<img
						src={concern.image}
						alt={concern.title}
						className="size-full object-cover transition-transform duration-700 [transition-timing-function:var(--jh-ease-organic)] group-hover:scale-105"
						loading="lazy"
						onError={() => setImageFailed(true)}
					/>
				)}
				<span className="absolute top-4 left-4 z-10 rounded-xl bg-(--jh-olive-deep)/82 px-3 py-1.5 text-sm font-extrabold tracking-wide text-white shadow-md backdrop-blur-sm">
					{String(index + 1).padStart(2, "0")}
				</span>
			</div>
			<div className="flex flex-1 flex-col p-6 md:p-8">
				<Badge className="mb-3 self-start bg-(--jh-turmeric-gold)/14 text-[0.68rem] font-extrabold tracking-[0.06em] text-(--jh-bark-brown) uppercase">
					{t("treatments.commonConcern", "Common Concern")}
				</Badge>
				<h3 className="mb-3.5 text-xl leading-tight font-extrabold tracking-tight text-(--jh-olive-deep) sm:text-2xl">
					{concern.title}
				</h3>
				<p className="mb-5 text-justify text-[0.98rem] leading-relaxed text-(--jh-muted)">
					{concern.description}
				</p>
				<h4 className="mb-3.5 flex items-center gap-2 text-base font-extrabold text-(--jh-olive-deep)">
					<Leaf aria-hidden="true" className="size-4 text-(--jh-olive-leaf)" />
					{t("treatments.ayurvedicApproach", "Ayurvedic Approach")}
				</h4>
				<ul className="mb-5 flex flex-col gap-2.5">
					{concern.approach.map((step, i) => (
						<li
							key={i}
							className="relative rounded-xl border border-(--jh-line) bg-(--jh-sage-pale)/50 py-3 pr-3.5 pl-10 text-justify text-sm leading-relaxed text-(--jh-ink) transition-colors hover:border-(--jh-olive-leaf)/28 hover:bg-(--jh-sage-pale)"
						>
							<Leaf aria-hidden="true" className="absolute top-3 left-3 size-3.5 text-(--jh-olive-leaf)" />
							{step}
						</li>
					))}
				</ul>
				<div className="mt-auto flex flex-wrap items-center justify-between gap-3.5 border-t border-dashed border-(--jh-line) pt-4">
					<p className="min-w-[200px] flex-1 text-left text-sm italic text-(--jh-bark-brown)">
						{concern.callToAction}
					</p>
					<Button
						onClick={() => navigate("/doctors")}
						className="shrink-0 rounded-full bg-(--jh-olive-leaf) px-5 text-white shadow-md hover:bg-(--jh-olive-hover)"
					>
						{t("treatments.bookConsultation", "Book Consultation")} <ArrowRight aria-hidden="true" className="size-4" />
					</Button>
				</div>
			</div>
		</Card>
	);
}

function TreatmentDetailsScreen() {
	const { t, i18n } = useTranslation();
	const { category } = useParams();
	const navigate = useNavigate();

	const currentLang = i18n.language === "hi" ? "hi" : "en";
	const decodedCategory = decodeURIComponent(category || "");
	const details = getTreatmentData(decodedCategory, currentLang);

	const consultations = currentLang === "hi" ? ayurvedicConsultationsHi : ayurvedicConsultationsEn;

	if (!details) {
		return (
			<div className="mx-auto max-w-4xl px-5 pb-16 text-center">
				<h2 className="mb-5 text-2xl font-extrabold text-(--jh-olive-deep)">
					{t("treatments.categoryNotFound", "Category not found.")}
				</h2>
				<Link
					to="/treatments"
					className="inline-flex items-center gap-1.5 rounded-full border border-(--jh-line) bg-white/60 px-3.5 py-1.5 text-sm font-bold tracking-wide text-(--jh-olive-leaf) uppercase transition-colors hover:bg-(--jh-olive-leaf) hover:text-white"
				>
					<ArrowLeft aria-hidden="true" className="size-4" /> {t("treatments.backToTreatments", "Back to Treatments")}
				</Link>
			</div>
		);
	}

	// Calculate deterministic consultation message based on category string
	const charSum = decodedCategory.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
	const consultationIndex = charSum % consultations.length;
	const selectedConsultation = consultations[consultationIndex];

	return (
		<div className="mx-auto max-w-[1120px] px-5 pt-6 pb-[70px] text-(--jh-ink) sm:px-[14px] sm:pt-4 sm:pb-[50px] md:mt-[108px] lg:mt-[116px]">
			{/* Hero header */}
			<Card
				className="relative mb-13 gap-0 overflow-hidden rounded-[18px] border-(--jh-line) bg-[radial-gradient(700px_240px_at_90%_-40px,color-mix(in_srgb,var(--jh-turmeric-gold)_16%,transparent),transparent_70%),linear-gradient(135deg,var(--jh-cream-tint)_0%,var(--jh-cream)_100%)] p-6 shadow-none ring-0 after:absolute after:right-[-6px] after:bottom-[-24px] after:text-[150px] after:opacity-[0.06] after:content-['🌿'] after:[transform:rotate(-15deg)] sm:p-6 md:rounded-3xl md:p-10"
			>
				<Link
					to="/treatments"
					className="mb-5 inline-flex items-center gap-1.5 self-start rounded-full border border-(--jh-line) bg-white/60 px-3.5 py-1.5 text-sm font-bold tracking-wide text-(--jh-olive-leaf) uppercase transition-all hover:-translate-x-1 hover:bg-(--jh-olive-leaf) hover:text-white"
				>
					<ArrowLeft aria-hidden="true" className="size-4" /> {t("treatments.backToTreatments", "Back to Treatments")}
				</Link>
				<h1 className="relative mb-4 text-[1.9rem] leading-tight font-extrabold tracking-tight text-(--jh-olive-deep) before:mb-4.5 before:block before:h-1 before:w-14 before:rounded-full before:bg-[linear-gradient(90deg,var(--jh-olive-leaf),var(--jh-turmeric-gold))] sm:text-[2.2rem] md:text-[2.7rem]">
					{details.title}
				</h1>
				<p className="relative max-w-[800px] text-justify text-base leading-relaxed text-(--jh-muted)">
					{details.description}
				</p>
			</Card>

			<div className="mb-11 text-center">
				<h2 className="mb-3.5 text-2xl font-extrabold tracking-tight text-(--jh-olive-deep) sm:text-[1.9rem]">
					{t("treatments.commonConcernsTitle", "Common Concerns & Ayurvedic Approach")}
				</h2>
				<span className="inline-block h-1 w-20 rounded-full bg-[linear-gradient(90deg,var(--jh-olive-leaf),var(--jh-turmeric-gold),var(--jh-bark-brown))]" />
			</div>

			<div className="flex flex-col gap-10">
				{details.concerns.map((concern, index) => (
					<ConcernCard key={index} concern={concern} index={index} />
				))}
			</div>

			{/* Ayurvedic Consultation Section (Rotating Messages) */}
			<Card
				className="relative mt-14 gap-0 overflow-hidden rounded-3xl border-none bg-[radial-gradient(600px_200px_at_15%_0%,color-mix(in_srgb,var(--jh-turmeric-gold)_22%,transparent),transparent_70%),linear-gradient(135deg,var(--jh-olive-leaf)_0%,var(--jh-olive-deep)_100%)] p-6 text-center text-white shadow-none ring-0 after:absolute after:right-6 after:bottom-[-20px] after:text-[130px] after:opacity-[0.08] after:content-['🌿'] after:[transform:rotate(-12deg)] sm:p-8 md:p-11"
			>
				<h2 className="relative mb-6 text-2xl font-extrabold text-white sm:text-[1.9rem]">
					{selectedConsultation.title}
				</h2>
				<ul className="relative mx-auto mb-7 grid max-w-[680px] grid-cols-1 gap-3 text-left sm:grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
					{selectedConsultation.points.map((point, index) => (
						<li
							key={index}
							className="relative flex items-start gap-2 rounded-xl border border-white/[0.14] bg-white/[0.08] py-3 pr-3.5 pl-3.5 text-[0.96rem] leading-snug text-(--jh-cream-tint)"
						>
							<Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-(--jh-turmeric-gold)" />
							{point}
						</li>
					))}
				</ul>
				<p className="relative mb-6 text-base font-medium text-white">
					{selectedConsultation.callToAction}
				</p>
				<Button
					onClick={() => navigate("/doctors")}
					className="relative rounded-full bg-white px-8 py-6 text-base font-extrabold text-(--jh-olive-deep) shadow-lg hover:-translate-y-0.5 hover:bg-white/90"
				>
					{t("treatments.findDoctor", "Find an Ayurvedic Doctor")}
				</Button>
			</Card>
		</div>
	);
}

export default TreatmentDetailsScreen;
