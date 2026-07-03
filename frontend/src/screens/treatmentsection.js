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

  const updateVisibleCount = () => {
    const width = window.innerWidth;
    if (width > 1000) {
      setVisibleCount(5); 
    } else if (width <= 1000 && width > 700) {
      setVisibleCount(4); 
    } else if (width <= 700 && width > 530){
      setVisibleCount(3); 
    } else if (width <= 530 && width > 430){
      setVisibleCount(2); 
    }
    else if (width <= 431){
      setVisibleCount(1); 
    }
  };

  useEffect(() => {
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const showMore = () => {
    setVisibleCount(prevCount => Math.min(prevCount + visibleCount, medicines.length));
  };

  return (
    <section className="medicines-section">
      <div className="medicines-header">
        <h2 className="section-title">Explore All Medicines</h2>
      </div>
      <div className="medicines-grid">
        {loading ? (
          <p>Loading medicines...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          medicines.slice(0, visibleCount).map((medicine) => (
            <div className="medicine-cardt" key={medicine._id} onClick={() => navigate(`/medicines/${medicine._id}`)}>
              <img 
                src={(medicine.images && medicine.images.length > 0) ? medicine.images[0] : capsuleImage} 
                alt={medicine.name} 
                className="medicine-image" 
                onError={(e) => { e.target.onerror = null; e.target.src = capsuleImage; }}
              />
              <div className="medicine-cardt-info">
                <h3 className="medicine-name">{medicine.name}</h3>
                <p className="medicine-price">₹{medicine.price}</p>
                <button 
                  className="medicine-add-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
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
      {visibleCount < medicines.length && (
        <div className="see-more-wrapper">
          <a className="see-more-link" onClick={showMore}>
            See More <span className="arrow-icon">&#9662;</span>
          </a>
        </div>
      )}
    </section>
  );
};

export default Medicines;