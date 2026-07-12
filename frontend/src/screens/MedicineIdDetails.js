import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./MedicineIdDetails.css";

// Fallback image (real generic pharmacy photo)
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80";

function MedicineIdDetails({ addToCart }) {
  const { id, medicineId } = useParams();
  const paramId = decodeURIComponent(medicineId ?? id ?? "");
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // --- Image Swipe & Modal Logic ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const incrementQty = () => setQuantity(q => q + 1);
  const decrementQty = () => setQuantity(q => Math.max(1, q - 1));

  useEffect(() => {
    // Scroll to top when opening a new detail page
    window.scrollTo(0, 0);
    
    const fetchMedicine = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/medicines/${paramId}`);
        const data = response.data;
        
        // Map backend data to frontend expected format
        const formattedMedicine = {
          id: data._id,
          name: data.name,
          pharmacy: data.retailerId ? `${data.retailerId.firstName || ''} ${data.retailerId.lastName || ''}`.trim() : "Unknown Pharmacy",
          price: data.price,
          images: data.images && data.images.length > 0 
            ? data.images.map(img => img.startsWith('http') ? img : `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/${img}`)
            : [FALLBACK_IMAGE],
          imageSrc: data.images && data.images.length > 0 
            ? (data.images[0].startsWith('http') ? data.images[0] : `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/${data.images[0]}`)
            : FALLBACK_IMAGE,
          description: data.description || "No description provided.",
          prescription: data.prescription || false,
          // Fill placeholders for fields not in backend schema yet
          ingredients: ["Information not provided"],
          usesBenefits: ["Information not provided"],
          dosage: "Please consult your doctor.",
          storageSafety: "Store in a cool, dry place.",
        };
        
        setMedicine(formattedMedicine);
      } catch (err) {
        console.error("Error fetching medicine details:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (paramId) {
      fetchMedicine();
    }
  }, [paramId]);

  if (loading) {
    return <main className="medicine-details"><h2>Loading...</h2></main>;
  }

  if (error || !medicine) {
    return (
      <main className="medicine-details">
        <div className="medicine-details__header">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ← Back
          </button>
        </div>
        <section className="medicine-details__not-found">
          <h2>Medicine not found</h2>
          <p>We couldn’t find a medicine for ID: {paramId}</p>
          <Link to="/medicines" className="btn btn--primary">
            Browse medicines
          </Link>
        </section>
      </main>
    );
  }

  const priceNumber = Number.parseFloat(medicine.price);
  const formattedPrice = isNaN(priceNumber)
    ? `₹${medicine.price}`
    : `₹${priceNumber.toFixed(2)}`;

  const handleAddToCart = async () => {
    const patientId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!patientId) {
      alert("Please login to add items to cart");
      return;
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/cart/add`,
        { patientId, medicineId: medicine.id, quantity: quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`${medicine.name} added to cart!`);
    } catch (error) {
      console.error("Failed to add to cart", error);
      alert("Failed to add item to cart. Please try again.");
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  // --- Image Swipe Logic ---
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentImageIndex < medicine.images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  return (
    <main className="medicine-details" aria-labelledby="medicine-title">
      <div className="medicine-details__header">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ← Back
        </button>
      </div>

      <div className="medicine-details__layout">
        {/* TOP SECTION: Image + Core Info (Responsive grid) */}
        <section className="medicine-details__top">
          <div 
            className="medicine-details__image-col"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="medicine-details__image-carousel">
              <div className="medicine-details__image-wrapper">
                {medicine.images.length > 1 && (
                  <button 
                    className="carousel-btn medicine-details__prev-btn" 
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? medicine.images.length - 1 : prev - 1)}
                    aria-label="Previous Image"
                  >
                    &#10094;
                  </button>
                )}
                
                <img
                  src={medicine.images[currentImageIndex]}
                  alt={`${medicine.name} - image ${currentImageIndex + 1}`}
                  className="medicine-details__image"
                  loading="lazy"
                  onClick={() => setIsEnlarged(true)}
                  style={{ cursor: "zoom-in" }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />

                {medicine.images.length > 1 && (
                  <button 
                    className="carousel-btn medicine-details__next-btn" 
                    onClick={() => setCurrentImageIndex(prev => prev === medicine.images.length - 1 ? 0 : prev + 1)}
                    aria-label="Next Image"
                  >
                    &#10095;
                  </button>
                )}
              </div>
            </div>
            
            {medicine.images.length > 1 && (
              <div className="medicine-details__carousel-dots">
                {medicine.images.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="medicine-details__summary-col">
            <h1 id="medicine-title" className="medicine-details__title">
              {medicine.name}
            </h1>
            
            {medicine.prescription && (
              <div className="medicine-details__prescription-badge">
                Rx Prescription Required
              </div>
            )}

            <div className="medicine-details__price-box">
              <span className="medicine-details__price">{formattedPrice}</span>
              <span className="medicine-details__tax-info">Inclusive of all taxes</span>
            </div>

            <div className="medicine-details__actions-box">
              <div className="qty-selector">
                <button type="button" onClick={decrementQty} aria-label="Decrease quantity">−</button>
                <span className="qty-value">{quantity}</span>
                <button type="button" onClick={incrementQty} aria-label="Increase quantity">+</button>
              </div>

              <div className="action-buttons">
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={handleAddToCart}
                  aria-label={`Add ${medicine.name} to cart`}
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleBuyNow}
                  aria-label={`Buy ${medicine.name} now`}
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM SECTION: Detailed Info */}
        <section className="medicine-details__bottom">
          <div className="medicine-details__description-card">
            <h2>Product Description</h2>
            <p className="medicine-details__description">{medicine.description}</p>
          </div>

          <div className="medicine-details__grid-info">
            <div className="medicine-details__section">
              <h2>Ingredients</h2>
              <ul>
                {medicine.ingredients.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="medicine-details__section">
              <h2>Uses & Benefits</h2>
              <ul>
                {medicine.usesBenefits.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="medicine-details__section">
              <h2>Dosage</h2>
              <p>{medicine.dosage}</p>
            </div>

            <div className="medicine-details__section">
              <h2>Storage & Safety</h2>
              <p>{medicine.storageSafety}</p>
            </div>
          </div>
        </section>
      </div>
      {/* ENLARGED IMAGE MODAL */}
      {isEnlarged && (
        <div className="medicine-details__enlarged-overlay" onClick={() => setIsEnlarged(false)}>
          <button className="medicine-details__enlarged-close" onClick={() => setIsEnlarged(false)}>
            &times;
          </button>
          
          <div 
            className="medicine-details__enlarged-content"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {medicine.images.length > 1 && (
              <button 
                className="carousel-btn medicine-details__prev-btn" 
                onClick={() => setCurrentImageIndex(prev => prev === 0 ? medicine.images.length - 1 : prev - 1)}
                aria-label="Previous Image"
              >
                &#10094;
              </button>
            )}

            <img
              src={medicine.images[currentImageIndex]}
              alt={`${medicine.name} - enlarged image ${currentImageIndex + 1}`}
              className="medicine-details__enlarged-image"
            />

            {medicine.images.length > 1 && (
              <button 
                className="carousel-btn medicine-details__next-btn" 
                onClick={() => setCurrentImageIndex(prev => prev === medicine.images.length - 1 ? 0 : prev + 1)}
                aria-label="Next Image"
              >
                &#10095;
              </button>
            )}
            
            {medicine.images.length > 1 && (
              <div className="medicine-details__carousel-dots medicine-details__enlarged-dots">
                {medicine.images.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default MedicineIdDetails;