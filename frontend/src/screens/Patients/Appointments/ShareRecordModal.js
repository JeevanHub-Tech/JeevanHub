import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { authFetch } from '../../../utils/authFetch';
import './ShareRecordModal.css';

// Lets a patient share context with their doctor ahead of / shortly after a specific
// booking — either an external file (a photo/PDF of an outside prescription) or a
// reference to one of their own past prescriptions on this platform.
const ShareRecordModal = ({ bookingId, onClose, onShared, initialMode = 'upload' }) => {
	const [mode, setMode] = useState(initialMode); // 'upload' | 'reference'
	const [file, setFile] = useState(null);
	const [note, setNote] = useState('');
	const [ownBookings, setOwnBookings] = useState([]);
	const [selectedBookingId, setSelectedBookingId] = useState('');
	const [loadingOwnBookings, setLoadingOwnBookings] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (mode !== 'reference' || ownBookings.length > 0) return;

		const fetchOwnBookings = async () => {
			setLoadingOwnBookings(true);
			try {
				const response = await authFetch(
					`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/bookings/sharing/own-bookings?excludeBookingId=${bookingId}`
				);
				if (response.ok) {
					const data = await response.json();
					setOwnBookings(data.bookings || []);
				}
			} catch (err) {
				console.error("Error fetching your own bookings:", err);
			} finally {
				setLoadingOwnBookings(false);
			}
		};

		fetchOwnBookings();
	}, [mode, bookingId, ownBookings.length]);

	const handleSubmit = async () => {
		if (mode === 'upload' && !file) {
			alert("Please choose a file to upload.");
			return;
		}
		if (mode === 'reference' && !selectedBookingId) {
			alert("Please select a prescription to link.");
			return;
		}

		setSubmitting(true);
		try {
			const formData = new FormData();
			if (mode === 'upload') {
				formData.append('file', file);
			} else {
				formData.append('referencedBookingId', selectedBookingId);
			}
			formData.append('note', note);

			const response = await authFetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/bookings/${bookingId}/shared-records`,
				{
					method: 'POST',
					body: formData
				}
			);

			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				throw new Error(errData.error || "Failed to share record");
			}

			alert("Shared with your doctor successfully.");
			onShared?.();
			onClose();
		} catch (err) {
			console.error("Error sharing record:", err);
			alert(`Error: ${err.message}`);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="share-record-overlay" onClick={onClose}>
			<div className="share-record-modal" onClick={(e) => e.stopPropagation()}>
				<button className="share-record-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
				<h3>Share a prescription with your doctor</h3>
				<p className="share-record-hint">
					Upload a photo or PDF of an outside prescription, or link one of your own prescriptions
					from this platform, so your doctor has it for reference around this appointment.
				</p>

				<div className="share-record-mode-toggle">
					<button type="button" className={mode === 'upload' ? 'active' : ''} onClick={() => setMode('upload')}>
						<Upload size={16} /> Upload a file
					</button>
					<button type="button" className={mode === 'reference' ? 'active' : ''} onClick={() => setMode('reference')}>
						<LinkIcon size={16} /> Link a past prescription
					</button>
				</div>

				{mode === 'upload' ? (
					<div className="share-record-field">
						<label>Prescription photo or PDF</label>
						<input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0])} />
					</div>
				) : (
					<div className="share-record-field">
						<label>Choose a past prescription</label>
						{loadingOwnBookings ? (
							<p className="share-record-note-text">Loading your prescriptions...</p>
						) : ownBookings.length === 0 ? (
							<p className="share-record-note-text">You don't have any prescriptions on this platform yet.</p>
						) : (
							<select value={selectedBookingId} onChange={(e) => setSelectedBookingId(e.target.value)}>
								<option value="">Select one...</option>
								{ownBookings.map((b) => (
									<option key={b._id} value={b._id}>
										Dr. {b.doctorName} — {new Date(b.dateOfAppointment).toLocaleDateString()}
										{b.recommendedSupplements?.length > 0 ? ` (${b.recommendedSupplements.map(s => s.medicineName).join(', ')})` : ''}
									</option>
								))}
							</select>
						)}
					</div>
				)}

				<div className="share-record-field">
					<label>Note (optional)</label>
					<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any context for your doctor..." rows={2} />
				</div>

				<button className="share-record-submit" onClick={handleSubmit} disabled={submitting}>
					{submitting ? (<><Loader2 className="animate-spin" size={16} /> Sharing...</>) : "Share with doctor"}
				</button>
			</div>
		</div>
	);
};

export default ShareRecordModal;
