import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import defaultProfilePic from '../media/default-profile.png';
import './TalkOfTheTown.css';

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
    fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/doctors/publicDoctors`)
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
    const backendUrl = process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080';
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
        <div className="title">Meet Our Doctors</div>
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
          {doctors.map((doctor, index) => (
            <div className="slick-slide1" key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                className="video-card1" 
                style={{ display: 'flex', flexDirection: 'column', height: 'auto', minHeight: '0', alignSelf: 'stretch', cursor: 'pointer' }}
                onClick={() => navigate('/doctor-detail', { state: { doctor } })}
              >
                <div className="video-thumbnail" style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={getDoctorImageUrl(doctor.profileImage)}
                    alt={doctor.name}
                    className="thumbnail-img"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultProfilePic;
                    }}
                  />
                </div>
                <div className="content" style={{ padding: '12px 15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flexGrow: 0, flexShrink: 1 }}>
                  <p className="influencer-name" style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: '600', color: '#333', textAlign: 'center' }}>{doctor.name}</p>
                  <p className="video-title" style={{ margin: '2px 0', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>{doctor.specialization}</p>
                  <div className="separator" style={{ height: '1px', backgroundColor: '#eee', margin: '8px auto', width: '80%' }}></div>
                  <p className="followers" style={{ margin: '2px 0', fontSize: '0.85rem', color: '#444', textAlign: 'center' }}>Experience: {doctor.experience}</p>
                  <p className="followers" style={{ margin: '2px 0', fontSize: '0.85rem', color: '#444', textAlign: 'center' }}>Rating: ⭐ {Number(doctor.rating).toFixed(1)} / 5</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {doctors.length > itemsPerPage && (
          <>
            <button className="arrow-button left" onClick={handleLeftClick}>←</button>
            <button className="arrow-button right" onClick={handleRightClick}>→</button>
          </>
        )}
      </div>
    </section>
  );
};

export default DoctorsSection;
