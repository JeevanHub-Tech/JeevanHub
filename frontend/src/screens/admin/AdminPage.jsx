import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
	const navigate = useNavigate();
	const { auth } = useContext(AuthContext);

	let sections = [
		{ name: 'Patient Management', path: '/admin/users' },
		{ name: 'Doctor Management', path: '/admin/consultations' },
		{ name: 'Retailer Management', path: '/admin/medicine-orders' },
		{ name: 'Transactions', path: '/admin/transactions' },
		{ name: 'Blogs', path: '/admin/blogs' }
	];

	if (auth.user?.permissions?.manageAdmins) {
		sections.push({ name: 'Admin Management', path: '/admin/management' });
		sections.push({ name: 'Audit Logs', path: '/admin/audit-logs' });
	}

	return (
		<div style={{ textAlign: 'center', marginTop: '165px', padding: "25px", boxSizing: "border-box", margin: "165px auto 25px auto", maxWidth: "95%", background:"white", borderRadius:"15px" }}>
			<h1>Admin Dashboard</h1>
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '20px' }}>
				{sections.map((section, index) => (
					<div
						key={index}
						style={{
							padding: '20px',
							backgroundColor: '#f8f9fa',
							borderRadius: '10px',
							cursor: 'pointer',
							boxShadow: '0px 4px 6px rgba(0,0,0,0.1)'
						}}
						onClick={() => navigate(section.path)}
					>
						<h3>{section.name}</h3>
					</div>
				))}
			</div>
		</div>
	);
};

export default AdminDashboard;
