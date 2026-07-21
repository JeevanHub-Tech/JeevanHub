import React from 'react';

// Import images for different health concerns (Replace with actual images if available)
import digestiveHealthImage from '../../media/digestive2.jpg';
import respiratoryHealthImage from '../../media/respiratory.jpg';
import skinCareImage from '../../media/skincare.jpg';
import jointHealthImage from '../../media/joint.jpg';
import cardiovascularHealthImage from '../../media/heart.jpg';
import mentalHealthImage from '../../media/stress.jpg';
import DiabitiesImage from '../../media/diabeties.jpg';

const concerns = [
  { title: 'Digestive Health', image: digestiveHealthImage, href: '/treatment/Digestive%20Health' },
  { title: 'Respiratory Health', image: respiratoryHealthImage, href: '/treatment/Respiratory%20Health' },
  { title: 'Skin Care', image: skinCareImage, href: '/treatment/Skin%20Care' },
  { title: 'Joint & Bone Health', image: jointHealthImage, href: '/treatment/Joint%20and%20Bone%20Health' },
  { title: 'Cardiovascular Health', image: cardiovascularHealthImage, href: '/treatment/Cardiovascular%20Health' },
  { title: 'Mental Health & Wellness', image: mentalHealthImage, href: '/treatment/Mental%20Health%20and%20Wellness' },
  { title: 'Metabolic & Endocrine Health', image: DiabitiesImage, href: '/treatment/Metabolic%20and%20Endocrine%20Health' },
];

const Treatments = () => {
  return (
    <div className="bg-gradient-to-b from-[#f7f8f3] to-(--jh-sage-pale) px-5 py-16 sm:px-[8vw] sm:py-16 lg:px-30">
      <div className="mb-8.5">
        <div className="text-left">
          <h2 className="font-display m-0 mb-2 text-2xl leading-tight font-extrabold tracking-tight text-(--jh-olive-deep) sm:text-3xl">
            Explore Ayurvedic Treatments for Various Health Concerns
          </h2>
          <h4 className="m-0 text-base font-medium text-muted-foreground">
            Discover holistic solutions curated by expert doctors for optimal well-being.
          </h4>
        </div>
      </div>

      {/* One balanced grid — 7 concerns + a closing CTA tile fill 4 × 2 */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-5.5 md:grid-cols-4">
        {concerns.map((c) => (
          <a
            className="group relative isolate block aspect-[4/3.4] overflow-hidden rounded-[18px] text-decoration-none shadow-[0_8px_22px_rgba(47,53,36,0.1)] transition-transform duration-450 ease-out hover:-translate-y-1.75 hover:shadow-[0_22px_44px_rgba(47,53,36,0.22)]"
            href={c.href}
            key={c.title}
          >
            <div className="absolute inset-x-0 bottom-0 z-2 flex items-end justify-start px-4.5 pt-4.5 pb-5">
              <h3 className="relative m-0 pt-2 text-left text-[1.12rem] font-extrabold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.45)] before:absolute before:top-0 before:left-0 before:h-0.75 before:w-7.5 before:origin-left before:scale-x-70 before:rounded-[3px] before:bg-gradient-to-r before:from-(--jh-turmeric-gold) before:to-white before:opacity-80 before:transition-transform before:duration-350 before:ease-out group-hover:before:scale-x-170 group-hover:before:opacity-100">
                {c.title}
              </h3>
            </div>
            <div
              className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-600 ease-out group-hover:scale-108"
              style={{ backgroundImage: `url(${c.image})` }}
            ></div>
            <div className="absolute inset-0 z-1 bg-gradient-to-b from-[rgba(20,28,12,0)] from-42% to-[rgba(20,28,12,0.72)]"></div>
          </a>
        ))}

        <a
          className="flex aspect-[4/3.4] flex-col justify-between rounded-[18px] bg-gradient-to-br from-(--jh-olive-light) via-(--jh-olive-leaf) via-55% to-(--jh-olive-deep) p-5.5 text-decoration-none shadow-[0_8px_22px_rgba(47,53,36,0.16)] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1.75 hover:shadow-[0_22px_44px_rgba(47,53,36,0.28)]"
          href="/treatments"
        >
          <span className="font-display text-xl leading-tight font-semibold text-(--jh-surface)">
            Explore all treatments
          </span>
          <span
            className="flex size-10.5 self-end items-center justify-center rounded-full bg-(--jh-cream) text-[1.3rem] text-(--jh-olive-deep) transition-transform duration-300 ease-out"
            aria-hidden="true"
          >
            →
          </span>
        </a>
      </div>
    </div>
  );
};

export default Treatments;
