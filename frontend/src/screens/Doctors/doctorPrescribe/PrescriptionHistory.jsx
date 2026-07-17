import React, { useState } from 'react';
import {
	FileText,
	Link as LinkIcon,
	Pill,
	X,
	CalendarDays,
	Stethoscope,
	ClipboardList,
	ChevronRight
} from 'lucide-react';
import { BACKEND_URL } from '../../../config';
import './PrescriptionHistory.css';

const BACKEND = BACKEND_URL || 'http://localhost:8080';

const formatDate = (dateString) => {
	if (!dateString) return 'N/A';
	return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// A single record the patient attached to this consultation (unverified, patient-submitted).
const SharedRecordCard = ({ record }) => {
	const isFile = record.type === 'external_file';
	const ref = record.referencedBookingId;
	const fileUrl = record.fileUrl?.startsWith('http') ? record.fileUrl : `${BACKEND}/${record.fileUrl}`;

	return (
		<div className="shared-record-card">
			<span className="shared-record-badge">Shared by patient — unverified</span>
			{isFile ? (
				<a href={fileUrl} target="_blank" rel="noopener noreferrer" className="shared-record-link">
					<FileText size={16} /> View uploaded document
				</a>
			) : ref ? (
				<div className="shared-record-reference">
					<LinkIcon size={16} />
					<span>
						Prescription from Dr. {ref.doctorName} on {formatDate(ref.dateOfAppointment)}
						{ref.recommendedSupplements?.length > 0 && (
							<> — {ref.recommendedSupplements.map(s => s.medicineName).join(', ')}</>
						)}
					</span>
				</div>
			) : (
				<span className="shared-record-reference">This reference is no longer available.</span>
			)}
			{record.note && <p className="shared-record-note">"{record.note}"</p>}
			<span className="shared-record-time">Shared {formatDate(record.uploadedAt)}</span>
		</div>
	);
};

export function PrescriptionHistory({ prescriptions, loading, sharedRecords = [], currentBookingId }) {
	const [selected, setSelected] = useState(null);

	// Previous consultations by this doctor with this patient that actually carry a
	// prescription — excluding the visit currently being prescribed.
	const past = (Array.isArray(prescriptions) ? prescriptions : [])
		.filter(b => b._id !== currentBookingId)
		.filter(b => (b.recommendedSupplements || []).length > 0 || b.diagnosis)
		.sort((a, b) => new Date(b.dateOfAppointment) - new Date(a.dateOfAppointment));

	return (
		<div className="prescription-history-container">

			{/* Patient-attached records for THIS consultation */}
			<div className="history-section">
				<div className="section-header">
					<h3 className="section-title">
						<FileText className="section-icon shared-icon" />
						Records the Patient Attached ({sharedRecords.length})
					</h3>
				</div>
				{sharedRecords.length > 0 ? (
					<div className="record-list">
						{sharedRecords.map((record, idx) => <SharedRecordCard key={idx} record={record} />)}
					</div>
				) : (
					<p className="empty-state">The patient hasn't attached any external records to this visit.</p>
				)}
			</div>

			{/* This doctor's own past prescriptions for this patient */}
			<div className="history-section">
				<div className="section-header">
					<h3 className="section-title">
						<Stethoscope className="section-icon own-icon" />
						Your Previous Prescriptions ({past.length})
					</h3>
				</div>

				{loading ? (
					<p className="empty-state">Loading prescription history...</p>
				) : past.length === 0 ? (
					<p className="empty-state">No previous prescriptions for this patient yet.</p>
				) : (
					<div className="rx-ref-list">
						{past.map((booking) => (
							<button key={booking._id} className="rx-ref-card" onClick={() => setSelected(booking)}>
								<div className="rx-ref-main">
									<div className="rx-ref-date">
										<CalendarDays size={16} /> {formatDate(booking.dateOfAppointment)}
									</div>
									<div className="rx-ref-diagnosis">
										{booking.diagnosis || <span className="rx-ref-nodiag">No diagnosis recorded</span>}
									</div>
								</div>
								<div className="rx-ref-meta">
									<span className="rx-ref-count"><Pill size={13} /> {booking.recommendedSupplements.length}</span>
									<ChevronRight size={18} className="rx-ref-chevron" />
								</div>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Full-detail modal for a selected past prescription */}
			{selected && (
				<div className="rx-modal-overlay" onClick={() => setSelected(null)}>
					<div className="rx-modal" onClick={(e) => e.stopPropagation()}>
						<button className="rx-modal-close" onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button>

						<div className="rx-modal-head">
							<h3>Prescription — {formatDate(selected.dateOfAppointment)}</h3>
							<p className="rx-modal-diagnosis">
								<Stethoscope size={15} />
								<strong>Diagnosis:</strong> {selected.diagnosis || 'Not recorded'}
							</p>
						</div>

						<div className="rx-modal-body">
							{selected.recommendedSupplements.length === 0 ? (
								<p className="empty-state">No medicines were prescribed on this visit.</p>
							) : (
								selected.recommendedSupplements.map((s, idx) => (
									<div key={s._id || idx} className="rx-modal-med">
										<div className="rx-modal-med-name"><Pill size={16} /> {s.medicineName}</div>
										<div className="rx-modal-med-detail">
											<ClipboardList size={14} />
											<span><strong>Dosage:</strong> {s.dosage || '—'}</span>
										</div>
										<div className="rx-modal-med-detail">
											<ClipboardList size={14} />
											<span><strong>Instructions:</strong> {s.instructions || '—'}</span>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
