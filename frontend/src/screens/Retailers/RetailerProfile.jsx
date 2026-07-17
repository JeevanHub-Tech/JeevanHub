import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import defaultProfilePic from '../../media/default-profile.png';
import { Camera } from 'lucide-react';
import '../Patients/PatientProfile.css'; // Reusing the premium styling from PatientProfile
import { BACKEND_URL } from '../../config';

const RetailerProfile = () => {
    const { auth, setAuth, logout, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [retailerData, setRetailerData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        profileImage: ''
    });

    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const fetchRetailerData = async () => {
            try {
                const response = await axios.get(
                    `${BACKEND_URL || 'http://localhost:8080'}/api/retailers/getSingleRetailer/${auth.user?.id}`,
                    { headers: { Authorization: `Bearer ${auth.token}` } }
                );
                
                const data = response.data;

                setRetailerData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    profileImage: data.profileImage || ''
                });
            } catch (error) {
                console.error("Error fetching retailer data:", error);
                alert("Failed to load profile details.");
            }
        };

        // Wait for AuthContext's bootstrap check to settle -- right after a hard
        // refresh auth.user is legitimately null for a moment, and redirecting
        // here before that resolves bounces a logged-in user off this page.
        if (authLoading) return;

        if (auth.token && auth.user?.id) {
            fetchRetailerData();
        } else {
            navigate('/signin');
        }
    }, [auth, authLoading, navigate]);

    const handleInputChange = (e) => {
        setRetailerData({ ...retailerData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const payload = {
                firstName: retailerData.firstName,
                lastName: retailerData.lastName,
                email: retailerData.email,
                phone: retailerData.phone,
                address: retailerData.address,
                profileImage: retailerData.profileImage
            };

            const response = await axios.put(
                `${BACKEND_URL || 'http://localhost:8080'}/api/retailers/updateRetailer/${auth.user.id}`,
                payload,
                { headers: { Authorization: `Bearer ${auth.token}` } }
            );

            alert("Profile updated successfully!");
            
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

            if (res.data.imageUrl) {
                const newImageUrl = res.data.imageUrl;
                setRetailerData({ ...retailerData, profileImage: newImageUrl });
                
                await axios.put(
                    `${BACKEND_URL || 'http://localhost:8080'}/api/retailers/updateRetailer/${auth.user.id}`,
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

    return (
        <div className="premium-profile-wrapper">
            <div className="premium-profile-container">
                {/* Left Sidebar */}
                <div className="profile-sidebar">
                    <div className="profile-image-container">
                        <img 
                            src={retailerData.profileImage || defaultProfilePic} 
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
                    <h3 className="profile-name">{retailerData.firstName} {retailerData.lastName}</h3>
                    <p className="profile-email">{retailerData.email}</p>
                    <div className="sidebar-actions">
                        <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
                    </div>
                </div>

                {/* Main Panel */}
                <div className="profile-main-panel">
                    <div className="panel-header">
                        <h2>Retailer Information</h2>
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
                                    value={retailerData.firstName} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input 
                                    type="text" 
                                    name="lastName" 
                                    value={retailerData.lastName} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input 
                                    type="text" 
                                    name="phone" 
                                    value={retailerData.phone} 
                                    onChange={handleInputChange} 
                                    disabled={!isEditing} 
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Business Address</label>
                                <input 
                                    type="text" 
                                    name="address" 
                                    value={retailerData.address} 
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

export default RetailerProfile;
