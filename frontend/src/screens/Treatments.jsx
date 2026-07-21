import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function TreatmentsScreen() {
  const navigate = useNavigate();
  const treatments = [
    { category: 'Digestive Health', image: '../images/Digestive Health.png' },
    { category: 'Respiratory Health', image: '../images/Respiratory Health.jpg' },
    { category: 'Skin Care', image: '../images/Skin Care.jpg' },
    { category: 'Joint and Bone Health', image: '../images/Joint & Bone Health.jpg' },
    { category: 'Cardiovascular Health', image: '../images/Cardiovascular Health.jpg' },
    { category: 'Mental Health and Wellness', image: '../images/Mental Health and Wellness.jpg' },
    { category: 'Metabolic and Endocrine Health', image: '../images/Metabolism & Hormonal Health.jpg' },
    { category: 'Immune Support', image: '../images/Fatty Liver Treatment.jpg' },
    { category: "Women's Health", image: '../images/Women Health.jpg' },
    { category: "Men's Health", image: '../images/Mens Health.png' },
    { category: 'Liver and Kidney Health', image: '../images/Liver and Kidney Health.jpg' },
    { category: 'Eye Health', image: '../images/Eye Health.jpg' },
    { category: 'Oral Health', image: '../images/oral health.jpg' },
    { category: 'General Wellness', image: '../images/General Wellness.jpg' },
    { category: 'Infections', image: '../images/infection.jpg' },
    { category: 'Pain Management', image: '../images/Pain Management.jpg' },
  ];

  return (
    <div className="relative -mt-8 min-h-screen overflow-hidden bg-linear-to-b from-(--jh-cream-tint) to-background pt-8 pb-20">
      <span
        className="pointer-events-none absolute top-10 right-[6%] text-[190px] leading-none opacity-5"
        style={{ transform: 'rotate(18deg)' }}
        aria-hidden="true"
      >
        🌿
      </span>

      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <h1 className="font-display text-4xl leading-tight text-(--jh-olive-deep) sm:text-5xl">
          Treatments
        </h1>
        <div className="mx-auto mt-4 h-1 w-21 rounded-full bg-gradient-to-r from-(--jh-olive-leaf) via-(--jh-turmeric-gold) to-(--jh-bark-brown)" />
        <p className="mx-auto mt-4 mb-8 max-w-160 text-base leading-relaxed text-muted-foreground">
          Explore holistic Ayurvedic care across every area of health. Pick a
          concern to see remedies, approaches, and expert guidance.
        </p>
      </div>

      <div className="relative mx-auto grid max-w-315 grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-7 px-6 max-[560px]:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] max-[560px]:gap-3.5">
        {treatments.map((treatment, index) => (
          <button
            type="button"
            key={index}
            className="group relative aspect-4/5 cursor-pointer overflow-hidden rounded-2xl text-left shadow-(--jh-shadow-card) transition-[transform,box-shadow] duration-350 ease-(--jh-ease-organic) hover:-translate-y-2 hover:shadow-(--jh-shadow-hover) max-[900px]:aspect-[4/4.4] max-[560px]:aspect-3/4 max-[560px]:rounded-2xl"
            onClick={() => navigate(`/treatment/${encodeURIComponent(treatment.category)}`)}
          >
            <img
              src={treatment.image}
              alt={treatment.category}
              className="absolute inset-0 size-full object-cover transition-transform duration-600 ease-(--jh-ease-organic) group-hover:scale-108"
            />
            <span className="absolute inset-0 bg-linear-to-b from-black/0 from-38% via-black/55 via-72% to-black/88" />
            <span className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/92 text-(--jh-olive-deep) opacity-0 shadow-md transition-[opacity,transform] duration-350 ease-out -translate-y-1.5 -rotate-45 group-hover:translate-y-0 group-hover:rotate-0 group-hover:opacity-100 max-[560px]:size-8">
              <ArrowRight className="size-4.5 max-[560px]:size-3.5" aria-hidden="true" />
            </span>
            <h2 className="absolute inset-x-0 bottom-0 m-0 flex items-end gap-2.5 px-4.5 pt-5 pb-5.5 text-lg leading-tight font-bold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.45)] transition-transform duration-350 ease-out group-hover:-translate-y-1 max-[560px]:px-3 max-[560px]:pt-3.5 max-[560px]:pb-4 max-[560px]:text-sm">
              {treatment.category}
            </h2>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TreatmentsScreen;
