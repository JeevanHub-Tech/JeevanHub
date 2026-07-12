import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorsScreen.css";
import { authFetch } from "../utils/authFetch";

function isValidImage(src) {
  return Boolean(src) && src !== "undefined" && src !== "null";
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function DoctorAvatar({ src, name }) {
  const [failed, setFailed] = useState(false);
  const showImage = isValidImage(src) && !failed;

  return showImage ? (
    <img
      src={src}
      alt={name}
      className="doctor-avatar"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="doctor-avatar doctor-avatar-fallback" aria-hidden="true">
      {getInitials(name)}
    </div>
  );
}

const DEFAULT_FILTERS = {
  specialization: "",
  experience: "",
  priceRange: "",
  location: "",
  language: "",
  sort: "",
  rating: "",
  gender: "",
};

// Human-readable chip text per filter key — keys not listed here (e.g. "sort",
// which orders results rather than narrowing them) never render as a chip.
const FILTER_CHIP_LABELS = {
  specialization: (v) => v,
  experience: (v) => ({ "1": "1 year or less", "2-5": "2-5 years experience", "5+": "5+ years experience" }[v] || v),
  priceRange: (v) => ({ Low: "Under ₹500", Medium: "₹500 - ₹1000", High: "Over ₹1000" }[v] || v),
  location: (v) => v,
  language: (v) => v,
  rating: (v) => `${v}★`,
  gender: (v) => v,
};

function DoctorsScreen() {
  const navigate = useNavigate();
  const [showFilter, setShowFilter] = useState(
    () => typeof window === "undefined" || window.innerWidth > 860,
  );
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [doctors, setDoctors] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    const token = localStorage.getItem("token");
    authFetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/doctors/publicDoctors`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const approvedDoctors = data.filter((doc) => doc.approvalStatus === "Approved");

        const mappedDoctors = approvedDoctors.map((doctor) => ({
          id: doctor._id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          specialization: Array.isArray(doctor.specialization)
            ? doctor.specialization.join(", ") || "N/A"
            : doctor.specialization || "N/A",
          experience: doctor.experience ? `${doctor.experience} years` : "0 years",
          email: `${doctor.email}`,
          pricepoint: `${doctor.price || "0"}`,
          priceRange:
            doctor.price < 500 ? "Low" : doctor.price >= 500 && doctor.price <= 1000 ? "Medium" : "High",
          location: doctor.zipCode || "N/A",
          language: doctor.languages?.join(", ") || "English",
          rating: 4.0,
          gender: doctor.gender ? doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1) : "N/A",
          profileImage: doctor.profileImage || null,
        }));
        setDoctors(mappedDoctors);
        setStatus("ready");
      })
      .catch((error) => {
        console.error("Error fetching doctors:", error);
        setStatus("error");
      });
  }, []);

  const filteredDoctors = doctors.filter(
    (doctor) =>
      (filters.specialization ? doctor.specialization === filters.specialization : true) &&
      (filters.experience
        ? (filters.experience === "1" && parseInt(doctor.experience) <= 1) ||
          (filters.experience === "2-5" && parseInt(doctor.experience) >= 2 && parseInt(doctor.experience) <= 5) ||
          (filters.experience === "5+" && parseInt(doctor.experience) > 5)
        : true) &&
      (filters.priceRange ? doctor.priceRange === filters.priceRange : true) &&
      (filters.location ? doctor.location === filters.location : true) &&
      (filters.language ? doctor.language.includes(filters.language) : true) &&
      (filters.rating ? doctor.rating === parseFloat(filters.rating) : true) &&
      (filters.gender ? doctor.gender === filters.gender : true),
  );

  const sortedDoctors = [...filteredDoctors].sort((a, b) => {
    if (filters.sort === "lowToHigh") return a.rating - b.rating;
    if (filters.sort === "highToLow") return b.rating - a.rating;
    return 0;
  });

  // Chips reflect narrowing filters only — "sort" changes order, not results,
  // so it's excluded here and from the count.
  const activeChips = useMemo(
    () =>
      Object.entries(filters)
        .filter(([key, value]) => value !== "" && FILTER_CHIP_LABELS[key])
        .map(([key, value]) => ({ key, value, text: FILTER_CHIP_LABELS[key](value) })),
    [filters],
  );

  const setFilter = (key) => (e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }));
  const clearFilter = (key) => setFilters((prev) => ({ ...prev, [key]: "" }));

  const handleDoctorClick = (doctor) => {
    navigate("/doctor-detail", { state: { doctor } });
  };

  return (
    <div className="doctors-page">
      <div className="doctors-page-head">
        <h1>Find Your Ayurvedic Doctor</h1>
        <p className="subtitle">
          Browse practitioner profiles by specialization, experience, and language to find the right fit for your care.
        </p>
      </div>

      <div className="doctors-container">
        <aside className="filters">
          <button
            type="button"
            className="filters-header"
            aria-expanded={showFilter}
            onClick={() => setShowFilter((v) => !v)}
          >
            <span>
              Filter doctors
              {activeChips.length > 0 && <span className="filter-count">{activeChips.length}</span>}
            </span>
            <svg
              className={`chevron ${showFilter ? "chevron-open" : ""}`}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className={`filters-menu-collapse ${showFilter ? "open" : ""}`}>
            <div className="filters-menu-inner">
              <div className="filters-menu">
                <div className="filters-menu-top">
                  <p className="filters-hint">Narrow the list by specialization, budget, and more.</p>
                  <button
                    type="button"
                    className="clear-all"
                    disabled={activeChips.length === 0}
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                  >
                    Clear all
                  </button>
                </div>

                <div className="filter-group filter-group-full">
                  <label htmlFor="specialization">Specialization</label>
                  <select id="specialization" value={filters.specialization} onChange={setFilter("specialization")}>
                    <option value="">All specializations</option>
                    <option value="Skin Diseases">Skin Diseases</option>
                    <option value="Digestive and Metabolic">Digestive and Metabolic</option>
                    <option value="Respiratory Diseases">Respiratory Diseases</option>
                  </select>
                </div>

                <div className="filter-grid">
                  <div className="filter-group">
                    <label htmlFor="experience">Experience</label>
                    <select id="experience" value={filters.experience} onChange={setFilter("experience")}>
                      <option value="">Any</option>
                      <option value="1">1 year or less</option>
                      <option value="2-5">2 - 5 years</option>
                      <option value="5+">More than 5 years</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="priceRange">Price range</label>
                    <select id="priceRange" value={filters.priceRange} onChange={setFilter("priceRange")}>
                      <option value="">All</option>
                      <option value="Low">Less than ₹500</option>
                      <option value="Medium">₹500 - ₹1000</option>
                      <option value="High">More than ₹1000</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="location">Location</label>
                    <select id="location" value={filters.location} onChange={setFilter("location")}>
                      <option value="">All locations</option>
                      <option value="Jamshedpur, Jharkhand">Jamshedpur, Jharkhand</option>
                      <option value="Gurugram, Haryana">Gurugram, Haryana</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="language">Language</label>
                    <select id="language" value={filters.language} onChange={setFilter("language")}>
                      <option value="">All languages</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="gender">Gender</label>
                    <select id="gender" value={filters.gender} onChange={setFilter("gender")}>
                      <option value="">Any</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label htmlFor="rating">Rating</label>
                    <select id="rating" value={filters.rating} onChange={setFilter("rating")}>
                      <option value="">Any</option>
                      <option value="1.0">1 star</option>
                      <option value="2.0">2 star</option>
                      <option value="3.0">3 star</option>
                      <option value="4.0">4 star</option>
                      <option value="5.0">5 star</option>
                    </select>
                  </div>
                </div>

                <div className="filter-group filter-group-full filter-group-sort">
                  <label htmlFor="sort">Sort by</label>
                  <select id="sort" value={filters.sort} onChange={setFilter("sort")}>
                    <option value="">Default</option>
                    <option value="lowToHigh">Rating: Low to High</option>
                    <option value="highToLow">Rating: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="doctors-results">
          <div className="results-bar">
            <span className="results-count">
              {status === "ready" ? `${sortedDoctors.length} doctor${sortedDoctors.length === 1 ? "" : "s"} found` : " "}
            </span>

            {activeChips.length > 0 && (
              <div className="active-chips">
                {activeChips.map((chip) => (
                  <button
                    type="button"
                    key={chip.key}
                    className="active-chip"
                    onClick={() => clearFilter(chip.key)}
                  >
                    {chip.text}
                    <span className="active-chip-remove" aria-hidden="true">×</span>
                    <span className="sr-only">Remove {chip.text} filter</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="doctors-list">
            {status === "loading" &&
              Array.from({ length: 4 }).map((_, i) => (
                <div className="doctor-card doctor-card-skeleton" key={i} aria-hidden="true">
                  <div className="skeleton skeleton-avatar" />
                  <div className="skeleton skeleton-line" style={{ width: "60%" }} />
                  <div className="skeleton skeleton-line" style={{ width: "85%" }} />
                  <div className="skeleton skeleton-line" style={{ width: "70%" }} />
                  <div className="skeleton skeleton-button" />
                </div>
              ))}

            {status === "error" && (
              <div className="doctors-empty">
                <p>We couldn&apos;t load doctors right now. Please refresh the page.</p>
              </div>
            )}

            {status === "ready" && sortedDoctors.length === 0 && (
              <div className="doctors-empty">
                <p>No doctors match your filters yet.</p>
                <button type="button" className="clear-all" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Clear filters
                </button>
              </div>
            )}

            {status === "ready" &&
              sortedDoctors.map((doctor) => (
                <div key={doctor.id} className="doctor-card" onClick={() => handleDoctorClick(doctor)}>
                  <div className="doctor-info">
                    <div className="doctor-profile">
                      <DoctorAvatar src={doctor.profileImage} name={doctor.name} />
                      <div className="doctor-name">Dr. {doctor.name}</div>
                    </div>

                    <div className="doctor-detail">
                      <span className="label-text">Specialization</span>
                      {doctor.specialization}
                    </div>

                    <div className="doctor-detail">
                      <span className="label-text">Experience</span>
                      {doctor.experience}
                    </div>

                    <div className="doctor-detail">
                      <span className="label-text">Location</span>
                      {doctor.location}
                    </div>

                    <div className="doctor-detail">
                      <span className="label-text">Languages</span>
                      {doctor.language}
                    </div>

                    <div className="doctor-detail">
                      <span className="label-text">Gender</span>
                      {doctor.gender}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="book-consultation"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDoctorClick(doctor);
                    }}
                  >
                    Book Consultation
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorsScreen;
