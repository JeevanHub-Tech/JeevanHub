import './treatmentsection.css';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import capsuleImage from '../media/capsule.jpg';

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/medicines`);
        if (Array.isArray(response.data)) {
          setMedicines(response.data);
        } else if (response.data && Array.isArray(response.data.medicines)) {
          setMedicines(response.data.medicines);
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch medicines:", err);
        setError("Failed to load medicines.");
        setLoading(false);
      }
    };
    fetchMedicines();
  }, []);

  const [visibleCount, setVisibleCount] = useState(5);
  const [defaultVisibleCount, setDefaultVisibleCount] = useState(5);

  const updateVisibleCount = () => {
    const width = window.innerWidth;
    let count = 5;
    if (width > 1000) count = 5;
    else if (width <= 1000 && width > 700) count = 4;
    else if (width <= 700 && width > 530) count = 3;
    else if (width <= 530 && width > 430) count = 2;
    else if (width <= 431) count = 1;
    
    setDefaultVisibleCount(count);
    // Only reset visible count if it's currently at the default
    setVisibleCount(prev => prev <= count ? count : prev);
  };

  useEffect(() => {
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const showMore = () => {
    setVisibleCount(prevCount => Math.min(prevCount + defaultVisibleCount, medicines.length));
  };

  const showLess = () => {
    setVisibleCount(defaultVisibleCount);
  };

  return (
    <section className="medicines-section">
      <div className="medicines-header">
        <h2 className="section-title">Explore All Medicines</h2>
        <p className="medicines-subtitle">Authentic, quality-checked Ayurvedic remedies delivered to your door.</p>
      </div>
      <div className="medicines-grid">
        {loading ? (
          <p>Loading medicines...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          medicines.slice(0, visibleCount).map((medicine) => (
            <div className="medicine-cardt" key={medicine._id}>
              <button
                type="button"
                className="medicine-cardt__open"
                aria-label={`View ${medicine.name}`}
                onClick={() => navigate(`/medicines/${medicine._id}`)}
              >
                <span className="medicine-image-wrap">
                  <img
                    src={(medicine.images && medicine.images.length > 0) ? medicine.images[0] : capsuleImage}
                    alt={medicine.name}
                    className="medicine-image"
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = capsuleImage; }}
                  />
                </span>
                <span className="medicine-cardt-info">
                  {medicine.category && <span className="medicine-cat-chip">{medicine.category}</span>}
                  <span className="medicine-name">{medicine.name}</span>
                </span>
              </button>
              <div className="medicine-cardt-foot">
                <span className="medicine-price">₹{medicine.price}</span>
                <button
                  type="button"
                  className="medicine-add-btn"
                  onClick={() => {
                    const patientId = localStorage.getItem("userId");
                    const token = localStorage.getItem("token");
                    if (!patientId) {
                      alert("Please login first to add items to cart");
                      navigate('/signin');
                      return;
                    }
                    axios.post(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/cart/add`, {
                      patientId,
                      medicineId: medicine._id,
                      quantity: 1
                    }, { headers: { Authorization: `Bearer ${token}` } })
                    .then(() => alert("Added to cart successfully!"))
                    .catch(err => alert("Failed to add to cart"));
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="see-more-wrapper" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        {visibleCount < medicines.length && (
          <button type="button" className="see-more-link" onClick={showMore}>
            See More <span className="arrow-icon" aria-hidden="true">&#9662;</span>
          </button>
        )}
        {visibleCount > defaultVisibleCount && (
          <button type="button" className="see-more-link" onClick={showLess}>
            See Less <span className="arrow-icon" aria-hidden="true" style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>&#9662;</span>
          </button>
        )}
      </div>
    </section>
  );
};

export default Medicines;