import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminProfile = () => {
    const { auth, setAuth } = useContext(AuthContext);
    const navigate = useNavigate();

    const [profileForm, setProfileForm] = useState({
        firstName: auth.user?.firstName || '',
        lastName: auth.user?.lastName || '',
        phone: auth.user?.phone || '',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showSignOutPopup, setShowSignOutPopup] = useState(false);

    // Eye Icon States
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const EyeIcon = ({ show, toggle }) => (
        <button type="button" tabIndex="-1" onClick={toggle} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#666', padding: 0, display: 'flex', alignItems: 'center' }}>
            {show ? (
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755l.192.195z"/>
                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                </svg>
            ) : (
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                </svg>
            )}
        </button>
    );

    const handleSignOut = () => {
        setAuth({ token: null, user: null, role: 'guest' });
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/signin");
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/auth/admin/update-profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(profileForm)
            });
            const data = await response.json();
            if (response.ok) {
                alert("Profile updated successfully!");
                // Update Context
                setAuth({ ...auth, user: data.user });
            } else {
                alert(data.message || "Failed to update profile");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating profile");
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return alert("New passwords do not match!");
        }
        setPasswordLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/auth/admin/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            const data = await response.json();
            if (response.ok) {
                alert("Password changed successfully! Please log in again.");
                // Log them out
                setAuth({ token: null, user: null, role: 'guest' });
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                navigate("/signin");
            } else {
                alert(data.message || "Failed to change password");
            }
        } catch (err) {
            console.error(err);
            alert("Error changing password");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '850px', margin: '100px auto 20px auto', background: 'white', borderRadius: '15px' }}>
            <style>{`
                input[type="password"]::-ms-reveal,
                input[type="password"]::-ms-clear {
                    display: none;
                }
            `}</style>
            
            {showSignOutPopup && (
                <div style={{
                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000
                }}>
                    <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "300px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", textAlign: "center" }}>
                        <h3 style={{ marginTop: 0, color: "#333" }}>Sign Out</h3>
                        <p style={{ color: "#666", marginBottom: "20px" }}>Are you sure you want to sign out?</p>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                            <button type="button" onClick={() => setShowSignOutPopup(false)} style={{ flex: 1, padding: "10px", border: "1px solid #ccc", background: "white", color: "#333", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
                            <button type="button" onClick={handleSignOut} style={{ flex: 1, padding: "10px", background: "#d9534f", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Sign Out</button>
                        </div>
                    </div>
                </div>
            )}

            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Admin Profile</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
                {/* Profile Details Form */}
                <div style={{ flex: '1 1 350px', background: '#f8f9fa', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#333', marginBottom: '15px' }}>Update Details</h3>
                    <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'black', textAlign: 'left', fontSize: '14px' }}>First Name</label>
                                <input 
                                    type="text" 
                                    value={profileForm.firstName} 
                                    onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', color: 'black' }}
                                    required
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'black', textAlign: 'left', fontSize: '14px' }}>Last Name</label>
                                <input 
                                    type="text" 
                                    value={profileForm.lastName} 
                                    onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', color: 'black' }}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'black', textAlign: 'left', fontSize: '14px' }}>Phone Number</label>
                            <input 
                                type="text" 
                                value={profileForm.phone} 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^[0-9]+$/.test(val)) {
                                        setProfileForm({...profileForm, phone: val});
                                    }
                                }}
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', color: 'black' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'black', textAlign: 'left', fontSize: '14px' }}>Email Address</label>
                            <input 
                                type="email" 
                                value={auth.user?.email || ''} 
                                disabled
                                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', background: '#e9ecef', boxSizing: 'border-box', color: '#666' }}
                            />
                        </div>
                        <button disabled={profileLoading} type="submit" style={{ padding: '12px', background: '#8f9f6d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>
                            {profileLoading ? "Updating..." : "Save Details"}
                        </button>
                    </form>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                        <button type="button" onClick={() => setShowPasswordForm(!showPasswordForm)} style={{ flex: 1, padding: '10px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                            {showPasswordForm ? "Hide Password Form" : "Change Password"}
                        </button>
                        <button type="button" onClick={() => setShowSignOutPopup(true)} style={{ flex: 1, padding: '10px', background: '#d9534f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Change Password Form */}
                {showPasswordForm && (
                    <div style={{ flex: '1 1 300px', background: '#f8f9fa', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0, color: '#333', marginBottom: '15px' }}>Change Password</h3>
                        <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'black', textAlign: 'left', fontSize: '14px' }}>Current Password</label>
                                <input 
                                    type={showCurrentPassword ? "text" : "password"} 
                                    value={passwordForm.currentPassword} 
                                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                                    style={{ width: '100%', padding: '10px', paddingRight: '40px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', color: 'black' }}
                                    required
                                />
                                <EyeIcon show={showCurrentPassword} toggle={() => setShowCurrentPassword(!showCurrentPassword)} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'black', textAlign: 'left', fontSize: '14px' }}>New Password</label>
                                <input 
                                    type={showNewPassword ? "text" : "password"} 
                                    value={passwordForm.newPassword} 
                                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                    style={{ width: '100%', padding: '10px', paddingRight: '40px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', color: 'black' }}
                                    required
                                />
                                <EyeIcon show={showNewPassword} toggle={() => setShowNewPassword(!showNewPassword)} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'black', textAlign: 'left', fontSize: '14px' }}>Confirm New Password</label>
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    value={passwordForm.confirmPassword} 
                                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                    style={{ width: '100%', padding: '10px', paddingRight: '40px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', color: 'black' }}
                                    required
                                />
                                <EyeIcon show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                            </div>
                            <button disabled={passwordLoading} type="submit" style={{ padding: '12px', background: '#8f9f6d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                                {passwordLoading ? "Changing..." : "Change Password"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProfile;
