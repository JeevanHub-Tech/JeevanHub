import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { authFetch } from '../../utils/authFetch';
import { BACKEND_URL } from '../../config';

const AdminManagement = () => {
    const { auth } = useContext(AuthContext);
    const [admins, setAdmins] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    // Filters and Sorting State
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterReset, setFilterReset] = useState("all");
    const [sortBy, setSortBy] = useState("date_desc");
    const [filterPermissions, setFilterPermissions] = useState({
        manageAdmins: false, manageUsers: false, manageDoctors: false, 
        manageRetailers: false, manageTransactions: false, manageBlogs: false
    });

    // Register Modal State
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [adminForm, setAdminForm] = useState({
        firstName: "", lastName: "", email: "", phone: "", password: "", permissions: { manageAdmins: false, manageUsers: false, manageDoctors: false, manageRetailers: false, manageTransactions: false, manageBlogs: false }
    });
    const [adminExistsInfo, setAdminExistsInfo] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Edit Permissions Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [editPermissions, setEditPermissions] = useState({});

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({ show: false, title: "", message: "", onConfirm: null });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await authFetch(`${BACKEND_URL}/api/auth/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAdmins(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- REGISTRATION LOGIC ---
    const handleAdminEmailBlur = async () => {
        if (!adminForm.email) return;
        try {
            const token = localStorage.getItem("token");
            const response = await authFetch(`${BACKEND_URL}/api/auth/admin/check-email/${adminForm.email}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.exists) {
                setAdminExistsInfo(data);
                if (data.role === 'admin') alert("This email is already an Admin!");
            } else {
                setAdminExistsInfo(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAdminRegister = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const response = await authFetch(`${BACKEND_URL}/api/auth/admin/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(adminForm)
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.promoted ? "User successfully promoted to Admin!" : "Admin created successfully!");
                setShowRegisterModal(false);
                setAdminForm({ firstName: "", lastName: "", email: "", phone: "", password: "", permissions: { manageAdmins: false, manageUsers: false, manageDoctors: false, manageRetailers: false, manageTransactions: false, manageBlogs: false } });
                setAdminExistsInfo(null);
                fetchAdmins();
            } else {
                alert(data.message || "Failed to create admin");
            }
        } catch (err) {
            console.error(err);
            alert("Error registering admin");
        }
    };

    const toggleAdminFormPermission = (key) => {
        setAdminForm(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));
    };

    const toggleAllAdminFormPermissions = () => {
        const allChecked = Object.values(adminForm.permissions).every(Boolean);
        const newState = {};
        for (const key in adminForm.permissions) {
            newState[key] = !allChecked;
        }
        setAdminForm(prev => ({ ...prev, permissions: newState }));
    };

    const handleCopyPassword = (e) => {
        e.preventDefault();
        if (adminForm.password) {
            navigator.clipboard.writeText(adminForm.password);
            alert("Password copied to clipboard!");
        }
    };

    // --- UPDATE STATUS / PERMISSIONS LOGIC ---
    const executeUpdateStatus = async (adminId, payload) => {
        try {
            const token = localStorage.getItem("token");
            const response = await authFetch(`${BACKEND_URL}/api/auth/admin/update-status/${adminId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok) {
                if (showEditModal) setShowEditModal(false);
                setConfirmModal({ show: false, title: "", message: "", onConfirm: null });
                fetchAdmins();
            } else {
                alert(data.message || "Update failed");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating admin.");
        }
    };

    const handleDeleteAdmin = async (adminId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await authFetch(`${BACKEND_URL}/api/auth/admin/${adminId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                setConfirmModal({ show: false, title: "", message: "", onConfirm: null });
                fetchAdmins();
            } else {
                const data = await response.json();
                alert(data.message || "Delete failed");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting admin.");
        }
    };

    const openConfirmModal = (title, message, onConfirm) => {
        setConfirmModal({ show: true, title, message, onConfirm });
    };

    const openEditModal = (admin) => {
        setEditingAdmin(admin);
        setEditPermissions(admin.permissions || { manageAdmins: false, manageUsers: false, manageDoctors: false, manageRetailers: false, manageTransactions: false, manageBlogs: false });
        setShowEditModal(true);
    };

    const toggleEditPermission = (key) => {
        setEditPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleFilterPermission = (key) => {
        setFilterPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Filter & Sort Logic
    const getProcessedAdmins = () => {
        let result = [...admins];

        // 1. Search Query
        if (searchQuery) {
            result = result.filter(admin => {
                const full = `${admin.firstName} ${admin.lastName} ${admin.email}`.toLowerCase();
                return full.includes(searchQuery.toLowerCase());
            });
        }

        // 2. Status Filter
        if (filterStatus !== "all") {
            result = result.filter(admin => filterStatus === "active" ? admin.isActive : !admin.isActive);
        }

        // 3. Reset Request Filter
        if (filterReset !== "all") {
            result = result.filter(admin => filterReset === "requested" ? admin.forcePasswordReset : !admin.forcePasswordReset);
        }

        // 4. Permissions Filter (Admin must have ALL checked permissions)
        const requiredPermissions = Object.keys(filterPermissions).filter(key => filterPermissions[key]);
        if (requiredPermissions.length > 0) {
            result = result.filter(admin => {
                return requiredPermissions.every(key => admin.permissions && admin.permissions[key]);
            });
        }

        // 5. Sorting
        result.sort((a, b) => {
            if (sortBy === 'name_asc') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
            if (sortBy === 'name_desc') return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
            if (sortBy === 'login_desc') return new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0);
            if (sortBy === 'login_asc') return new Date(a.lastLogin || 0) - new Date(b.lastLogin || 0);
            if (sortBy === 'date_asc') return a._id > b._id ? 1 : -1; 
            if (sortBy === 'date_desc') return a._id < b._id ? 1 : -1;
            return 0;
        });

        return result;
    };

    const processedAdmins = getProcessedAdmins();

    if (loading) return <p style={{ textAlign: "center", marginTop: "200px" }}>Loading admins...</p>;

    return (
        <div style={{ padding: '25px', maxWidth: '1400px', margin: '165px auto 25px auto', background: 'white', borderRadius: '15px', boxSizing: 'border-box' }}>
            <style>{`
                input[type="password"]::-ms-reveal,
                input[type="password"]::-ms-clear {
                    display: none;
                }
            `}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 style={{ margin: 0, color: '#333' }}>Admin Management</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ height: '45px', padding: '0 15px', boxSizing: 'border-box', borderRadius: '5px', border: '1px solid #ccc', width: '250px', margin: 0, outline: 'none' }}
                    />
                    <button onClick={() => setShowFilters(!showFilters)} style={{ height: '45px', padding: '0 20px', boxSizing: 'border-box', background: showFilters ? '#e2e8d5' : 'white', color: '#8f9f6d', border: '2px solid #8f9f6d', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', margin: 0 }}>
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
                            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
                        </svg>
                        Filter & Sort
                    </button>
                    <button onClick={() => setShowRegisterModal(true)} style={{ height: '45px', padding: '0 20px', boxSizing: 'border-box', background: '#8f9f6d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
                        + Register New Admin
                    </button>
                </div>
            </div>

            {/* FILTER & SORT PANEL */}
            {showFilters && (
                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
                        {/* Sort */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <strong style={{ fontSize: '14px', color: '#333' }}>Sort By:</strong>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}>
                                <option value="date_desc">Date Added (Newest)</option>
                                <option value="date_asc">Date Added (Oldest)</option>
                                <option value="login_desc">Last Login (Recent)</option>
                                <option value="login_asc">Last Login (Oldest)</option>
                                <option value="name_asc">Name (A-Z)</option>
                                <option value="name_desc">Name (Z-A)</option>
                            </select>
                        </div>

                        {/* Status Filters */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <strong style={{ fontSize: '14px', color: '#333' }}>Account Status:</strong>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}>
                                <option value="all">All</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <strong style={{ fontSize: '14px', color: '#333' }}>Reset Requests:</strong>
                            <select value={filterReset} onChange={(e) => setFilterReset(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}>
                                <option value="all">All</option>
                                <option value="requested">Reset Requested</option>
                                <option value="not_requested">No Reset Pending</option>
                            </select>
                        </div>
                    </div>

                    {/* Permissions Filter */}
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <strong style={{ fontSize: '14px', color: '#333' }}>Filter by Required Permissions:</strong>
                            <button onClick={() => setFilterPermissions({manageAdmins: false, manageUsers: false, manageDoctors: false, manageRetailers: false, manageTransactions: false, manageBlogs: false})} style={{ background: 'transparent', border: '1px solid #dc3545', color: '#dc3545', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                Clear Permissions Filter
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                            {Object.keys(filterPermissions).map(key => (
                                <label key={key} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: "#444", background: filterPermissions[key] ? '#e2e8d5' : 'white', padding: '6px 12px', borderRadius: '20px', border: filterPermissions[key] ? '1px solid #8f9f6d' : '1px solid #ccc' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={filterPermissions[key]} 
                                        onChange={() => toggleFilterPermission(key)} 
                                        style={{ display: 'none' }}
                                    />
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '12px', width: '20%' }}>Name</th>
                            <th style={{ padding: '12px', width: '30%' }}>Email</th>
                            <th style={{ padding: '12px', width: '9%' }}>Status</th>
                            <th style={{ padding: '12px', width: '13%' }}>Last Login</th>
                            <th style={{ padding: '12px', width: '28%' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedAdmins.length > 0 ? processedAdmins.map((admin) => (
                            <tr key={admin._id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '12px', color: '#333', fontWeight: '500', wordWrap: 'break-word' }}>{admin.firstName} {admin.lastName}</td>
                                <td style={{ padding: '12px', color: '#666', wordBreak: 'break-all' }}>{admin.email}</td>
                                <td style={{ padding: '12px' }}>
                                    {admin.isActive ? (
                                        <span style={{ background: '#d4edda', color: '#155724', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Active</span>
                                    ) : (
                                        <span style={{ background: '#f8d7da', color: '#721c24', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Inactive</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                                    {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "Never"}
                                </td>
                                <td style={{ padding: '12px', display: 'flex', gap: '10px', flexWrap: 'nowrap', alignItems: 'center' }}>
                                    <button 
                                        onClick={() => openEditModal(admin)} 
                                        title="View or modify this admin's permissions"
                                        style={{ width: '110px', padding: '6px 0', background: 'transparent', color: '#8f9f6d', border: '1px solid #8f9f6d', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}
                                    >
                                        Permissions
                                    </button>
                                    <button 
                                        onClick={() => openConfirmModal(
                                            `${admin.isActive ? "Deactivate" : "Activate"} Admin`, 
                                            `Are you sure you want to ${admin.isActive ? "deactivate" : "activate"} ${admin.email}?`, 
                                            () => executeUpdateStatus(admin._id, { isActive: !admin.isActive })
                                        )} 
                                        title="Toggle the active status of this admin"
                                        style={{ width: '90px', padding: '6px 0', background: admin.isActive ? '#dc3545' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}
                                    >
                                        {admin.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                    <button 
                                        onClick={() => openConfirmModal(
                                            admin.forcePasswordReset ? "Cancel Reset" : "Force Reset",
                                            `Are you sure you want to toggle forced password reset for ${admin.email}?`,
                                            () => executeUpdateStatus(admin._id, { forcePasswordReset: !admin.forcePasswordReset })
                                        )} 
                                        title="Require the user to change their password on next login"
                                        style={{ width: '100px', padding: '6px 0', background: admin.forcePasswordReset ? '#ffc107' : '#17a2b8', color: admin.forcePasswordReset ? 'black' : 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}
                                    >
                                        {admin.forcePasswordReset ? "Cancel Reset" : "Force Reset"}
                                    </button>
                                    <button 
                                        onClick={() => openConfirmModal(
                                            "Delete Admin",
                                            `Are you sure you want to PERMANENTLY DELETE ${admin.email}? This action cannot be undone.`,
                                            () => handleDeleteAdmin(admin._id)
                                        )} 
                                        style={{ padding: '6px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Permanently delete this admin account"
                                    >
                                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>
                                    No admins found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* REGISTER ADMIN MODAL */}
            {showRegisterModal && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
                    <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "450px", boxSizing: "border-box", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
                        <h3 style={{ marginTop: 0, textAlign: "left", color: "#333" }}>Register New Admin</h3>
                        <form onSubmit={handleAdminRegister} style={{ display: "flex", flexDirection: "column", gap: "15px", color: "black", textAlign: "left" }}>
                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <input type="text" placeholder="First Name" style={{ flex: 1, minWidth: 0, padding: "10px", border: "1px solid #ccc", borderRadius: "5px", boxSizing: 'border-box' }} value={adminForm.firstName} onChange={e => setAdminForm({...adminForm, firstName: e.target.value})} required />
                                <input type="text" placeholder="Last Name" style={{ flex: 1, minWidth: 0, padding: "10px", border: "1px solid #ccc", borderRadius: "5px", boxSizing: 'border-box' }} value={adminForm.lastName} onChange={e => setAdminForm({...adminForm, lastName: e.target.value})} required />
                            </div>
                            <input type="email" placeholder="Email" style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px", boxSizing: 'border-box' }} value={adminForm.email} onBlur={handleAdminEmailBlur} onChange={e => setAdminForm({...adminForm, email: e.target.value})} required />
                            
                            {adminExistsInfo && adminExistsInfo.role !== 'admin' && (
                                <div style={{ color: "#0056b3", fontSize: "13px", background: "#e7f1ff", padding: "10px", borderRadius: "5px" }}>
                                    <strong>Note:</strong> An existing {adminExistsInfo.role} account was found. They will be promoted.
                                </div>
                            )}
                            
                            <input 
                                type="text" 
                                placeholder="Phone (Optional)" 
                                style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "5px", boxSizing: 'border-box' }} 
                                value={adminForm.phone} 
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === "" || /^[0-9]+$/.test(val)) {
                                        setAdminForm({...adminForm, phone: val});
                                    }
                                }} 
                            />
                            
                            {!(adminExistsInfo && adminExistsInfo.role !== 'admin') && (
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '5px', overflow: 'hidden' }}>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Temporary Password" 
                                        style={{ flex: 1, padding: "10px", border: "none", outline: "none", boxSizing: 'border-box' }} 
                                        value={adminForm.password} 
                                        onChange={e => setAdminForm({...adminForm, password: e.target.value})} 
                                        required 
                                    />
                                    <button type="button" title="Toggle Visibility" onClick={() => setShowPassword(!showPassword)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 10px', color: '#666', display: 'flex', alignItems: 'center' }}>
                                        {showPassword ? (
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
                                    <button type="button" title="Copy Password" onClick={handleCopyPassword} style={{ background: '#f4f4f4', border: 'none', borderLeft: '1px solid #ccc', cursor: 'pointer', padding: '0 12px', height: '100%', color: '#333', display: 'flex', alignItems: 'center' }}>
                                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                        </svg>
                                    </button>
                                </div>
                            )}

                            <div style={{ marginTop: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <strong style={{ fontSize: '14px', color: '#333' }}>Initial Permissions:</strong>
                                    <button type="button" onClick={toggleAllAdminFormPermissions} style={{ background: 'transparent', border: '1px solid #8f9f6d', color: '#8f9f6d', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                        Toggle All
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {Object.keys(adminForm.permissions).map(key => (
                                        <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#555" }}>
                                            <input 
                                                type="checkbox" 
                                                checked={adminForm.permissions[key]} 
                                                onChange={() => toggleAdminFormPermission(key)} 
                                            />
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "15px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
                                <button type="button" onClick={() => setShowRegisterModal(false)} style={{ padding: "10px 15px", border: "1px solid #ccc", background: "white", color: "#333", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
                                <button type="submit" disabled={adminExistsInfo && adminExistsInfo.role === 'admin'} style={{ padding: "10px 15px", background: "#8f9f6d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT PERMISSIONS MODAL */}
            {showEditModal && editingAdmin && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
                    <div style={{ background: "white", padding: "30px", borderRadius: "10px", width: "400px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                        <h3 style={{ marginTop: 0, textAlign: "left", color: "#333" }}>Edit Permissions</h3>
                        <p style={{ color: "#666", marginBottom: "20px", fontSize: "14px" }}>Manage access for {editingAdmin.firstName} {editingAdmin.lastName}</p>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "20px" }}>
                            {Object.keys(editPermissions).map(key => (
                                <label key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontWeight: "500", color: "#333" }}>
                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    <input 
                                        type="checkbox" 
                                        checked={editPermissions[key]} 
                                        onChange={() => toggleEditPermission(key)} 
                                        style={{ transform: "scale(1.2)" }}
                                    />
                                </label>
                            ))}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: "10px 15px", border: "1px solid #ccc", background: "white", color: "#333", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
                            <button onClick={() => executeUpdateStatus(editingAdmin._id, { permissions: editPermissions })} style={{ padding: "10px 15px", background: "#8f9f6d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM CONFIRMATION MODAL */}
            {confirmModal.show && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 3000 }}>
                    <div style={{ background: "white", padding: "25px", borderRadius: "10px", width: "350px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                        <h3 style={{ marginTop: 0, color: "#333" }}>{confirmModal.title}</h3>
                        <p style={{ color: "#555", fontSize: "15px", marginBottom: "25px", lineHeight: "1.5" }}>{confirmModal.message}</p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button onClick={() => setConfirmModal({ show: false, title: "", message: "", onConfirm: null })} style={{ padding: "8px 15px", border: "1px solid #ccc", background: "white", color: "#333", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                                Cancel
                            </button>
                            <button onClick={confirmModal.onConfirm} style={{ padding: "8px 15px", background: confirmModal.title.includes("Delete") ? "#dc3545" : "#8f9f6d", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
