import React, { useState } from "react";
import { Star, Link as LinkIcon, UploadCloud, Calendar, Clock, Stethoscope, Mail, Pill, ChevronDown, Video, CreditCard, MessageSquareText, ShoppingBag, Pencil, XCircle, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ShareRecordModal from "./ShareRecordModal";
import { authFetch } from "../../../utils/authFetch";

const BACKEND = process.env.REACT_APP_AYURVEDA_BACKEND_URL;

// A booking is still open for sharing records: any time up to the appointment,
// or within 24h after it (matches the backend's isWithinSharingWindow check).
const isWithinSharingWindow = (dateOfAppointment) => {
	const now = new Date();
	const appointmentTime = new Date(dateOfAppointment);
	if (appointmentTime >= now) return true;
	const hoursSinceAppointment = (now - appointmentTime) / (1000 * 60 * 60);
	return hoursSinceAppointment <= 24;
};

const formatDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const STATUS_TONES = {
	Upcoming: "blue",
	Pending: "amber",
	Denied: "red",
	Completed: "green",
};

const StatusBadge = ({ label, tone }) => (
	<span className={`apt-badge apt-badge--${tone}`}>{label}</span>
);

// Collapsed by default (keeps cards short) — expands to show dosage/instructions
// per medicine, plus the visit's diagnosis if one was recorded.
const PrescriptionSummary = ({ diagnosis, supplements }) => {
	const [open, setOpen] = useState(false);
	const count = supplements?.length || 0;
	if (!count && !diagnosis) return null;

	return (
		<div className="apt-rx">
			<button type="button" className="apt-rx-chip" onClick={() => setOpen(o => !o)} aria-expanded={open}>
				<Pill size={14} />
				{count > 0 ? `${count} medicine${count > 1 ? "s" : ""} prescribed` : "Diagnosis recorded"}
				<ChevronDown size={14} className={`apt-rx-chevron ${open ? "is-open" : ""}`} />
			</button>
			{open && (
				<div className="apt-rx-body">
					{diagnosis && (
						<p className="apt-rx-diagnosis"><Stethoscope size={13} /> <strong>Diagnosis:</strong> {diagnosis}</p>
					)}
					{supplements?.map((s, i) => (
						<div key={s._id || i} className="apt-rx-item">
							<span className="apt-rx-item__name">{s.medicineName}</span>
							{s.dosage && <span className="apt-rx-item__detail"><strong>Dosage:</strong> {s.dosage}</span>}
							{s.instructions && <span className="apt-rx-item__detail"><strong>Instructions:</strong> {s.instructions}</span>}
						</div>
					))}
				</div>
			)}
		</div>
	);
};

// The reason-for-visit is often a full paragraph — it gets its own section
// (same visual treatment as the doctor's-message note) instead of being
// squeezed into the meta strip. Only editable on upcoming appointments.
const IllnessSection = ({ appointmentId, illness, editable, onSaved }) => {
	const [editing, setEditing] = useState(false);
	const [value, setValue] = useState(illness || "");
	const [saving, setSaving] = useState(false);

	if (!illness && !editable) return null;

	if (editing) {
		const handleSave = async () => {
			const trimmed = value.trim();
			if (!trimmed) {
				alert("Description cannot be empty.");
				return;
			}
			setSaving(true);
			try {
				const response = await authFetch(`${BACKEND}/api/bookings/${appointmentId}/illness`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ patientIllness: trimmed })
				});
				if (!response.ok) {
					const err = await response.json().catch(() => ({}));
					throw new Error(err.error || "Failed to update");
				}
				onSaved(appointmentId, trimmed);
				setEditing(false);
			} catch (err) {
				alert(err.message);
			} finally {
				setSaving(false);
			}
		};

		return (
			<div className="apt-card__illness apt-card__illness--editing">
				<span className="apt-card__illness-label"><Stethoscope size={13} /> Reason for visit</span>
				<textarea
					className="apt-illness-textarea"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					rows={3}
					placeholder="Describe your symptoms or reason for this visit..."
				/>
				<div className="apt-illness-actions">
					<button type="button" className="apt-btn apt-btn--primary" onClick={handleSave} disabled={saving}>
						{saving ? "Saving..." : "Save"}
					</button>
					<button type="button" className="apt-btn apt-btn--ghost" onClick={() => { setValue(illness || ""); setEditing(false); }} disabled={saving}>
						Cancel
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="apt-card__illness">
			<span className="apt-card__illness-label">
				<Stethoscope size={13} /> Reason for visit
				{editable && (
					<button type="button" className="apt-illness-edit-btn" onClick={() => { setValue(illness || ""); setEditing(true); }} aria-label="Edit reason for visit">
						<Pencil size={12} />
					</button>
				)}
			</span>
			<p className="apt-card__illness-text">{illness || "Not specified"}</p>
		</div>
	);
};

