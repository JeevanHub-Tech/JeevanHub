import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import defaultProfilePic from '../media/default-profile.png';
import './TalkOfTheTown.css';
import { BACKEND_URL } from '../config';

const DoctorsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const navigate = useNavigate();

  // Mapped items per page based on viewport width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 625) {
        setItemsPerPage(1);
      } else if (window.innerWidth <= 850) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch doctors from backend on component mount
  useEffect(() => {
    fetch(`${BACKEND_URL || 'http://localhost:8080'}/api/doctors/publicDoctors`)
      .then((response) => response.json())
      .then((data) => {
        const mappedDoctors = data.map((doctor) => ({
          ...doctor, // spread to keep original fields for booking page
          id: doctor._id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          specialization: Array.isArray(doctor.specialization) ? doctor.specialization.join(', ') || "N/A" : doctor.specialization || doctor.designation || "N/A",
          experience: doctor.experience ? `${doctor.experience} years` : "0 years",
          age: `${doctor.age || 'N/A'}`,
          profileImage: doctor.profileImage || null,
          rating: doctor.rating || 0,
        }));
        
        // Sort by rating descending and take top 5
        const topDoctors = mappedDoctors.sort((a, b) => b.rating - a.rating).slice(0, 5);
        setDoctors(topDoctors);
      })
      .catch((error) => {
        console.error("Error fetching doctors:", error);
      });
  }, []);

  const getDoctorImageUrl = (profileImage) => {
    if (!profileImage || profileImage === 'null' || profileImage === 'undefined') {
      return defaultProfilePic;
    }
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
      return profileImage;
    }
    const backendUrl = BACKEND_URL || 'http://localhost:8080';
    if (profileImage.startsWith('/')) {
      return `${backendUrl}${profileImage}`;
    }
    return `${backendUrl}/${profileImage}`;
  };

  const handleLeftClick = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? Math.max(0, doctors.length - itemsPerPage) : prevIndex - 1));
  };

  const handleRightClick = () => {
    setCurrentIndex((prevIndex) => (prevIndex >= doctors.length - itemsPerPage ? 0 : prevIndex + 1));
  };

  return (
    <section className="talk-of-the-town">
      <div className="header1">
        <h2 className="title">Meet our doctors</h2>
        <p className="section-sub">
          Certified Ayurvedic practitioners, ready to build a plan around you.
        </p>
        <div className="gradient-border"></div>
      </div>

      <div className="slider-container">
        <div
          className="slick-slider1"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
            transition: 'transform 0.3s ease',
            '--items-per-page': itemsPerPage
          }}
        >
          {doctors.map((doctor, index) => {
            const isNew = !doctor.rating || Number(doctor.rating) <= 0;
            return (
              <div className="slick-slide1" key={index}>
                <div
                  className="doc-card"
                  role="button"
                  tabIndex={0}
                  aria-label={`View profile of ${doctor.name}`}
                  onClick={() => navigate('/doctor-detail', { state: { doctor } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate('/doctor-detail', { state: { doctor } });
                    }
                  }}
                >
                  <div className="doc-avatar">
                    <img
                      src={getDoctorImageUrl(doctor.profileImage)}
                      alt={doctor.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultProfilePic;
                      }}
                    />
                    <span className={`doc-badge ${isNew ? 'is-new' : ''}`}>
                      {isNew ? 'New' : `★ ${Number(doctor.rating).toFixed(1)}`}
                    </span>
                  </div>
                  <div className="doc-body">
                    <p className="doc-name">{doctor.name}</p>
                    <span className="doc-spec">{doctor.specialization}</span>
                    <div className="doc-exp">
                      <span>Experience</span>
                      <strong>{doctor.experience}</strong>
                    </div>
                    <span className="doc-view">View Profile →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {doctors.length > itemsPerPage && (
          <>
            <button className="arrow-button left" onClick={handleLeftClick} aria-label="Previous doctors">←</button>
            <button className="arrow-button right" onClick={handleRightClick} aria-label="Next doctors">→</button>
          </>
        )}
      </div>
    </section>
  );
};

export default DoctorsSection;
