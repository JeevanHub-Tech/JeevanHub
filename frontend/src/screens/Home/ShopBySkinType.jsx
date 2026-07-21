// ShopBySkinType.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Import local images
import homebg from '../../media/homebg.png';
import doctorsImage from '../../media/od.png';
import technologyImage from '../../media/ot.jpg';
import successStoriesImage from '../../media/cs.jpg';

const ShopBySkinType = () => {
  const navigate = useNavigate();

  return (
    <div
      className="relative bg-cover bg-center px-5 py-16 sm:px-[8vw] sm:py-16 lg:px-30"
      style={{
        backgroundImage: `linear-gradient(rgba(247, 248, 243, 0.86), rgba(247, 248, 243, 0.92)), url(${homebg})`,
      }}
    >
      {/* Section Header */}
      <div className="mb-9 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display relative m-0 inline-block text-2xl leading-tight font-extrabold tracking-tight text-(--jh-olive-deep) after:mx-auto after:mt-3.5 after:block after:h-1 after:w-19 after:rounded-full after:bg-gradient-to-r after:from-(--jh-olive-leaf) after:to-(--jh-turmeric-gold) sm:text-3xl">
            Why Choose Us for Treatment?
          </h2>
        </div>
      </div>

      {/* Top section (Benefit Cards) */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
        {[
          {
            title: 'Expert Care',
            desc: 'Experienced, certified Ayurvedic practitioners',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3v6a6 6 0 0 0 12 0V3" />
                <path d="M4 3h4M16 3h4" />
                <path d="M12 15v3a4 4 0 0 0 8 0v-1" />
                <circle cx="20" cy="14" r="2" />
              </svg>
            ),
          },
          {
            title: 'Gentle & Natural',
            desc: 'Herbs and routine, not quick chemical fixes',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 9-10 1 6-1 12-2 17Z" />
                <path d="M11 20c0-4 2-8 6-10" />
              </svg>
            ),
          },
          {
            title: 'Reliable Treatment',
            desc: 'Accurate diagnosis rooted in Ayurvedic science',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            ),
          },
          {
            title: 'Fair & Affordable',
            desc: 'Honest plans, no compromise on quality',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                <path d="M3 7V6a2 2 0 0 1 2-2h11" />
                <circle cx="16" cy="13" r="1.4" />
              </svg>
            ),
          },
        ].map((b) => (
          <div
            key={b.title}
            className="group relative flex flex-col items-center overflow-hidden rounded-[18px] border border-(--jh-line-strong) bg-(--jh-surface) px-5.5 pt-7.5 pb-6.5 shadow-[0_8px_22px_rgba(47,53,36,0.07)] transition-[transform,box-shadow] duration-320 ease-out before:absolute before:inset-x-0 before:top-0 before:h-1 before:origin-left before:scale-x-0 before:bg-gradient-to-r before:from-(--jh-olive-leaf) before:to-(--jh-turmeric-gold) before:transition-transform before:duration-350 hover:-translate-y-1.5 hover:shadow-[0_18px_38px_rgba(47,53,36,0.15)] hover:before:scale-x-100"
          >
            <div
              className="mb-4 flex size-16 items-center justify-center rounded-[18px] border border-(--jh-line-strong) bg-gradient-to-br from-(--jh-sage-pale) to-(--jh-sage-pale-2) text-(--jh-olive-action) shadow-[inset_0_2px_6px_rgba(255,255,255,0.7)] transition-transform duration-350 ease-out [&_svg]:size-7.5 group-hover:-translate-y-1 group-hover:scale-106"
              aria-hidden="true"
            >
              {b.icon}
            </div>
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <div className="m-0 text-[1.1rem] font-extrabold text-(--jh-olive-deep)">{b.title}</div>
              <div className="m-0 text-sm leading-relaxed text-muted-foreground">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section (Navigation tiles) */}
      <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
        {/* Our Treatment Tab */}
        <button
          type="button"
          className="group relative block min-h-47.5 w-full overflow-hidden rounded-[18px] border-none bg-none p-0 text-left font-inherit shadow-[0_8px_22px_rgba(47,53,36,0.1)] transition-[transform,box-shadow] duration-320 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(47,53,36,0.2)]"
          onClick={() => navigate('/treatments')}
          aria-label="Explore our treatments"
        >
          <span
            className="absolute inset-0 h-full bg-cover bg-center transition-transform duration-600 ease-out group-hover:scale-108"
            style={{
              backgroundImage: `url(${technologyImage})`,
            }}
          ></span>
          <span className="absolute inset-0 z-1 bg-gradient-to-b from-[rgba(20,28,12,0)] from-40% to-[rgba(20,28,12,0.7)]"></span>
          <span className="absolute inset-x-0 bottom-0 z-2 flex items-center justify-between p-5">
            <span className="m-0 text-xl font-extrabold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.4)] after:ml-2.5 after:inline-block after:translate-x-[-6px] after:opacity-0 after:transition-[opacity,transform] after:duration-300 after:content-['→'] group-hover:after:translate-x-0 group-hover:after:opacity-100">
              Our Treatment
            </span>
          </span>
        </button>

        {/* Our Doctors Tab */}
        <button
          type="button"
          className="group relative block min-h-47.5 w-full overflow-hidden rounded-[18px] border-none bg-none p-0 text-left font-inherit shadow-[0_8px_22px_rgba(47,53,36,0.1)] transition-[transform,box-shadow] duration-320 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(47,53,36,0.2)]"
          onClick={() => navigate('/doctors')}
          aria-label="Meet our doctors"
        >
          <span
            className="absolute inset-0 h-full bg-cover bg-center transition-transform duration-600 ease-out group-hover:scale-108"
            style={{
              backgroundImage: `url(${doctorsImage})`,
            }}
          ></span>
          <span className="absolute inset-0 z-1 bg-gradient-to-b from-[rgba(20,28,12,0)] from-40% to-[rgba(20,28,12,0.7)]"></span>
          <span className="absolute inset-x-0 bottom-0 z-2 flex items-center justify-between p-5">
            <span className="m-0 text-xl font-extrabold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.4)] after:ml-2.5 after:inline-block after:translate-x-[-6px] after:opacity-0 after:transition-[opacity,transform] after:duration-300 after:content-['→'] group-hover:after:translate-x-0 group-hover:after:opacity-100">
              Our Doctors
            </span>
          </span>
        </button>

        {/* Case Studies Tab */}
        <button
          type="button"
          className="group relative block min-h-47.5 w-full overflow-hidden rounded-[18px] border-none bg-none p-0 text-left font-inherit shadow-[0_8px_22px_rgba(47,53,36,0.1)] transition-[transform,box-shadow] duration-320 ease-out hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(47,53,36,0.2)]"
          onClick={() => navigate('/blogs-videos')}
          aria-label="Read patient case studies"
        >
          <span
            className="absolute inset-0 h-full bg-cover bg-center transition-transform duration-600 ease-out group-hover:scale-108"
            style={{
              backgroundImage: `url(${successStoriesImage})`,
            }}
          ></span>
          <span className="absolute inset-0 z-1 bg-gradient-to-b from-[rgba(20,28,12,0)] from-40% to-[rgba(20,28,12,0.7)]"></span>
          <span className="absolute inset-x-0 bottom-0 z-2 flex items-center justify-between p-5">
            <span className="m-0 text-xl font-extrabold text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.4)] after:ml-2.5 after:inline-block after:translate-x-[-6px] after:opacity-0 after:transition-[opacity,transform] after:duration-300 after:content-['→'] group-hover:after:translate-x-0 group-hover:after:opacity-100">
              Case Studies
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default ShopBySkinType;
