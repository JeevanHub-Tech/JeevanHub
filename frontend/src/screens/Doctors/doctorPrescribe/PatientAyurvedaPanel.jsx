import AyurvedaDashboard from "../../Patients/Ayurveda/AyurvedaDashboard";

// Read-only wrapper around the patient-facing Ayurveda dashboard, reused
// as-is for the doctor's per-booking prescribe view. The dashboard itself
// switches to the .../patient/:patientId endpoints and hides the
// generate-plan control whenever `readOnly` is set.
export function PatientAyurvedaPanel({ patientId }) {
	if (!patientId) return null;
	return <AyurvedaDashboard patientId={patientId} readOnly embedded />;
}