const AppointmentTab = ({
	activeTab,
	upcomingAppointments,
	pendingDoctors,
	deniedDoctors,
	previousAppointments,
	supplements,
	handlePayFees,
	onRatingClick,
	onIllnessUpdated,
	onRequestCancelled
}) => {
	const navigate = useNavigate();
	// { bookingId, mode: 'upload' | 'reference' } — which action opened the modal
	// decides which of ShareRecordModal's two modes it should start on.
	const [shareModal, setShareModal] = useState(null);
	const [cancellingId, setCancellingId] = useState(null);
	const [rebookingId, setRebookingId] = useState(null);

	const handleCancelRequest = async (appointment) => {
		if (!window.confirm(`Cancel your pending request with Dr. ${appointment.doctorName}?`)) return;
		setCancellingId(appointment._id);
		try {
			const response = await authFetch(`${BACKEND}/api/bookings/delete/${appointment._id}`, {
				method: "DELETE"
			});
			if (!response.ok) throw new Error("Failed to cancel request");
			onRequestCancelled(appointment._id);
		} catch (err) {
			alert("Could not cancel this request. Please try again.");
		} finally {
			setCancellingId(null);
		}
	};

	const handleRebook = async (appointment) => {
		setRebookingId(appointment._id);
		try {
			// doctorId may be a populated object (from getBookingsByPatientId's
			// .populate('doctorId')) or a plain string ID depending on the
			// endpoint the booking came from — handle both.
			const targetDoctorId = appointment.doctorId?._id || appointment.doctorId;
			const response = await authFetch(`${BACKEND}/api/doctors/publicDoctors`);
			if (!response.ok) throw new Error("Failed to load doctor");
			const doctors = await response.json();
			const rawDoctor = (doctors.doctors || doctors).find(d => d._id === targetDoctorId);
			if (!rawDoctor) throw new Error("This doctor is no longer available.");
			// DoctorDetailPage.js expects the same shape DoctorsScreen.js builds when a
			// patient clicks a doctor card normally (a combined `name`, not raw
			// firstName/lastName) — publicDoctors returns the raw shape, so map it here too.
			const doctor = { ...rawDoctor, name: `${rawDoctor.firstName} ${rawDoctor.lastName}` };
			navigate("/doctor-detail", { state: { doctor } });
		} catch (err) {
			alert(err.message || "Could not start a new booking with this doctor.");
		} finally {
			setRebookingId(null);
		}
	};

	// Shared card shell used by all four tabs — variant controls which
	// meta/action pieces are relevant for that appointment's state.
	const AppointmentCard = ({ appointment, variant }) => {
		const isRescheduled = appointment.isRescheduledByDoctor;
		const isCancelledByDoctor = appointment.isCancelledByDoctor;

		let badgeLabel = variant === "previous" ? appointment.source : variant.charAt(0).toUpperCase() + variant.slice(1);
		if (variant === "denied" && isCancelledByDoctor) badgeLabel = "Cancelled by Doctor";
		const badgeTone = STATUS_TONES[badgeLabel] || (variant === "denied" ? "red" : "blue");

		const rowSupplements = supplements[appointment._id];
		const showRating = (variant === "upcoming" && new Date(appointment.dateOfAppointment) < new Date()) ||
			(variant === "previous" && appointment.source === "Completed");
		const canShare = variant !== "denied" && isWithinSharingWindow(appointment.dateOfAppointment);
		const canRebook = variant === "denied" || (variant === "previous" && appointment.source !== "Pending");
		// doctorId comes back populated (a full object) from getBookingsByPatientId,
		// not a plain string — anything that needs the raw ID has to unwrap it.
		const doctorIdStr = appointment.doctorId?._id || appointment.doctorId;

		return (
			<div className="apt-card">
				<div className="apt-card__header">
					<h3>Dr. {appointment.doctorName}</h3>
					<div className="apt-card__badges">
						{isRescheduled && <span className="apt-badge apt-badge--amber">Rescheduled</span>}
						<StatusBadge label={badgeLabel} tone={badgeTone} />
					</div>
				</div>

				<div className="apt-card__meta">
					<span className="apt-meta-item"><Calendar size={13} /> {formatDate(appointment.dateOfAppointment)}</span>
					{appointment.timeSlot && <span className="apt-meta-item"><Clock size={13} /> {appointment.timeSlot}</span>}
					<span className="apt-meta-item apt-meta-item--muted"><Mail size={12} /> {appointment.doctorEmail}</span>
				</div>

				<IllnessSection
					appointmentId={appointment._id}
					illness={appointment.patientIllness}
					editable={variant === "upcoming"}
					onSaved={onIllnessUpdated}
				/>

				{variant === "denied" && appointment.doctorsMessage && (
					<p className="apt-card__note"><MessageSquareText size={13} /> {appointment.doctorsMessage}</p>
				)}
				{variant === "previous" && appointment.doctorsMessage && (
					<p className="apt-card__note"><MessageSquareText size={13} /> {appointment.doctorsMessage}</p>
				)}

				{(variant === "upcoming" || variant === "previous") && (
					<PrescriptionSummary diagnosis={appointment.diagnosis} supplements={rowSupplements} />
				)}

				{showRating && (
					appointment.rating != null ? (
						<div className="apt-rating-row">
							<span className="apt-rating-stars">
								{[...Array(5)].map((_, i) => (
									<Star key={i} size={15} fill={i < appointment.rating ? "#ffc107" : "none"} color={i < appointment.rating ? "#ffc107" : "#d1d5db"} />
								))}
							</span>
							{appointment.review && <span className="apt-rating-review">"{appointment.review}"</span>}
						</div>
					) : null
				)}

				<div className="apt-card__actions">
					{variant === "upcoming" && (
						appointment.meetLink && appointment.meetLink !== "no" ? (
							<button className="apt-btn apt-btn--primary" onClick={() => window.open(appointment.meetLink, "_blank")}>
								<Video size={14} /> Join Meet
							</button>
						) : (
							<button className="apt-btn apt-btn--primary" onClick={() => handlePayFees(doctorIdStr, appointment._id)}>
								<CreditCard size={14} /> Pay Fees
							</button>
						)
					)}

					{variant === "pending" && (
						<button
							className="apt-btn apt-btn--ghost-danger"
							onClick={() => handleCancelRequest(appointment)}
							disabled={cancellingId === appointment._id}
						>
							<XCircle size={14} /> {cancellingId === appointment._id ? "Cancelling..." : "Cancel Request"}
						</button>
					)}

					{showRating && appointment.rating == null && (
						<button
							className="apt-btn apt-btn--ghost"
							onClick={() => variant === "previous" ? navigate(`/PatientFeedback/${appointment._id}`) : onRatingClick(appointment._id)}
						>
							<Star size={14} /> Give Rating
						</button>
					)}

					{canShare && (
						<>
							<button
								className="apt-btn apt-btn--ghost-purple"
								onClick={() => setShareModal({ bookingId: appointment._id, mode: 'reference' })}
							>
								<LinkIcon size={14} /> Attach Prescription
							</button>
							<button
								className="apt-btn apt-btn--ghost-purple"
								onClick={() => setShareModal({ bookingId: appointment._id, mode: 'upload' })}
							>
								<UploadCloud size={14} /> Upload Prescription
							</button>
						</>
					)}

					{variant === "previous" && appointment.source === "Completed" && rowSupplements?.length > 0 && (
						<button className="apt-btn apt-btn--ghost" onClick={() => navigate('/cart')}>
							<ShoppingBag size={14} /> View in Cart
						</button>
					)}

					{canRebook && (
						<button
							className="apt-btn apt-btn--ghost"
							onClick={() => handleRebook(appointment)}
							disabled={rebookingId === appointment._id}
						>
							<RotateCcw size={14} /> {rebookingId === appointment._id ? "Loading..." : "Rebook with this Doctor"}
						</button>
					)}
				</div>
			</div>
		);
	};

	const EmptyState = ({ text }) => <p className="apt-empty">{text}</p>;

	const renderUpcomingAppointments = () => (
		<div className="apt-list">
			{upcomingAppointments.length > 0 ? (
				[...upcomingAppointments]
					.sort((a, b) => new Date(a.dateOfAppointment) - new Date(b.dateOfAppointment))
					.map((a) => <AppointmentCard key={a._id} appointment={a} variant="upcoming" />)
			) : (
				<EmptyState text="No upcoming doctor assigned." />
			)}
		</div>
	);

	const renderPendingDoctors = () => (
		<div className="apt-list">
			{pendingDoctors.length > 0 ? (
				[...pendingDoctors]
					.sort((a, b) => new Date(a.dateOfAppointment) - new Date(b.dateOfAppointment))
					.map((a) => <AppointmentCard key={a._id} appointment={a} variant="pending" />)
			) : (
				<EmptyState text="No pending doctor requests at the moment." />
			)}
		</div>
	);

	const renderDeniedDoctors = () => (
		<div className="apt-list">
			{deniedDoctors.length > 0 ? (
				[...deniedDoctors]
					.sort((a, b) => new Date(b.dateOfAppointment) - new Date(a.dateOfAppointment))
					.map((a) => <AppointmentCard key={a._id} appointment={a} variant="denied" />)
			) : (
				<EmptyState text="No denied doctor requests at the moment." />
			)}
		</div>
	);

	const renderPreviousAppointments = () => (
		<div className="apt-list">
			{previousAppointments.length > 0 ? (
				[...previousAppointments]
					.sort((a, b) => new Date(b.dateOfAppointment) - new Date(a.dateOfAppointment))
					.map((a) => <AppointmentCard key={a._id} appointment={a} variant="previous" />)
			) : (
				<EmptyState text="No previous appointments in your history." />
			)}
		</div>
	);

	let content;
	switch (activeTab) {
		case "Upcoming": content = renderUpcomingAppointments(); break;
		case "Pending": content = renderPendingDoctors(); break;
		case "Denied": content = renderDeniedDoctors(); break;
		case "Previous": content = renderPreviousAppointments(); break;
		default: content = <p>Select a tab to view appointments</p>;
	}

	return (
		<>
			{content}
			{shareModal && (
				<ShareRecordModal
					bookingId={shareModal.bookingId}
					initialMode={shareModal.mode}
					onClose={() => setShareModal(null)}
				/>
			)}
		</>
	);
};

export default AppointmentTab;
