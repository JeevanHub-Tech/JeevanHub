import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import defaultProfilePic from '../../media/default-profile.png';
import { Camera, FileText, Trash2, UploadCloud } from 'lucide-react';
import { DocumentViewerModal } from '../../components/DocumentViewerModal';
import './PatientProfile.css';

const PatientProfile = () => {
    const { auth, setAuth, logout, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [patientData, setPatientData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dob: '',
        gender: '',
        zipCode: '',
        address: '',
        profileImage: ''
    });

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [medicalHistory, setMedicalHistory] = useState([]);
    const [uploadingDocs, setUploadingDocs] = useState(false);
    const [viewingDoc, setViewingDoc] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        
        // Fetch full patient data
        const fetchPatientData = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/patients/getPatient/${auth.user?.id}`,
                    { headers: { Authorization: `Bearer ${auth.token}` } }
                );
                
                // Format date to YYYY-MM-DD for input field
                let formattedDob = '';
                if (response.data.dob) {
                    const date = new Date(response.data.dob);
                    formattedDob = date.toISOString().split('T')[0];
                }

                setPatientData({
                    firstName: response.data.firstName || '',
                    lastName: response.data.lastName || '',
                    email: response.data.email || '',
                    phone: response.data.phone || '',
                    dob: formattedDob,
                    gender: response.data.gender || '',
                    zipCode: response.data.zipCode || '',
                    address: response.data.address || '',
                    profileImage: response.data.profileImage || ''
                });
            } catch (error) {
                console.error("Error fetching patient data:", error);
                alert("Failed to load profile details.");
            }
        };

        const fetchMedicalHistory = async () => {
            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/patients/${auth.user?.id}/medical-history`,
                    { headers: { Authorization: `Bearer ${auth.token}` } }
                );
                setMedicalHistory(response.data.medicalHistory || []);
            } catch (error) {
                console.error("Error fetching medical history:", error);
            }
        };

        // Wait for AuthContext's bootstrap check to settle -- right after a hard
        // refresh auth.user is legitimately null for a moment, and redirecting
        // here before that resolves bounces a logged-in user off this page.
        if (authLoading) return;

        if (auth.token && auth.user?.id) {
            fetchPatientData();
            fetchMedicalHistory();
        } else {
            navigate('/signin');
        }
    }, [auth, authLoading, navigate]);

    const handleInputChange = (e) => {
        setPatientData({ ...patientData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const payload = {
                firstName: patientData.firstName,
                lastName: patientData.lastName,
                email: patientData.email,
                phone: patientData.phone,
                dateOfBirth: patientData.dob,
                gender: patientData.gender,
                pincode: patientData.zipCode,
                address: patientData.address,
                profileImage: patientData.profileImage
            };

            const response = await axios.put(
                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/patients/updatePatient/${auth.user.id}`,
                payload,
                { headers: { Authorization: `Bearer ${auth.token}` } }
            );

            alert("Profile updated successfully!");
            
            // Update auth context with new info
            if (response.data.data) {
                setAuth(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        firstName: response.data.data.firstName,
                        lastName: response.data.data.lastName,
                        profileImage: response.data.data.profileImage,
                        phone: response.data.data.phone
                    }
                }));
            }
            
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return alert("New passwords do not match!");
        }

        try {
            const response = await axios.put(
                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/auth/change-password`,
                {
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                },
                { headers: { Authorization: `Bearer ${auth.token}` } }
            );

            // Changing the password invalidates the old token server-side, so the
            // session must pick up the fresh one or every following request 401s.
            if (response.data.token) {
                setAuth(prev => ({ ...prev, token: response.data.token }));
                localStorage.setItem("token", response.data.token);
            }

            alert("Password changed successfully!");
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error("Error changing password:", error);
            alert(error.response?.data?.message || "Failed to change password");
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            setLoading(true);
            const res = await axios.post(
                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/patients/${auth.user.id}/profile-image`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${auth.token}`
                    }
                }
            );

            if (res.data.url) {
                const newImageUrl = res.data.url;
                setPatientData({ ...patientData, profileImage: newImageUrl });

                setAuth(prev => ({
                    ...prev,
                    user: { ...prev.user, profileImage: newImageUrl }
                }));

                alert("Profile image updated successfully!");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image.");
        } finally {
            setLoading(false);
        }
    };

    const handleMedicalHistoryUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(file => formData.append("documents", file));

        try {
            setUploadingDocs(true);
            const res = await axios.post(
                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/patients/${auth.user.id}/medical-history`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${auth.token}`
                    }
                }
            );
            setMedicalHistory(res.data.medicalHistory || []);
        } catch (error) {
            console.error("Error uploading medical history:", error);
            alert(error.response?.data?.message || "Failed to upload document(s).");
        } finally {
            setUploadingDocs(false);
            e.target.value = '';
        }
    };

    const handleDeleteMedicalHistoryDoc = async (docId) => {
        if (!window.confirm("Remove this document?")) return;
        try {
            const res = await axios.delete(
                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/patients/${auth.user.id}/medical-history/${docId}`,
                { headers: { Authorization: `Bearer ${auth.token}` } }
            );
            setMedicalHistory(res.data.medicalHistory || []);
        } catch (error) {
            console.error("Error deleting medical history document:", error);
            alert("Failed to delete document.");
        }
    };

    const handleSignOut = () => {
        logout();
        navigate("/signin");
    };

    return (
        <div className="premium-profile-wrapper">
            <div className="premium-profile-container">
                {/* Left Sidebar */}
                <div className="profile-sidebar">
                    <div className="profile-image-container">
                        <img 
                            src={patientData.profileImage || defaultProfilePic} 
                            alt="Profile" 
                            className="profile-avatar"
                        />
                        <label htmlFor="profile-upload" className="image-upload-overlay">
                            <Camera size={24} />
                        </label>
                        <input 
                            type="file" 
                            id="profile-upload" 
                            className="upload-input" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            disabled={loading}
                        />
                    </div>
                    <h3 className="profile-name">{patientData.firstName} {patientData.lastName}</h3>
                    <p className="profile-email">{patientData.email}</p>
                    <div className="sidebar-actions">
                        <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
                    </div>
                </div>

                {/* Main Panel */}
                <div className="profile-main-panel">
                    <div className="panel-header">
                        <h2>Personal Information</h2>
                        <div className="header-actions">
                            {isEditing ? (
                                <>
                                    <button className="save-btn" onClick={handleSaveProfile} disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Profile'}
                                    </button>
                                    <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                </>
                            ) : (
                                <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
                            )}
                        </div>
                    </div>
                    
                    <div className="info-section">
                        <div className="info-grid">
                            <div className="form-group">
                                <label>First Name</label>
                                <input 
                                    type="text" 
                                    name="firstName" 
                                    value={patientData.firstName} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input 
                                    type="text" 
                                    name="lastName" 
                                    value={patientData.lastName} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input 
                                    type="text" 
                                    name="phone" 
                                    value={patientData.phone} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <input 
                                    type="date" 
                                    name="dob" 
                                    value={patientData.dob} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Gender</label>
                                <select 
                                    name="gender" 
                                    value={patientData.gender} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing}
                                >
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Zip Code</label>
                                <input 
                                    type="text" 
                                    name="zipCode" 
                                    value={patientData.zipCode} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Address</label>
                                <input 
                                    type="text" 
                                    name="address" 
                                    value={patientData.address} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="password-section">
                        <h3>Change Password</h3>
                        <form className="password-form" onSubmit={handlePasswordSubmit}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input 
                                    type="password" 
                                    name="currentPassword" 
                                    value={passwords.currentPassword} 
                                    onChange={handlePasswordChange}
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input 
                                    type="password" 
                                    name="newPassword" 
                                    value={passwords.newPassword} 
                                    onChange={handlePasswordChange}
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input 
                                    type="password" 
                                    name="confirmPassword" 
                                    value={passwords.confirmPassword} 
                                    onChange={handlePasswordChange}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <button type="submit" className="change-pwd-btn">Update Password</button>
                        </form>
                    </div>

                    <div className="medical-history-section">
                        <h3>Medical History</h3>
                        <p className="medical-history-hint">
                            Upload previous medical records (PDF, JPG, PNG) so doctors you consult can reference them.
                        </p>

                        <label htmlFor="medical-history-upload" className="upload-docs-btn">
                            <UploadCloud size={18} />
                            {uploadingDocs ? 'Uploading...' : 'Upload Documents'}
                        </label>
                        <input
                            type="file"
                            id="medical-history-upload"
                            className="upload-input"
                            accept=".pdf,.jpg,.jpeg,.png"
                            multiple
                            onChange={handleMedicalHistoryUpload}
                            disabled={uploadingDocs}
                        />

                        <div className="medical-history-list">
                            {medicalHistory.length === 0 ? (
                                <p className="empty-state">No documents uploaded yet.</p>
                            ) : (
                                medicalHistory.map((doc) => (
                                    <div className="medical-history-item" key={doc._id}>
                                        <button type="button" className="medical-history-link" onClick={() => setViewingDoc(doc)}>
                                            <FileText size={18} />
                                            <span>{doc.fileName}</span>
                                        </button>
                                        <button
                                            type="button"
                                            className="delete-doc-btn"
                                            onClick={() => handleDeleteMedicalHistoryDoc(doc._id)}
                                            aria-label="Delete document"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {viewingDoc && <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />}
        </div>
    );
};

export default PatientProfile;
