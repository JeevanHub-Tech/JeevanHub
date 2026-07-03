import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import defaultProfilePic from '../../media/default-profile.png';
import { Camera } from 'lucide-react';
import './PatientProfile.css';

const PatientProfile = () => {
    const { auth, setAuth } = useContext(AuthContext);
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

    useEffect(() => {
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

        if (auth.token && auth.user?.id) {
            fetchPatientData();
        } else {
            navigate('/signin');
        }
    }, [auth, navigate]);

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
            await axios.put(
                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/auth/change-password`,
                {
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                },
                { headers: { Authorization: `Bearer ${auth.token}` } }
            );

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
                `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/medicines/upload-image`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${auth.token}`
                    }
                }
            );

            if (res.data.imageUrl) {
                const newImageUrl = res.data.imageUrl;
                setPatientData({ ...patientData, profileImage: newImageUrl });
                
                // Immediately save the image update to backend
                await axios.put(
                    `${process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080'}/api/patients/updatePatient/${auth.user.id}`,
                    { profileImage: newImageUrl },
                    { headers: { Authorization: `Bearer ${auth.token}` } }
                );

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

    const handleSignOut = () => {
        setAuth({ token: null, user: null, role: 'guest' });
        localStorage.removeItem("token");
        localStorage.removeItem("role");
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
                </div>
            </div>
        </div>
    );
};

export default PatientProfile;
