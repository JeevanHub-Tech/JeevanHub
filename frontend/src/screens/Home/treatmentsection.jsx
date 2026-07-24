import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import capsuleImage from '../../media/capsule.jpg';
import { AuthContext } from '../../context/AuthContext';
import { BACKEND_URL } from '../../config';

const Medicines = () => {
  const { auth } = useContext(AuthContext);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL || 'http://localhost:8080'}/api/medicines`);
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
    <section className="mx-auto w-[95%] max-w-310 px-4 pt-14 pb-12">
      <div className="mb-9.5 text-center">
        <h2 className="font-display relative m-0 inline-block text-[clamp(1.6rem,3vw,2.1rem)] font-semibold tracking-tight text-(--jh-olive-deep) after:mx-auto after:mt-3.5 after:block after:h-1 after:w-19 after:rounded-full after:bg-gradient-to-r after:from-(--jh-olive-leaf) after:to-(--jh-turmeric-gold)">
          Explore All Medicines
        </h2>
        <p className="mx-auto mt-4 max-w-140 text-base leading-relaxed text-muted-foreground">
          Authentic, quality-checked Ayurvedic remedies delivered to your door.
        </p>
      </div>
      <div className="my-2.5 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] sm:gap-5.5">
        {loading ? (
          <p>Loading medicines...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          medicines.slice(0, visibleCount).map((medicine) => (
            <div
              className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-(--jh-line-strong) bg-(--jh-surface) shadow-[0_8px_22px_rgba(47,53,36,0.07)] transition-[transform,box-shadow] duration-320 ease-out hover:-translate-y-1.5 hover:shadow-[0_18px_38px_rgba(47,53,36,0.15)]"
              key={medicine._id}
            >
              <button
                type="button"
                className="m-0 flex flex-1 flex-col border-none bg-transparent p-0 text-center font-inherit text-inherit"
                aria-label={`View ${medicine.name}`}
                onClick={() => navigate(`/medicines/${medicine._id}`)}
              >
                <span className="block h-43.75 w-full overflow-hidden bg-(--jh-sage-pale)">
                  <img
                    src={(medicine.images && medicine.images.length > 0) ? medicine.images[0] : capsuleImage}
                    alt={medicine.name}
                    className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = capsuleImage; }}
                  />
                </span>
                <span className="flex flex-col items-center gap-2.25 px-4 pt-4 pb-2">
                  {medicine.category && (
                    <Badge variant="warning" className="font-extrabold tracking-wide uppercase">
                      {medicine.category}
                    </Badge>
                  )}
                  <span className="font-display m-0 line-clamp-2 min-h-10.5 text-[1.04rem] leading-tight font-semibold text-foreground">
                    {medicine.name}
                  </span>
                </span>
              </button>
              <div className="mt-auto flex items-center justify-between gap-2.5 px-4 pt-2 pb-4">
                <span className="m-0 text-xl font-extrabold text-(--jh-olive-deep)">₹{medicine.price}</span>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-gradient-to-br from-(--jh-olive-light) to-(--jh-olive-deep) px-4.5 whitespace-nowrap shadow-[0_6px_14px_rgba(85,107,47,0.26)] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(85,107,47,0.4)]"
                  onClick={() => {
                    const patientId = auth?.user?.id;
                    const token = auth?.token;
                    if (!patientId) {
                      alert("Please login first to add items to cart");
                      navigate('/signin');
                      return;
                    }
                    axios.post(`${BACKEND_URL || 'http://localhost:8080'}/api/cart/add`, {
                      patientId,
                      medicineId: medicine._id,
                      quantity: 1
                    }, { headers: { Authorization: `Bearer ${token}` } })
                    .then(() => alert("Added to cart successfully!"))
                    .catch(err => alert("Failed to add to cart"));
                  }}
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-7 flex justify-center gap-5 text-center">
        {visibleCount < medicines.length && (
          <Button type="button" variant="outline" className="gap-1.5 rounded-full border-(--jh-line-strong) px-5.5 text-(--jh-olive-leaf) hover:bg-(--jh-olive-leaf) hover:text-white" onClick={showMore}>
            See More <span className="inline-block text-base transition-transform duration-300 ease-in-out group-hover:translate-y-0.75" aria-hidden="true">&#9662;</span>
          </Button>
        )}
        {visibleCount > defaultVisibleCount && (
          <Button type="button" variant="outline" className="gap-1.5 rounded-full border-(--jh-line-strong) px-5.5 text-(--jh-olive-leaf) hover:bg-(--jh-olive-leaf) hover:text-white" onClick={showLess}>
            See Less <span className="inline-block rotate-180 text-base transition-transform duration-300 ease-in-out" aria-hidden="true">&#9662;</span>
          </Button>
        )}
      </div>
    </section>
  );
};

export default Medicines;
