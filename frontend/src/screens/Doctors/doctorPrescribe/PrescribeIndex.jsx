import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Stethoscope, Send, Loader2, Activity } from 'lucide-react';
import { PatientHeader } from './PatientHeader';
import { PrescriptionHistory } from './PrescriptionHistory';
import { PrescriptionTabs } from './PrescriptionTabs';
import './PrescribeIndex.css';
import { authFetch } from '../../../utils/authFetch';
import { BACKEND_URL } from '../../../config';

const BACKEND = BACKEND_URL || 'http://localhost:8080';

const PrescribeIndex = () => {
	const { bookingId } = useParams();

	const [booking, setBooking] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const [prakritiDosha, setPrakritiDosha] = useState(null);
	const [history, setHistory] = useState([]);
	const [loadingHistory, setLoadingHistory] = useState(true);

	const [diagnosis, setDiagnosis] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const patientId = booking?.patientId?._id;

	// 1. The booking is the single source of truth for patient / doctor / illness.
	useEffect(() => {
		const fetchBooking = async () => {
			if (!bookingId) {
				setLoading(false);
				setError('No appointment was selected.');
				return;
			}
			setLoading(true);
			setError(null);
			try {
				const response = await authFetch(`${BACKEND}/api/bookings/${bookingId}`);
				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					throw new Error(errData.error || 'Failed to load this appointment.');
				}
				const data = await response.json();
				setBooking(data.booking);
				setDiagnosis(data.booking.diagnosis || '');
			} catch (err) {
				console.error('Error fetching booking:', err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchBooking();
	}, [bookingId]);

	// 2. This doctor's own prescription history with this patient (re-fetchable).
	const refetchHistory = useCallback(async () => {
		if (!patientId) return;
		setLoadingHistory(true);
		try {
			const response = await authFetch(`${BACKEND}/api/bookings/history/patient/${patientId}`);
			if (response.ok) {
				const data = await response.json();
				setHistory(data.bookings || []);
			}
		} catch (err) {
			console.error('Error fetching prescription history:', err);
		} finally {
			setLoadingHistory(false);
		}
	}, [patientId]);

	useEffect(() => { refetchHistory(); }, [refetchHistory]);

	// 3. Patient's Prakriti (dosha), if assessed.
	useEffect(() => {
		const fetchPrakriti = async () => {
			if (!patientId) return;
			try {
				const response = await authFetch(`${BACKEND}/api/prakriti/assessment/patient/${patientId}`);
				if (response.ok) {
					const data = await response.json();
					setPrakritiDosha(data?.dominantDosha || null);
				}
			} catch (err) {
				console.error('Error fetching Prakriti assessment:', err);
			}
		};
		fetchPrakriti();
	}, [patientId]);

	const saveDiagnosis = async () => {
		try {
			await authFetch(`${BACKEND}/api/bookings/${bookingId}/diagnosis`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ diagnosis })
			});
		} catch (err) {
			console.error('Failed to save diagnosis:', err);
		}
	};

	// Everything (medicine rows, diet, yoga, diagnosis) already saves in realtime as the
	// doctor works. "Submit" is the deliberate, one-time signal to the patient that the
	// full prescription/treatment plan for this visit is ready to review.
	const submitPrescription = async () => {
		setSubmitting(true);
		try {
			const response = await authFetch(`${BACKEND}/api/bookings/${bookingId}/notify-prescription`, {
				method: 'POST'
			});
			if (!response.ok) throw new Error('Failed to submit');
			alert('The prescription has been submitted — the patient has been notified.');
		} catch (err) {
			alert('Could not submit the prescription. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="pi-container">
				<main className="pi-main-status"><p className="pi-loading-overlay">Loading patient details...</p></main>
			</div>
		);
	}

	if (error || !booking) {
		return (
			<div className="pi-container">
				<main className="pi-main-status">
					<div className="pi-error-state">
						<p>{error || 'This appointment could not be found.'}</p>
						<p className="pi-error-hint">Please go back to your appointment list and try again.</p>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="pi-container">
			<main className="pi-main">
				<div className="pi-row-full">
					<PatientHeader patient={booking.patientId} prakritiDosha={prakritiDosha} />
				</div>

				{/* Consultation bar: complaint · diagnosis */}
				<div className="pi-row-full">
					<div className="pi-consult-bar">
						<div className="pi-consult-complaint">
							<span className="pi-consult-label"><Activity size={14} /> Patient's complaint</span>
							<p className="pi-consult-illness">{booking.patientIllness || 'Not specified'}</p>
						</div>
						<div className="pi-consult-diagnosis">
							<label className="pi-consult-label" htmlFor="pi-diagnosis"><Stethoscope size={14} /> Diagnosis for this visit</label>
							<input
								id="pi-diagnosis"
								className="pi-diagnosis-input"
								placeholder="e.g., Amavata (rheumatoid-type joint inflammation)"
								value={diagnosis}
								onChange={(e) => setDiagnosis(e.target.value)}
								onBlur={saveDiagnosis}
							/>
						</div>
					</div>
				</div>

				{/* Previous prescriptions — narrower left column */}
				<div className="pi-col-history">
					<PrescriptionHistory
						prescriptions={history}
						loading={loadingHistory}
						sharedRecords={booking.patientSharedRecords || []}
						currentBookingId={booking._id}
					/>
				</div>

				{/* Medicine / Diet / Yoga / History tabs + Submit — wider right column */}
				<div className="pi-col-main">
					<PrescriptionTabs
						bookingId={booking._id}
						patientId={patientId}
						doctorId={booking.doctorId}
						onPrescribed={refetchHistory}
					/>

					<div className="pi-submit-bar">
						<p className="pi-submit-hint">Medicines, diet, and yoga plans save automatically as you go. Submit once everything for this visit is ready.</p>
						<button className="pi-submit-btn" onClick={submitPrescription} disabled={submitting}>
							{submitting ? <Loader2 className="pi-spin" size={18} /> : <Send size={18} />}
							Submit Prescription
						</button>
					</div>
				</div>
			</main>
		</div>
	);
};

export default PrescribeIndex;
