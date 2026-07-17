import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import defaultProfilePic from '../../media/default-profile.png';
import { Camera, AlertTriangle, CreditCard, Pencil, Check } from 'lucide-react';
import './DoctorProfile.css';
import { BACKEND_URL } from '../../config';

const DoctorProfile = () => {
    const { auth, setAuth, logout, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [isEditingUpi, setIsEditingUpi] = useState(false);
    const [tempUpiId, setTempUpiId] = useState('');
    const [loading, setLoading] = useState(false);
    const [doctorData, setDoctorData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        registrationNumber: '',
        specialization: '',
        experience: '',
        price: '',
        age: '',
        gender: '',
        zipCode: '',
        education: '',
        designation: '',
        profileImage: '',
        upiId: ''
    });

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [zoomImage, setZoomImage] = useState(false);

    useEffect(() => {
        // Fetch full doctor data
        const fetchDoctorData = async () => {
            try {
                const response = await axios.get(
                    `${BACKEND_URL || 'http://localhost:8080'}/api/doctors/getDoctorById/${auth.user?.id}`,
                    { headers: { Authorization: `Bearer ${auth.token}` } }
                );
                
                const data = response.data;
                // Specialization comes as an array from backend
                const specString = Array.isArray(data.specialization) 
                    ? data.specialization.join(', ') 
                    : (data.specialization || '');

                setDoctorData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    registrationNumber: data.registrationNumber || '',
                    specialization: specString,
                    experience: data.experience || '',
                    price: data.price || '',
                    age: data.age || '',
                    gender: data.gender || '',
                    zipCode: data.zipCode || '',
                    education: data.education || '',
                    designation: data.designation || '',
                    profileImage: data.profileImage || '',
                    upiId: data.upiId || ''
                });
            } catch (error) {
                console.error("Error fetching doctor data:", error);
                alert("Failed to load profile details.");
            }
        };

        // Wait for AuthContext's bootstrap check to settle -- right after a hard
        // refresh auth.user is legitimately null for a moment, and redirecting
        // here before that resolves bounces a logged-in user off this page.
        if (authLoading) return;

        if (auth.token && auth.user?.id) {
            fetchDoctorData();
        } else {
            navigate('/signin');
        }
    }, [auth, authLoading, navigate]);

    const handleInputChange = (e) => {
        setDoctorData({ ...doctorData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            // Convert specialization string back to array
            const specArray = doctorData.specialization.split(',').map(s => s.trim()).filter(Boolean);

            const payload = {
                firstName: doctorData.firstName,
                lastName: doctorData.lastName,
                email: doctorData.email,
                phone: doctorData.phone,
                registrationNumber: doctorData.registrationNumber,
                specialization: specArray,
                experience: doctorData.experience,
                price: doctorData.price,
                age: doctorData.age,
                gender: doctorData.gender,
                zipCode: doctorData.zipCode,
                education: doctorData.education,
                designation: doctorData.designation,
                profileImage: doctorData.profileImage,
                upiId: doctorData.upiId
            };

            const response = await axios.put(
                `${BACKEND_URL || 'http://localhost:8080'}/api/doctors/updateDoctor/${auth.user.id}`,
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

    const handleSaveUpiId = async () => {
        const upiRegex = /^[a-zA-Z0-9.\-_]{1,256}@[a-zA-Z0-9.\-_]{1,64}$/;
        if (tempUpiId && !upiRegex.test(tempUpiId)) {
            alert("Please enter a valid UPI ID format (e.g., doctor@upi).");
            return;
        }

        setLoading(true);
        try {
            await axios.put(
                `${BACKEND_URL || 'http://localhost:8080'}/api/doctors/updateDoctor/${auth.user.id}`,
                { upiId: tempUpiId },
                { headers: { Authorization: `Bearer ${auth.token}` } }
            );

            setDoctorData(prev => ({ ...prev, upiId: tempUpiId }));
            alert("UPI ID updated successfully!");
            setIsEditingUpi(false);
        } catch (error) {
            console.error("Error updating UPI ID:", error);
            alert(error.response?.data?.message || "Failed to update UPI ID.");
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
                `${BACKEND_URL || 'http://localhost:8080'}/api/auth/change-password`,
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
                `${BACKEND_URL || 'http://localhost:8080'}/api/medicines/upload-image`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${auth.token}`
                    }
                }
            );

            const newImageUrl = res.data.url || res.data.imageUrl;
            if (newImageUrl) {
                setDoctorData({ ...doctorData, profileImage: newImageUrl });
                
                // Immediately save the image update to backend
                await axios.put(
                    `${BACKEND_URL || 'http://localhost:8080'}/api/doctors/updateDoctor/${auth.user.id}`,
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
        logout();
        navigate("/signin");
    };

    const currentProfilePic = (doctorData.profileImage && doctorData.profileImage !== "undefined" && doctorData.profileImage !== "null") 
        ? doctorData.profileImage 
        : defaultProfilePic;

    return (
        <div className="premium-profile-wrapper">
            <div className="premium-profile-container">
                {/* Left Sidebar */}
                <div className="profile-sidebar">
                    <div className="profile-image-container">
                        <img 
                            src={currentProfilePic} 
                            alt="Profile" 
                            className="profile-avatar"
                            style={{ cursor: 'zoom-in' }}
                            onClick={() => setZoomImage(true)}
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
                    <h3 className="profile-name">Dr. {doctorData.firstName} {doctorData.lastName}</h3>
                    <p className="profile-email" style={{marginBottom: "5px", color: "#3b82f6", fontWeight: "600"}}>{doctorData.specialization || 'General Practitioner'}</p>
                    <p className="profile-email">{doctorData.email}</p>
                    <div className="sidebar-actions">
                        <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
                    </div>
                </div>

                {/* Main Panel */}
                <div className="profile-main-panel">
                    <div className="panel-header">
                        <h2>Professional Information</h2>
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

                    {/* Dedicated Payment / UPI ID Setup Section */}
                    <div className="upi-payment-setup-container">
                        {isEditingUpi ? (
                            <div className="upi-setup-card editing">
                                <div className="upi-card-header">
                                    <CreditCard className="card-icon blue-icon" size={22} />
                                    <h4>Configure UPI ID</h4>
                                </div>
                                <p className="upi-setup-desc">Enter your UPI ID to receive direct payments for consultation slots.</p>
                                <div className="upi-input-group">
                                    <input 
                                        type="text" 
                                        placeholder="e.g. doctorname@okaxis" 
                                        value={tempUpiId}
                                        onChange={(e) => setTempUpiId(e.target.value)}
                                        className="upi-input"
                                    />
                                    <div className="upi-input-actions">
                                        <button className="upi-save-btn" onClick={handleSaveUpiId} disabled={loading} title="Save UPI ID">
                                            <Check size={18} />
                                        </button>
                                        <button className="upi-cancel-btn" onClick={() => setIsEditingUpi(false)}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        ) : !doctorData.upiId ? (
                            <div className="upi-setup-card missing">
                                <div className="upi-card-info">
                                    <AlertTriangle className="card-icon orange-icon" size={24} />
                                    <div className="upi-text-content">
                                        <h4>UPI ID Missing</h4>
                                        <p>Your paid slots will not be visible to the patients until you configure a valid UPI ID.</p>
                                    </div>
                                </div>
                                <button className="upi-action-btn add-btn" onClick={() => { setIsEditingUpi(true); setTempUpiId(''); }}>
                                    Add UPI ID
                                </button>
                            </div>
                        ) : (
                            <div className="upi-setup-card configured">
                                <div className="upi-card-info">
                                    <CreditCard className="card-icon green-icon" size={24} />
                                    <div className="upi-text-content">
                                        <h4>UPI ID Configured</h4>
                                        <p className="upi-id-val">{doctorData.upiId}</p>
                                    </div>
                                </div>
                                <button className="edit-btn-circle" onClick={() => { setIsEditingUpi(true); setTempUpiId(doctorData.upiId); }} title="Edit UPI ID">
                                    <Pencil size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="info-section">
                        <div className="info-grid">
                            <div className="form-group">
                                <label>First Name</label>
                                <input 
                                    type="text" 
                                    name="firstName" 
                                    value={doctorData.firstName} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input 
                                    type="text" 
                                    name="lastName" 
                                    value={doctorData.lastName} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input 
                                    type="text" 
                                    name="phone" 
                                    value={doctorData.phone} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Registration Number</label>
                                <input 
                                    type="text" 
                                    name="registrationNumber" 
                                    value={doctorData.registrationNumber} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Specialization (Comma separated)</label>
                                <input 
                                    type="text" 
                                    name="specialization" 
                                    value={doctorData.specialization} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Education</label>
                                <input 
                                    type="text" 
                                    name="education" 
                                    value={doctorData.education} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Designation</label>
                                <input 
                                    type="text" 
                                    name="designation" 
                                    value={doctorData.designation} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Experience (Years)</label>
                                <input 
                                    type="number" 
                                    name="experience" 
                                    value={doctorData.experience} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Consultation Price (₹)</label>
                                <input 
                                    type="number" 
                                    name="price" 
                                    value={doctorData.price} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Age</label>
                                <input 
                                    type="number" 
                                    name="age" 
                                    value={doctorData.age} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Gender</label>
                                <select 
                                    name="gender" 
                                    value={doctorData.gender} 
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
                                    value={doctorData.zipCode} 
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

            {/* Zoom Modal */}
            {zoomImage && (
                <div 
                    className="image-zoom-overlay" 
                    onClick={() => setZoomImage(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out' }}
                >
                    <img 
                        src={currentProfilePic} 
                        alt="Enlarged Profile" 
                        style={{ maxWidth: '90%', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', objectFit: 'contain' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default DoctorProfile;
