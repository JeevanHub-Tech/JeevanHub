// ShopBySkinType.js
import React from 'react';
import './ShopBySkinType.css'; // Import the specific CSS file for Shop by Skin Type
import homebg from '../media/homebg.png';
import { useNavigate } from 'react-router-dom';

// Import local images
import expertCareImage from '../media/ec.jpg';
import quickReliefImage from '../media/qr.png';
import advancedTechnologyImage from '../media/at.jpg';
import costEffectiveImage from '../media/ce.png';
import doctorsImage from '../media/od.png';
import technologyImage from '../media/ot.jpg';
import successStoriesImage from '../media/cs.jpg';

const ShopBySkinType = () => {
  const navigate = useNavigate();
  
  return (
    <div className="SkinHealth_skinTypeWrapper__InDhG">
      {/* Section Header */}
      <div className="ComponentHeader_componentHeaderDesktop__sNo2H ShopBySkinType_sectionHeader__4dj9l">
        <div className="ComponentHeader_headerTitle__oeo_k">
          <h2 className="title3-bold-d title3-bold-m">Why Choose Us for Treatment?</h2>
        </div>
      </div>
 
      {/* Top section (Benefit Cards) */}
      <div className="ShopBySkinType_container__cvZMd top-section">
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
          <div key={b.title} className="ShopBySkinType_cardContainer__r93Qr ShopBySkinType_shortCard__d3YWU">
            <div className="benefit-icon" aria-hidden="true">{b.icon}</div>
            <div className="ShopBySkinType_textContainer__fXBb0">
              <div className="ShopBySkinType_title__lstmx">{b.title}</div>
              <div className="ShopBySkinType_description__ltIg9">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section (Navigation tiles) */}
      <div className="ShopBySkinType_container__cvZMd bottom-section">
        {/* Our Treatment Tab */}
        <button
          type="button"
          className="ShopBySkinType_cardContainer__r93Qr ShopBySkinType_longCard__JuzwU"
          onClick={() => navigate('/treatments')}
          aria-label="Explore our treatments"
        >
          <span
            className="ShopBySkinType_imageWrapper__AZriZ"
            style={{
              backgroundImage: `url(${technologyImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></span>
          <span className="ShopBySkinType_textContainer__fXBb0">
            <span className="ShopBySkinType_title__lstmx">Our Treatment</span>
          </span>
        </button>

        {/* Our Doctors Tab */}
        <button
          type="button"
          className="ShopBySkinType_cardContainer__r93Qr ShopBySkinType_longCard__JuzwU"
          onClick={() => navigate('/doctors')}
          aria-label="Meet our doctors"
        >
          <span
            className="ShopBySkinType_imageWrapper__AZriZ"
            style={{
              backgroundImage: `url(${doctorsImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></span>
          <span className="ShopBySkinType_textContainer__fXBb0">
            <span className="ShopBySkinType_title__lstmx">Our Doctors</span>
          </span>
        </button>

        {/* Case Studies Tab */}
        <button
          type="button"
          className="ShopBySkinType_cardContainer__r93Qr ShopBySkinType_longCard__JuzwU"
          onClick={() => navigate('/blogs-videos')}
          aria-label="Read patient case studies"
        >
          <span
            className="ShopBySkinType_imageWrapper__AZriZ"
            style={{
              backgroundImage: `url(${successStoriesImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></span>
          <span className="ShopBySkinType_textContainer__fXBb0">
            <span className="ShopBySkinType_title__lstmx">Case Studies</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default ShopBySkinType;
