import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { authFetch } from '../../utils/authFetch';

const AdminAuditLogs = () => {
    const { auth } = useContext(AuthContext);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await authFetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/auth/admin/audit-logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLogs(data);
            } else {
                setError("Failed to fetch audit logs.");
            }
        } catch (err) {
            setError("Error fetching logs.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p style={{ textAlign: "center", marginTop: "200px" }}>Loading logs...</p>;
    if (error) return <p style={{ textAlign: "center", marginTop: "200px", color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: '25px', maxWidth: '1000px', margin: '165px auto 25px auto', background: 'white', borderRadius: '15px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Admin Audit Logs</h2>
            
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '12px' }}>Timestamp</th>
                            <th style={{ padding: '12px' }}>Admin</th>
                            <th style={{ padding: '12px' }}>Action</th>
                            <th style={{ padding: '12px' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? logs.map((log) => (
                            <tr key={log._id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '12px', whiteSpace: 'nowrap', color: '#555' }}>
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {log.adminId ? `${log.adminId.firstName} ${log.adminId.lastName}` : "Unknown"}
                                </td>
                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#8f9f6d' }}>
                                    {log.action}
                                </td>
                                <td style={{ padding: '12px', color: '#333' }}>
                                    {log.details}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>
                                    No logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminAuditLogs;
