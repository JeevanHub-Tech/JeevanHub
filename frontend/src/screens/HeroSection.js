import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './HeroSection.css';
import heroBg from '../media/homebg.png';

function HeroSection() {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  const handleConsultButtonClick = () => {
    if (auth?.token) {
      navigate('/doctors'); // If already logged in, go straight to booking
    } else {
      navigate('/signin'); // Otherwise, prompt to sign in
    }
  };

  return (
    <section
      className="hero-section"
      style={{ backgroundImage: `url(${heroBg})` }}
      aria-label="Find Ayurvedic care"
    >
      <div className="hero-content">
        <h1>
          Find natural healing
          <br />
          with Ayurveda
        </h1>
        <p>
          Consult certified Ayurvedic doctors and follow a plan built around your
          body — diet, herbs, and daily rhythm, not quick fixes.
        </p>

        <div className="hero-actions">
          <button
            type="button"
            className="consult-btn"
            onClick={handleConsultButtonClick}
          >
            Book an appointment
          </button>
          <button
            type="button"
            className="consult-btn-secondary"
            onClick={() => navigate('/treatments')}
          >
            Explore treatments
          </button>
        </div>

        <p className="hero-note">
          Trusted by thousands across India · consultations from ₹500
        </p>
      </div>
    </section>
  );
}

export default HeroSection;
