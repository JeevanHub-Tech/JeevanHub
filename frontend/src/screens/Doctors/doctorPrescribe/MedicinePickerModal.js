import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, ArrowLeft, Check, Loader2, Pill } from 'lucide-react';
import './MedicinePickerModal.css';

const BACKEND = process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=600&auto=format&fit=crop';

const resolveImages = (medicine) => {
	const imgs = (medicine.images || [])
		.filter(Boolean)
		.map(img => (img.startsWith('http') ? img : `${BACKEND}/${img}`));
	return imgs.length > 0 ? imgs : [FALLBACK_IMAGE];
};

// Full-screen medicine browser the doctor uses to pick an inventory item to prescribe.
// Mirrors the patient's browse → detail experience, ending in "Select this medicine".
export function MedicinePickerModal({ onSelect, onClose }) {
	const [medicines, setMedicines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');

	// When a medicine is opened for a closer look
	const [detailMedicine, setDetailMedicine] = useState(null);
	const [imageIndex, setImageIndex] = useState(0);

	useEffect(() => {
		const fetchMedicines = async () => {
			try {
				const response = await fetch(`${BACKEND}/api/medicines`);
				if (!response.ok) throw new Error('Failed to load medicines');
				const data = await response.json();
				setMedicines(Array.isArray(data) ? data : []);
			} catch (err) {
				console.error('Error loading medicines:', err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchMedicines();
	}, []);

	const filtered = useMemo(() => {
		if (!searchTerm.trim()) return medicines;
		const q = searchTerm.toLowerCase();
		return medicines.filter(m =>
			m.name?.toLowerCase().includes(q) ||
			m.category?.toLowerCase().includes(q) ||
			m.description?.toLowerCase().includes(q)
		);
	}, [medicines, searchTerm]);

	const openDetail = (medicine) => {
		setDetailMedicine(medicine);
		setImageIndex(0);
	};

	const confirmSelect = (medicine) => {
		onSelect(medicine);
		onClose();
	};

	const detailImages = detailMedicine ? resolveImages(detailMedicine) : [];

	return (
		<div className="mp-overlay" onClick={onClose}>
			<div className="mp-modal" onClick={(e) => e.stopPropagation()}>

				{/* Header */}
				<div className="mp-header">
					{detailMedicine ? (
						<button className="mp-back" onClick={() => setDetailMedicine(null)}>
							<ArrowLeft size={18} /> Back to all medicines
						</button>
					) : (
						<h2 className="mp-title"><Pill size={20} /> Select a medicine from inventory</h2>
					)}
					<button className="mp-close" onClick={onClose} aria-label="Close"><X size={22} /></button>
				</div>

				{/* Body */}
				{detailMedicine ? (
					/* ---------- DETAIL VIEW ---------- */
					<div className="mp-detail">
						<div className="mp-detail-image-col">
							<div className="mp-carousel">
								{detailImages.length > 1 && (
									<button className="mp-carousel-btn prev" onClick={() => setImageIndex(i => i === 0 ? detailImages.length - 1 : i - 1)}>
										<ChevronLeft size={22} />
									</button>
								)}
								<img
									src={detailImages[imageIndex]}
									alt={detailMedicine.name}
									className="mp-carousel-img"
									onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
								/>
								{detailImages.length > 1 && (
									<button className="mp-carousel-btn next" onClick={() => setImageIndex(i => i === detailImages.length - 1 ? 0 : i + 1)}>
										<ChevronRight size={22} />
									</button>
								)}
							</div>
							{detailImages.length > 1 && (
								<div className="mp-dots">
									{detailImages.map((_, idx) => (
										<span key={idx} className={`mp-dot ${idx === imageIndex ? 'active' : ''}`} onClick={() => setImageIndex(idx)} />
									))}
								</div>
							)}
						</div>

						<div className="mp-detail-info">
							<h3 className="mp-detail-name">{detailMedicine.name}</h3>
							<div className="mp-detail-meta">
								{detailMedicine.category && <span className="mp-chip">{detailMedicine.category}</span>}
								{detailMedicine.prescription ? (
									<span className="mp-chip rx">Rx Required</span>
								) : (
									<span className="mp-chip otc">No Prescription</span>
								)}
							</div>
							<div className="mp-detail-price">₹{detailMedicine.price}</div>
							{detailMedicine.retailerId && (
								<p className="mp-detail-seller">
									Sold by {detailMedicine.retailerId.firstName || ''} {detailMedicine.retailerId.lastName || ''}
								</p>
							)}
							<div className="mp-detail-desc">
								<h4>Description</h4>
								<p>{detailMedicine.description || 'No description provided.'}</p>
							</div>
							<div className="mp-detail-stock">
								{detailMedicine.quantity > 0
									? <span className="mp-in-stock">In stock ({detailMedicine.quantity} available)</span>
									: <span className="mp-out-stock">Out of stock</span>}
							</div>
						</div>
					</div>
				) : (
					/* ---------- GRID VIEW ---------- */
					<>
						<div className="mp-search">
							<Search size={18} className="mp-search-icon" />
							<input
								type="text"
								placeholder="Search by name, category, or description..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								autoFocus
							/>
							{searchTerm && (
								<button className="mp-search-clear" onClick={() => setSearchTerm('')}><X size={16} /></button>
							)}
						</div>

						<div className="mp-grid-scroll">
							{loading ? (
								<div className="mp-status"><Loader2 className="mp-spin" size={28} /> Loading medicines...</div>
							) : error ? (
								<div className="mp-status">{error}</div>
							) : filtered.length === 0 ? (
								<div className="mp-status">No medicines match your search.</div>
							) : (
								<div className="mp-grid">
									{filtered.map((medicine) => {
										const img = resolveImages(medicine)[0];
										return (
											<div key={medicine._id} className="mp-card" onClick={() => openDetail(medicine)}>
												<div className="mp-card-img-wrap">
													<img
														src={img}
														alt={medicine.name}
														className="mp-card-img"
														loading="lazy"
														onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
													/>
												</div>
												<div className="mp-card-body">
													<h4 className="mp-card-name" title={medicine.name}>{medicine.name}</h4>
													<div className="mp-card-row">
														<span className="mp-card-price">₹{medicine.price}</span>
														{medicine.category && <span className="mp-card-cat">{medicine.category}</span>}
													</div>
													<button
														className="mp-card-select"
														onClick={(e) => { e.stopPropagation(); confirmSelect(medicine); }}
													>
														<Check size={15} /> Select
													</button>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					</>
				)}

				{/* Sticky select bar in detail view */}
				{detailMedicine && (
					<div className="mp-footer">
						<button className="mp-select-btn" onClick={() => confirmSelect(detailMedicine)}>
							<Check size={18} /> Select this medicine
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default MedicinePickerModal;
