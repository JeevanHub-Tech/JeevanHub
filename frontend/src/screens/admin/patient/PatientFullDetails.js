import React, { useState, useEffect } from "react";
import "./PatientFullDetails.css";
import { useNavigate } from "react-router-dom";

const PatientManagement = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [patientToEdit, setPatientToEdit] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/patients/getAllPatients`
                );
                if (!res.ok) throw new Error("Failed to fetch patients");
                const data = await res.json();
                setPatients(data);
            } catch (error) {
                console.error("Error fetching patients:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const filteredPatients = patients.filter(
        (p) =>
            p.firstName?.toLowerCase().includes(search.toLowerCase()) ||
            p.lastName?.toLowerCase().includes(search.toLowerCase()) ||
            p.email?.toLowerCase().includes(search.toLowerCase()) ||
            p.phone?.toLowerCase().includes(search.toLowerCase())
    );

    const handleRowClick = (id) => {
        navigate(`/patients/${id}`);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevents navigating to details page
        if (!window.confirm("Are you sure you want to delete this patient?")) return;

        try {
            const res = await fetch(
                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/patients/deletePatient/${id}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to delete patient");
            }

            setPatients((prev) => prev.filter((p) => p._id !== id));
            alert("Patient deleted successfully!");
        } catch (error) {
            alert("Error deleting patient: " + error.message);
        }
    };

    const handleEdit = (e, patient) => {
        e.stopPropagation(); // Prevents navigating to details page
        setPatientToEdit(patient);
        setIsEditModalOpen(true);
    };

    const handleSaveChanges = (updatedPatient) => {
        setPatients((prev) =>
            prev.map((p) => (p._id === updatedPatient._id ? updatedPatient : p))
        );
        setIsEditModalOpen(false);
        setPatientToEdit(null);
    };

    if (loading) {
        return <div className="patfull-loader">Loading patients...</div>;
    }

    return (
        <div className="patfull-container">
            <div className="patfull-header">
                <button onClick={() => navigate(-1)} className="patfull-back-btn">
                    ← Back
                </button>
                <h2>Patient Management</h2>
            </div>

            <div className="patfull-search-bar">
                <input
                    type="text"
                    placeholder="Search patients by name, email, or contact..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="patfull-table-wrapper">
                <table className="patfull-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Contact No.</th>
                            <th>Gender</th>
                            <th>ZipCode</th>
                            <th>Age</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                                <tr
                                    key={patient._id}
                                    onClick={() => handleRowClick(patient._id)}
                                >
                                    <td>{`${patient.firstName} ${patient.lastName}`}</td>
                                    <td>{patient.email}</td>
                                    <td>{patient.phone}</td>
                                    <td>{patient.gender}</td>
                                    <td>{typeof patient.zipCode === "object" && patient.zipCode !== null ? (patient.zipCode.specific || patient.zipCode.pincode || "Not specified") : (patient.zipCode || "Not specified")}</td>
                                    <td>{patient.age || "N/A"}</td>
                                    <td className="patfull-action-buttons">
                                        <button
                                            className="patfull-edit-btn"
                                            onClick={(e) => handleEdit(e, patient)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="patfull-delete-btn"
                                            onClick={(e) => handleDelete(e, patient._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="patfull-no-patients">
                                    No patients found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {patientToEdit && (
                <EditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    patient={patientToEdit}
                    onSave={handleSaveChanges}
                />
            )}
        </div>
    );
};

// ===== Edit Modal =====
const EditModal = ({ isOpen, onClose, patient, onSave }) => {
    const [formData, setFormData] = useState({ ...patient });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="patfull-modal-overlay">
            <div className="patfull-modal-content">
                <div className="patfull-modal-header">
                    <h3>Edit Patient Details</h3>
                    <button className="patfull-close-modal-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="patfull-edit-form">
                    <div className="patfull-form-row">
                        <div className="patfull-form-group">
                            <label>First Name</label>
                            <input type="text" name="firstName" value={formData.firstName || ''} onChange={handleChange} />
                        </div>
                        <div className="patfull-form-group">
                            <label>Last Name</label>
                            <input type="text" name="lastName" value={formData.lastName || ''} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="patfull-form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} />
                    </div>
                    <div className="patfull-form-group">
                        <label>Phone</label>
                        <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} />
                    </div>
                    <div className="patfull-form-row">
                        <div className="patfull-form-group">
                            <label>Age</label>
                            <input type="number" name="age" value={formData.age || ''} onChange={handleChange} />
                        </div>
                        <div className="patfull-form-group">
                            <label>Gender</label>
                            <select name="gender" value={formData.gender || ''} onChange={handleChange}>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="patfull-modal-actions">
                        <button type="button" className="patfull-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="patfull-btn-save">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PatientManagement;