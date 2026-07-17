import React from 'react';
import './ShopByConcern.css'; // Keeping the existing CSS

// Import images for different health concerns (Replace with actual images if available)
import digestiveHealthImage from '../media/digestive2.jpg';
import respiratoryHealthImage from '../media/respiratory.jpg';
import skinCareImage from '../media/skincare.jpg';
import jointHealthImage from '../media/joint.jpg';
import cardiovascularHealthImage from '../media/heart.jpg';
import mentalHealthImage from '../media/stress.jpg';
import DiabitiesImage from '../media/diabeties.jpg';

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
    <div className="SkinHealth_skinConcernWrapper__4RStK">
      <div className="ComponentHeader_componentHeaderDesktop__sNo2H ShopByConcern_sectionHeader__CLeME">
        <div className="ComponentHeader_headerTitle__oeo_k">
          <h2 className="title3-bold-d title3-bold-m">
            Explore Ayurvedic Treatments for Various Health Concerns
          </h2>
          <h4>
            Discover holistic solutions curated by expert doctors for optimal well-being.
          </h4>
        </div>
      </div>

      {/* One balanced grid — 7 concerns + a closing CTA tile fill 4 × 2 */}
      <div className="ShopByConcern_container__ZcaN3">
        {concerns.map((c) => (
          <a className="ShopByConcern_cardContainer__Y1toh" href={c.href} key={c.title}>
            <div className="ShopByConcern_textContainer__i6UMp">
              <h3 className="ShopByConcern_title__aV3sc">{c.title}</h3>
            </div>
            <div
              className="ShopByConcern_imageWrapper__pz_iH"
              style={{ backgroundImage: `url(${c.image})` }}
            ></div>
          </a>
        ))}

        <a className="concern-cta-tile" href="/treatments">
          <span className="concern-cta-tile__label">Explore all treatments</span>
          <span className="concern-cta-tile__arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
};

export default Treatments;
