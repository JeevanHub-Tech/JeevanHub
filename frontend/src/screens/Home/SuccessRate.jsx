import React from "react";

const points = [
	{
		title: "Practitioner-led care",
		desc: "Every plan comes from a certified Ayurvedic doctor, not an algorithm.",
	},
	{
		title: "Built around your body",
		desc: "Diet, herbs, and daily rhythm tuned to your dosha and your concern.",
	},
	{
		title: "Natural, quality-checked remedies",
		desc: "Authentic formulations, delivered to your door.",
	},
	{
		title: "Care from home",
		desc: "Consult, follow up, and stay on track without a clinic visit.",
	},
];

const SuccessRate = () => {
	return (
		<div className="bg-[radial-gradient(600px_300px_at_85%_20%,rgba(200,162,74,0.18),transparent_65%),linear-gradient(135deg,var(--jh-olive-light)_0%,var(--jh-olive-leaf)_55%,var(--jh-olive-deep)_100%)] px-5 py-16 sm:px-20">
			<div className="mx-auto flex max-w-300 flex-col-reverse items-center justify-between gap-12 text-left sm:flex-row sm:flex-wrap">
				<div className="max-w-145 flex-1 basis-110">
					<h2 className="font-display m-0 mb-3.5 text-[clamp(1.8rem,3.4vw,2.6rem)] leading-tight font-semibold tracking-tight text-(--jh-surface)">
						A calmer path to feeling well
					</h2>
					<p className="m-0 mb-7.5 text-lg leading-relaxed text-(--jh-sage-pale)">
						Ayurveda works gradually and holistically. We pair you with a real
						practitioner and a plan you can actually keep — so change is steady,
						natural, and yours.
					</p>

					<ul className="m-0 grid list-none grid-cols-1 gap-4.5 p-0 sm:grid-cols-2">
						{points.map((p) => (
							<li className="flex items-start gap-3" key={p.title}>
								<span
									className="flex size-7.5 shrink-0 items-center justify-center rounded-[9px] border border-white/28 bg-white/16 text-(--jh-surface)"
									aria-hidden="true"
								>
									<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
										<path d="M20 6 9 17l-5-5" />
									</svg>
								</span>
								<span className="flex flex-col gap-0.75">
									<strong className="text-base font-bold text-(--jh-surface)">{p.title}</strong>
									<span className="text-sm leading-snug text-(--jh-sage-pale-2)">{p.desc}</span>
								</span>
							</li>
						))}
					</ul>
				</div>

				<div className="flex flex-1 basis-90 items-center justify-center">
					<img
						src="https://images.unsplash.com/photo-1499728603263-13726abce5fd?w=600&auto=format&fit=crop&q=70"
						alt="A quiet, mindful moment by a window"
						className="aspect-[4/3.4] w-full max-w-120 rounded-[20px] border-6 border-white/14 object-cover shadow-[0_22px_50px_rgba(20,28,12,0.35)] sm:aspect-[4/5]"
						loading="lazy"
						decoding="async"
					/>
				</div>
			</div>
		</div>
	);
};

export default SuccessRate;
