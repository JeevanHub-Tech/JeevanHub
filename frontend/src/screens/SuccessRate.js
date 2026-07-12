import React from "react";
import "./SuccessRate.css"; // Ensure your CSS file is properly linked

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
		<div className="success-rate-wrapper">
			<div className="success-rate-container">
				<div className="success-rate-content">
					<h2 className="success-rate-title">A calmer path to feeling well</h2>
					<p className="success-rate-description">
						Ayurveda works gradually and holistically. We pair you with a real
						practitioner and a plan you can actually keep — so change is steady,
						natural, and yours.
					</p>

					<ul className="success-points">
						{points.map((p) => (
							<li className="success-point" key={p.title}>
								<span className="success-point__mark" aria-hidden="true">
									<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
										<path d="M20 6 9 17l-5-5" />
									</svg>
								</span>
								<span className="success-point__text">
									<strong>{p.title}</strong>
									<span>{p.desc}</span>
								</span>
							</li>
						))}
					</ul>
				</div>

				<div className="image-wrapper">
					<img
						src="https://images.unsplash.com/photo-1499728603263-13726abce5fd?w=600&auto=format&fit=crop&q=70"
						alt="A quiet, mindful moment by a window"
						className="success-rate-image"
						loading="lazy"
						decoding="async"
					/>
				</div>
			</div>
		</div>
	);
};

export default SuccessRate;
