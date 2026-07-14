import React, { useState } from 'react';
import { Pill, Salad, HeartPulse, FileText } from 'lucide-react';
import './PrescriptionTabs.css';
import { MedicineForm } from './MedicineForm';
import { DietPlanForm } from './DietPlanForm';
import { YogaPlanForm } from './YogaPlanForm';
import { MedicalHistoryViewer } from './MedicalHistoryViewer';

const tabs = [
	{ id: 'medicine', label: 'Medicine', Icon: Pill },
	{ id: 'diet', label: 'Diet Plan', Icon: Salad },
	{ id: 'yoga', label: 'Yoga / Wellness', Icon: HeartPulse },
	{ id: 'history', label: 'Medical History', Icon: FileText },
];

export function PrescriptionTabs({ bookingId, patientId, doctorId, onPrescribed }) {
	const [activeTab, setActiveTab] = useState('medicine');

	const renderForm = () => {
		switch (activeTab) {
			case 'medicine':
				return <MedicineForm bookingId={bookingId} patientId={patientId} doctorId={doctorId} onPrescribed={onPrescribed} />;
			case 'diet':
				return <DietPlanForm bookingId={bookingId} patientId={patientId} doctorId={doctorId} onPrescribed={onPrescribed} />;
			case 'yoga':
				return <YogaPlanForm bookingId={bookingId} patientId={patientId} doctorId={doctorId} onPrescribed={onPrescribed} />;
			case 'history':
				return <MedicalHistoryViewer patientId={patientId} />;
			default:
				return null;
		}
	};

	return (
		<div className="tabs-containers">
			<div className="tab-list">
				{tabs.map(({ id, label, Icon }) => (
					<button
						key={id}
						className={`tab-trigger ${activeTab === id ? 'active' : ''}`}
						onClick={() => setActiveTab(id)}
					>
						<Icon className="tab-icon" size={18} />
						{label}
					</button>
				))}
			</div>

			<div className="tab-content">
				{renderForm()}
			</div>
		</div>
	);
}
