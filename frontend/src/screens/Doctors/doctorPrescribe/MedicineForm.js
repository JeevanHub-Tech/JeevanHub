import React, { useState, useEffect } from 'react';
import { ClipboardPlus, Plus, Trash2, Loader2, ShoppingCart, Pill } from 'lucide-react';
import { MedicinePickerModal } from './MedicinePickerModal';
import './MedicineForm.css';
import { authFetch } from '../../../utils/authFetch';

const BACKEND = process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=300&auto=format&fit=crop';

const resolveThumb = (images) => {
	const imgs = (images || []).filter(Boolean).map(img => (img.startsWith('http') ? img : `${BACKEND}/${img}`));
	return imgs.length ? imgs[0] : FALLBACK_IMAGE;
};

export function MedicineForm({ bookingId, patientId, doctorId, onPrescribed }) {
	const [rows, setRows] = useState([]); // { _id, medicineId, medicineName, dosage, instructions, thumb, price }
	const [loading, setLoading] = useState(true);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [adding, setAdding] = useState(false);

	// Load the current medicines + a medicineId→image/price map (for thumbnails on existing rows)
	useEffect(() => {
		let active = true;
		const load = async () => {
			try {
				const [medsRes, suppRes] = await Promise.all([
					fetch(`${BACKEND}/api/medicines`),
					authFetch(`${BACKEND}/api/bookings/supplements/${bookingId}`)
				]);
				const meds = medsRes.ok ? await medsRes.json() : [];
				const map = {};
				meds.forEach(m => { map[m._id] = { thumb: resolveThumb(m.images), price: m.price }; });

				const suppData = suppRes.ok ? await suppRes.json() : { supplements: [] };
				const supps = (suppData.supplements || []).map(s => ({
					_id: s._id,
					medicineId: s.medicineId,
					medicineName: s.medicineName,
					dosage: s.dosage || '',
					instructions: s.instructions || '',
					thumb: map[s.medicineId]?.thumb || FALLBACK_IMAGE,
					price: map[s.medicineId]?.price
				}));
				if (active) setRows(supps);
			} catch (e) {
				console.error('Error loading prescribed medicines:', e);
			} finally {
				if (active) setLoading(false);
			}
		};
		load();
		return () => { active = false; };
	}, [bookingId]);

	// A medicine was chosen in the picker → create the row on the backend, then append it.
	const handleSelectMedicine = async (medicine) => {
		setAdding(true);
		try {
			const res = await authFetch(`${BACKEND}/api/bookings/${bookingId}/supplements`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ medicineId: medicine._id })
			});
			if (!res.ok) {
				const e = await res.json().catch(() => ({}));
				throw new Error(e.error || 'Failed to add medicine');
			}
			const data = await res.json();
			const s = data.supplement;
			setRows(prev => [...prev, {
				_id: s._id,
				medicineId: s.medicineId,
				medicineName: s.medicineName,
				dosage: '',
				instructions: '',
				thumb: resolveThumb(medicine.images),
				price: medicine.price
			}]);
			onPrescribed?.();
		} catch (e) {
			alert(`Error: ${e.message}`);
		} finally {
			setAdding(false);
		}
	};

	const updateRowLocal = (id, field, value) => {
		setRows(prev => prev.map(r => (r._id === id ? { ...r, [field]: value } : r)));
	};

	// Persist a row's dosage/instructions on blur.
	const saveRow = async (row) => {
		try {
			await authFetch(`${BACKEND}/api/bookings/${bookingId}/supplements/${row._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ dosage: row.dosage, instructions: row.instructions })
			});
		} catch (e) {
			console.error('Failed to save row:', e);
		}
	};

	const deleteRow = async (id) => {
		const snapshot = rows;
		setRows(prev => prev.filter(r => r._id !== id)); // optimistic
		try {
			const res = await authFetch(`${BACKEND}/api/bookings/${bookingId}/supplements/${id}`, {
				method: 'DELETE'
			});
			if (!res.ok) throw new Error();
			onPrescribed?.();
		} catch (e) {
			setRows(snapshot); // rollback
			alert('Failed to remove medicine. Please try again.');
		}
	};

	return (
		<div className="form-card">
			<div className="form-header">
				<h3 className="form-title">
					<ClipboardPlus className="form-icon" size={24} />
					Prescribe Medicine
				</h3>
				<span className="med-cart-hint"><ShoppingCart size={14} /> Prescribed medicines are added to the patient's cart</span>
			</div>

			<div className="form-content">
				{loading ? (
					<p className="med-loading"><Loader2 className="med-spin" size={18} /> Loading prescription...</p>
				) : (
					<>
						{rows.length === 0 ? (
							<div className="med-empty">
								<Pill size={32} />
								<p>No medicines prescribed yet.</p>
								<span>Click "Add Medicine" to pick from the store inventory.</span>
							</div>
						) : (
							<div className="med-table">
								<div className="med-table-head">
									<div className="med-col-medicine">Medicine</div>
									<div className="med-col-dosage">Dosage</div>
									<div className="med-col-instructions">Instructions</div>
									<div className="med-col-action" />
								</div>

								{rows.map((row) => (
									<div key={row._id} className="med-row">
										<div className="med-col-medicine med-medicine-cell">
											<img src={row.thumb} alt={row.medicineName} className="med-thumb"
												onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} />
											<div className="med-medicine-info">
												<span className="med-name">{row.medicineName}</span>
												{row.price != null && <span className="med-price">₹{row.price}</span>}
											</div>
										</div>

										<div className="med-col-dosage">
											<label className="med-mobile-label">Dosage</label>
											<textarea
												className="med-input"
												rows={2}
												placeholder="e.g., Start tomorrow · one tablet · twice daily for 20 days"
												value={row.dosage}
												onChange={(e) => updateRowLocal(row._id, 'dosage', e.target.value)}
												onBlur={() => saveRow(row)}
											/>
										</div>

										<div className="med-col-instructions">
											<label className="med-mobile-label">Instructions</label>
											<textarea
												className="med-input"
												rows={2}
												placeholder="e.g., Take after meals with warm water"
												value={row.instructions}
												onChange={(e) => updateRowLocal(row._id, 'instructions', e.target.value)}
												onBlur={() => saveRow(row)}
											/>
										</div>

										<div className="med-col-action">
											<button className="med-delete" onClick={() => deleteRow(row._id)} title="Remove medicine">
												<Trash2 size={18} />
											</button>
										</div>
									</div>
								))}
							</div>
						)}

						<button className="med-add-btn" onClick={() => setPickerOpen(true)} disabled={adding}>
							{adding ? <Loader2 className="med-spin" size={18} /> : <Plus size={18} />}
							Add Medicine
						</button>
					</>
				)}
			</div>

			{pickerOpen && (
				<MedicinePickerModal
					onSelect={handleSelectMedicine}
					onClose={() => setPickerOpen(false)}
				/>
			)}
		</div>
	);
}
