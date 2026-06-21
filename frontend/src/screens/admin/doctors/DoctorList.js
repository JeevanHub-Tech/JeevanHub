import React, { useState, useEffect } from "react";
import "./DoctorList.css";
import { useNavigate } from "react-router-dom";
import {
	User,
	Mail,
	Phone,
	Stethoscope,
	Trash2,
	Pencil,
	Search,
	ArrowLeft,
	X,
	MapPin,
	Award,
	SearchIcon,
	Upload,
	Download,
	CheckSquare,
	Filter,
	ArrowUpDown,
	Clock,
	Star,
	Info,
	AlertTriangle,
	CheckCircle
} from "lucide-react";

const DoctorManagement = () => {
	const [doctors, setDoctors] = useState([]);
	const [loadingDoctors, setLoadingDoctors] = useState(true);
	
	// Filtering and Search State
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("All");
	const [specializationFilter, setSpecializationFilter] = useState("All");
	const [genderFilter, setGenderFilter] = useState("All");
	const [priceFilter, setPriceFilter] = useState("All");
	
	// Sorting State
	const [sortBy, setSortBy] = useState("date_desc");
	
	// Pagination State
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	
	// Bulk Actions State
	const [selectedDoctors, setSelectedDoctors] = useState([]);
	
	// Modals State
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [doctorToEdit, setDoctorToEdit] = useState(null);
	const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
	const [isUploadReportOpen, setIsUploadReportOpen] = useState(false);
	const [uploadReport, setUploadReport] = useState(null);

	const navigate = useNavigate();

	const fetchAllDoctors = async () => {
		try {
			const token = localStorage.getItem("token") || "";
			const res = await fetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/doctors/allDoctors`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!res.ok) {
				if (res.status === 404) {
					setDoctors([]);
					return;
				}
				throw new Error("Failed to fetch doctors");
			}

			const data = await res.json();
			setDoctors(data);
		} catch (error) {
			console.error("❌ Error fetching doctors:", error);
		} finally {
			setLoadingDoctors(false);
		}
	};

	useEffect(() => {
		fetchAllDoctors();
	}, []);

	// --- Processed Doctors Logic (Search -> Filter -> Sort) ---
	const getProcessedDoctors = () => {
		let result = [...doctors];

		// 1. Search Query
		if (search) {
			const q = search.toLowerCase();
			result = result.filter(d => {
				const specStr = Array.isArray(d.specialization) ? d.specialization.join(" ").toLowerCase() : "";
				return (d.firstName && d.firstName.toLowerCase().includes(q)) ||
					   (d.lastName && d.lastName.toLowerCase().includes(q)) ||
					   (d.email && d.email.toLowerCase().includes(q)) ||
					   specStr.includes(q);
			});
		}

		// 2. Filters
		if (statusFilter === "ActiveToday") {
			const todayStart = new Date();
			todayStart.setHours(0, 0, 0, 0);
			result = result.filter(d => d.lastLogin && new Date(d.lastLogin) >= todayStart);
		} else if (statusFilter !== "All") {
			result = result.filter(d => d.approvalStatus === statusFilter);
		}
		
		if (specializationFilter !== "All") {
			result = result.filter(d => {
				if (!d.specialization) return false;
				return Array.isArray(d.specialization) 
					? d.specialization.includes(specializationFilter)
					: d.specialization === specializationFilter;
			});
		}
		
		if (genderFilter !== "All") {
			result = result.filter(d => d.gender === genderFilter);
		}

		if (priceFilter !== "All") {
			result = result.filter(d => {
				if (!d.price) return false;
				if (priceFilter === "<500") return d.price < 500;
				if (priceFilter === "500-1000") return d.price >= 500 && d.price <= 1000;
				if (priceFilter === ">1000") return d.price > 1000;
				return true;
			});
		}

		// 3. Sorting
		result.sort((a, b) => {
			if (sortBy === 'name_asc') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
			if (sortBy === 'name_desc') return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
			if (sortBy === 'exp_desc') return (b.experience || 0) - (a.experience || 0);
			if (sortBy === 'exp_asc') return (a.experience || 0) - (b.experience || 0);
			if (sortBy === 'activity_desc') return new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0);
			if (sortBy === 'activity_asc') return new Date(a.lastLogin || 0) - new Date(b.lastLogin || 0);
			if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
			if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
			if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
			return 0; // Default (date_desc implied by DB returned order)
		});

		return result;
	};

	const processedDoctors = getProcessedDoctors();
	
	// Pagination Logic
	const totalPages = Math.ceil(processedDoctors.length / itemsPerPage);
	const paginatedDoctors = processedDoctors.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	// Reset page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [search, statusFilter, specializationFilter, genderFilter, priceFilter, sortBy]);

	// --- Event Handlers ---
	const handleRowClick = (id) => navigate(`/admin/consultations/${id}`);

	const handleEditClick = (e, doctor) => {
		e.stopPropagation();
		setDoctorToEdit(doctor);
		setIsEditModalOpen(true);
	};

	const handleDeleteClick = async (e, id) => {
		e.stopPropagation();
		if (window.confirm("Are you sure you want to delete this doctor?")) {
			try {
				const token = localStorage.getItem("token") || "";
				const res = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/doctors/${id}`, {
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` }
				});
				if (res.ok) {
					setDoctors(doctors.filter((d) => d._id !== id));
					setSelectedDoctors(prev => prev.filter(selectedId => selectedId !== id));
				} else {
					alert("Failed to delete doctor.");
				}
			} catch (error) {
				console.error("Error deleting doctor:", error);
			}
		}
	};

	const handleFileUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const formData = new FormData();
		formData.append("file", file);

		try {
			const token = localStorage.getItem("token") || "";
			const res = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/doctors/upload`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			});
			const data = await res.json();
			if (res.ok) {
				setUploadReport(data);
				setIsUploadReportOpen(true);
				
				// Download the auto-generated credentials if any
				if (data.generatedCredentials && data.generatedCredentials.length > 0) {
					const csvRows = ["Email,Temporary Password"];
					data.generatedCredentials.forEach(cred => {
						csvRows.push(`"${cred.email}","${cred.tempPassword}"`);
					});
					const csvString = csvRows.join("\n");
					const blob = new Blob([csvString], { type: "text/csv" });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.setAttribute("href", url);
					a.setAttribute("download", "doctor_credentials.csv");
					a.click();
				}

				fetchAllDoctors();
			} else {
				alert(data.message || "Failed to upload.");
			}
		} catch (error) {
			console.error("Upload error:", error);
			alert("Upload error.");
		} finally {
			e.target.value = null;
		}
	};

	const handleSaveChanges = async (updatedDoctor) => {
		try {
			const token = localStorage.getItem("token") || "";
			const res = await fetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/doctors/updateDoctor/${updatedDoctor._id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify(updatedDoctor),
				}
			);
			const data = await res.json();
			if (res.ok && data.success) {
				setDoctors(doctors.map((doc) => doc._id === updatedDoctor._id ? updatedDoctor : doc));
				setIsEditModalOpen(false);
				setDoctorToEdit(null);
			} else {
				alert(data.message || "Failed to update profile");
			}
		} catch (error) {
			console.error("Error updating doctor:", error);
			alert("An error occurred while updating.");
		}
	};

	// --- Bulk Actions & Selection ---
	const toggleSelectAll = () => {
		if (selectedDoctors.length === paginatedDoctors.length) {
			setSelectedDoctors([]);
		} else {
			setSelectedDoctors(paginatedDoctors.map(d => d._id));
		}
	};

	const toggleSelectDoctor = (e, id) => {
		e.stopPropagation();
		setSelectedDoctors(prev => 
			prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
		);
	};

	const handleBulkVerify = async (status) => {
		if (selectedDoctors.length === 0) return;
		if (!window.confirm(`Mark ${selectedDoctors.length} selected doctors as ${status}?`)) return;

		try {
			const token = localStorage.getItem("token") || "";
			const res = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/doctors/bulk-verify`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ doctorIds: selectedDoctors, approvalStatus: status }),
			});
			const data = await res.json();
			if (res.ok) {
				alert(data.message);
				fetchAllDoctors();
				setSelectedDoctors([]);
			} else {
				alert(data.message || "Bulk update failed");
			}
		} catch (error) {
			console.error("Bulk update error:", error);
			alert("An error occurred during bulk update.");
		}
	};

	const handleBulkDelete = async () => {
		if (selectedDoctors.length === 0) return;
		if (!window.confirm(`Are you sure you want to permanently delete ${selectedDoctors.length} selected doctors?`)) return;

		try {
			const token = localStorage.getItem("token") || "";
			const res = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/doctors/bulk-delete`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ doctorIds: selectedDoctors }),
			});
			const data = await res.json();
			if (res.ok) {
				alert(data.message);
				fetchAllDoctors();
				setSelectedDoctors([]);
			} else {
				alert(data.message || "Bulk delete failed");
			}
		} catch (error) {
			console.error("Bulk delete error:", error);
			alert("An error occurred during bulk delete.");
		}
	};

	// --- Export to CSV ---
	const handleExportCSV = () => {
		if (processedDoctors.length === 0) {
			alert("No doctors to export");
			return;
		}
		
		const headers = ["First Name", "Last Name", "Email", "Phone", "Specialization", "Experience", "Price", "Status", "Rating", "Last Login"];
		
		const csvRows = [headers.join(",")];
		
		processedDoctors.forEach(d => {
			const specs = Array.isArray(d.specialization) ? d.specialization.join(" | ") : d.specialization || "";
			const loginDate = d.lastLogin ? new Date(d.lastLogin).toLocaleDateString() : "Never";
			
			const row = [
				`"${d.firstName || ''}"`,
				`"${d.lastName || ''}"`,
				`"${d.email || ''}"`,
				`"${d.phone || ''}"`,
				`"${specs}"`,
				`"${d.experience || 0}"`,
				`"${d.price || 0}"`,
				`"${d.approvalStatus || 'Pending'}"`,
				`"${d.rating ? d.rating.toFixed(1) : 'N/A'}"`,
				`"${loginDate}"`
			];
			csvRows.push(row.join(","));
		});
		
		const csvString = csvRows.join("\n");
		const blob = new Blob([csvString], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.setAttribute("href", url);
		a.setAttribute("download", "doctors_export.csv");
		a.click();
	};

	// --- Metrics Calculations ---
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);

	const metrics = {
		total: doctors.length,
		pending: doctors.filter(d => d.approvalStatus === 'Pending').length,
		approved: doctors.filter(d => d.approvalStatus === 'Approved').length,
		activeToday: doctors.filter(d => d.lastLogin && new Date(d.lastLogin) >= todayStart).length
	};

	const uniqueSpecializations = [
		"All",
		...new Set(
			doctors.flatMap((d) =>
				Array.isArray(d.specialization) && d.specialization.length > 0
					? d.specialization
					: ["Not specified"]
			)
		),
	];

	return (
		<div className="dm-management-container" style={{ paddingBottom: "50px" }}>
			<div className="dm-header">
				<button onClick={() => navigate(-1)} className="dm-back-btn">
					<ArrowLeft size={18} /> Back
				</button>
				<h2>Doctor Management</h2>
			</div>

			{/* Quick Metrics Banner */}
			<div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
				<div onClick={() => setStatusFilter("All")} style={{ flex: 1, minWidth: "150px", padding: "15px", borderRadius: "10px", background: "#f8f9fa", cursor: "pointer", border: statusFilter === "All" ? "2px solid #007bff" : "1px solid #ddd", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "0.2s" }}>
					<h3 style={{ margin: "0", fontSize: "24px", color: "#333" }}>{metrics.total}</h3>
					<p style={{ margin: "5px 0 0", color: "#666", fontSize: "14px", fontWeight: "bold" }}>Total Doctors</p>
				</div>
				<div onClick={() => setStatusFilter("Pending")} style={{ flex: 1, minWidth: "150px", padding: "15px", borderRadius: "10px", background: "#fff3cd", cursor: "pointer", border: statusFilter === "Pending" ? "2px solid #ffc107" : "1px solid #ffeeba", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "0.2s" }}>
					<h3 style={{ margin: "0", fontSize: "24px", color: "#856404" }}>{metrics.pending}</h3>
					<p style={{ margin: "5px 0 0", color: "#856404", fontSize: "14px", fontWeight: "bold" }}>Pending Review</p>
				</div>
				<div onClick={() => setStatusFilter("Approved")} style={{ flex: 1, minWidth: "150px", padding: "15px", borderRadius: "10px", background: "#d4edda", cursor: "pointer", border: statusFilter === "Approved" ? "2px solid #28a745" : "1px solid #c3e6cb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "0.2s" }}>
					<h3 style={{ margin: "0", fontSize: "24px", color: "#155724" }}>{metrics.approved}</h3>
					<p style={{ margin: "5px 0 0", color: "#155724", fontSize: "14px", fontWeight: "bold" }}>Approved</p>
				</div>
				<div onClick={() => setStatusFilter("ActiveToday")} style={{ flex: 1, minWidth: "150px", padding: "15px", borderRadius: "10px", background: "#d1ecf1", cursor: "pointer", border: statusFilter === "ActiveToday" ? "2px solid #17a2b8" : "1px solid #bee5eb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "0.2s" }}>
					<h3 style={{ margin: "0", fontSize: "24px", color: "#0c5460" }}>{metrics.activeToday}</h3>
					<p style={{ margin: "5px 0 0", color: "#0c5460", fontSize: "14px", fontWeight: "bold" }}>Active Today</p>
				</div>
			</div>

			{/* Filters & Sorting Bar */}
			<div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "20px", background: "white", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
				<div className="dm-search-input-wrapper" style={{ flex: "1", minWidth: "250px", margin: 0 }}>
					<SearchIcon className="dm-search-icon" size={20} />
					<input
						type="text"
						placeholder="Search by name, email, or specialization..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						style={{ width: "100%", padding: "10px 10px 10px 40px", border: "1px solid #ddd", borderRadius: "8px" }}
					/>
				</div>
				
				<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
					<option value="All">All Statuses</option>
					<option value="Pending">Pending</option>
					<option value="Approved">Approved</option>
					<option value="Rejected">Rejected</option>
					<option value="ActiveToday">Active Today</option>
				</select>
				
				<select value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd", maxWidth: "200px" }}>
					{uniqueSpecializations.map((spec) => (
						<option key={spec} value={spec}>{spec}</option>
					))}
				</select>

				<select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
					<option value="All">All Genders</option>
					<option value="Male">Male</option>
					<option value="Female">Female</option>
					<option value="Other">Other</option>
				</select>

				<select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
					<option value="All">All Prices</option>
					<option value="<500">Under ₹500</option>
					<option value="500-1000">₹500 - ₹1000</option>
					<option value=">1000">Above ₹1000</option>
				</select>

				<select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}>
					<option value="date_desc">Newest First</option>
					<option value="name_asc">Name (A-Z)</option>
					<option value="name_desc">Name (Z-A)</option>
					<option value="exp_desc">Experience (High to Low)</option>
					<option value="exp_asc">Experience (Low to High)</option>
					<option value="activity_desc">Highest Activity</option>
					<option value="activity_asc">Lowest Activity</option>
					<option value="rating_desc">Highest Rated</option>
					<option value="price_asc">Price (Low to High)</option>
					<option value="price_desc">Price (High to Low)</option>
				</select>
			</div>

			{/* Action Bar (Bulk Actions, Upload, Export) */}
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
				<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
					{selectedDoctors.length > 0 ? (
						<div style={{ display: "flex", gap: "10px", alignItems: "center", background: "#f8f9fa", padding: "8px 15px", borderRadius: "8px", border: "1px solid #ddd" }}>
							<span style={{ fontWeight: "bold" }}>{selectedDoctors.length} selected</span>
							<button onClick={() => handleBulkVerify('Approved')} style={{ background: "#28a745", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Approve</button>
							<button onClick={() => handleBulkVerify('Rejected')} style={{ background: "#ffc107", color: "black", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Reject</button>
							<button onClick={handleBulkDelete} style={{ background: "#dc3545", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Delete</button>
							<button onClick={() => setSelectedDoctors([])} style={{ background: "#6c757d", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}>Clear</button>
						</div>
					) : (
						<span style={{ color: "#666" }}>Select doctors to perform bulk actions</span>
					)}
				</div>

				<div style={{ display: "flex", gap: "10px" }}>
					<button onClick={handleExportCSV} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#6c757d", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>
						<Download size={18} /> Export CSV
					</button>
					
					<label htmlFor="excel-upload" style={{ display: "flex", alignItems: "center", gap: "10px", background: "#007bff", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>
						<Upload size={18} /> Upload Excel
						<div 
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								setIsInfoModalOpen(true);
							}}
							style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: "6px", borderLeft: "1px solid rgba(255,255,255,0.3)", marginLeft: "2px", color: "#e9ecef" }}
							title="View Upload Instructions"
						>
							<Info size={18} />
						</div>
					</label>
					<input 
						type="file" 
						id="excel-upload" 
						accept=".xlsx, .xls, .csv" 
						style={{ display: "none" }} 
						onChange={handleFileUpload} 
					/>
				</div>
			</div>

			<div className="dm-table-wrapper" style={{ overflowX: "auto" }}>
				<table className="dm-management-table" style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
							<th style={{ padding: "15px 10px", width: "40px" }}>
								<input 
									type="checkbox" 
									checked={paginatedDoctors.length > 0 && selectedDoctors.length === paginatedDoctors.length}
									onChange={toggleSelectAll}
									style={{ cursor: "pointer", width: "20px", height: "20px" }}
								/>
							</th>
							<th style={{ padding: "15px 10px", textAlign: "left", color: "#495057" }}>Name</th>
							<th style={{ padding: "15px 10px", textAlign: "left", color: "#495057" }}>Specialization</th>
							<th style={{ padding: "15px 10px", textAlign: "left", color: "#495057" }}>Exp / Price</th>
							<th style={{ padding: "15px 10px", textAlign: "left", color: "#495057" }}>Rating / Activity</th>
							<th style={{ padding: "15px 10px", textAlign: "left", color: "#495057" }}>Status</th>
							<th style={{ padding: "15px 10px", textAlign: "left", color: "#495057" }}>Actions</th>
						</tr>
					</thead>

					<tbody>
						{paginatedDoctors.length > 0 ? (
							paginatedDoctors.map((doctor) => (
								<tr
									key={doctor._id}
									onClick={() => handleRowClick(doctor._id)}
									style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
									className="dm-table-row-hover"
								>
									<td style={{ padding: "15px 10px", width: "40px" }}>
										<input 
											type="checkbox" 
											checked={selectedDoctors.includes(doctor._id)}
											onChange={(e) => toggleSelectDoctor(e, doctor._id)}
											onClick={(e) => e.stopPropagation()}
											style={{ cursor: "pointer", width: "20px", height: "20px" }}
										/>
									</td>
									<td data-label="Name" style={{ padding: "15px 10px" }}>
										<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
											<div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#e9ecef", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#495057" }}>
												{doctor.firstName?.charAt(0) || "D"}
											</div>
											<div>
												<div style={{ fontWeight: "bold", color: "#333" }}>{doctor.firstName} {doctor.lastName}</div>
												<div style={{ fontSize: "12px", color: "#6c757d" }}>{doctor.email}</div>
											</div>
										</div>
									</td>

									<td data-label="Specialization" style={{ padding: "15px 10px", color: "#495057" }}>
										{Array.isArray(doctor.specialization) && doctor.specialization.length > 0
											? (() => {
												const specStr = doctor.specialization.join(", ");
												return specStr.length > 30 ? specStr.slice(0, 30) + "..." : specStr;
											})()
											: "Not specified"}
									</td>

									<td data-label="Exp / Price" style={{ padding: "15px 10px" }}>
										<div style={{ color: "#495057" }}>{doctor.experience || 0} years</div>
										<div style={{ fontSize: "12px", color: "#28a745", fontWeight: "bold" }}>₹{doctor.price || 0}</div>
									</td>
									
									<td data-label="Rating / Activity" style={{ padding: "15px 10px" }}>
										<div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
											<Star size={14} fill={doctor.rating ? "#FFD700" : "none"} color={doctor.rating ? "#FFD700" : "#ccc"} />
											<span style={{ color: "#495057", fontWeight: "bold" }}>{doctor.rating ? doctor.rating.toFixed(1) : "N/A"}</span>
										</div>
										<div style={{ fontSize: "12px", color: "#6c757d", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
											<Clock size={12} /> {doctor.lastLogin ? new Date(doctor.lastLogin).toLocaleDateString() : "Never"}
										</div>
									</td>

									<td data-label="Status" style={{ padding: "15px 10px" }}>
										<span style={{
											padding: "4px 10px",
											borderRadius: "12px",
											fontSize: "12px",
											fontWeight: "bold",
											backgroundColor: doctor.approvalStatus === 'Approved' ? '#d4edda' : doctor.approvalStatus === 'Rejected' ? '#f8d7da' : '#fff3cd',
											color: doctor.approvalStatus === 'Approved' ? '#155724' : doctor.approvalStatus === 'Rejected' ? '#721c24' : '#856404'
										}}>
											{doctor.approvalStatus || 'Pending'}
										</span>
									</td>
									<td data-label="Actions" style={{ padding: "15px 10px" }}>
										<div style={{ display: "flex", gap: "8px" }}>
											<button
												onClick={(e) => handleEditClick(e, doctor)}
												style={{ background: "#f8f9fa", color: "#495057", border: "1px solid #ddd", padding: "6px 10px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
											>
												<Pencil size={14} /> Edit
											</button>
											<button
												onClick={(e) => handleDeleteClick(e, doctor._id)}
												style={{ background: "#dc3545", color: "white", border: "none", padding: "6px 10px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
											>
												<Trash2 size={14} />
											</button>
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#6c757d" }}>
									No doctors found matching the criteria.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", padding: "10px", background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
					<span style={{ color: "#6c757d", fontSize: "14px" }}>
						Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedDoctors.length)} of {processedDoctors.length} doctors
					</span>
					<div style={{ display: "flex", gap: "5px" }}>
						<button 
							onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
							style={{ padding: "8px 16px", background: currentPage === 1 ? "#e9ecef" : "#007bff", color: currentPage === 1 ? "#6c757d" : "white", border: "none", borderRadius: "4px", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
						>
							Previous
						</button>
						
						{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
							<button 
								key={page}
								onClick={() => setCurrentPage(page)}
								style={{ padding: "8px 12px", background: currentPage === page ? "#007bff" : "#f8f9fa", color: currentPage === page ? "white" : "#333", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}
							>
								{page}
							</button>
						))}

						<button 
							onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
							disabled={currentPage === totalPages}
							style={{ padding: "8px 16px", background: currentPage === totalPages ? "#e9ecef" : "#007bff", color: currentPage === totalPages ? "#6c757d" : "white", border: "none", borderRadius: "4px", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
						>
							Next
						</button>
					</div>
				</div>
			)}

			{/* Edit Modal (Keeping original structure) */}
			{isEditModalOpen && doctorToEdit && (
				<div className="dm-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
					<div className="dm-modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="dm-modal-header">
							<h3>Edit Doctor Profile</h3>
							<button className="dm-close-btn" onClick={() => setIsEditModalOpen(false)}>
								<X size={20} />
							</button>
						</div>
						<div className="dm-modal-body">
							<div className="dm-form-group">
								<label>First Name</label>
								<input
									type="text"
									value={doctorToEdit.firstName}
									onChange={(e) =>
										setDoctorToEdit({ ...doctorToEdit, firstName: e.target.value })
									}
								/>
							</div>
							<div className="dm-form-group">
								<label>Last Name</label>
								<input
									type="text"
									value={doctorToEdit.lastName}
									onChange={(e) =>
										setDoctorToEdit({ ...doctorToEdit, lastName: e.target.value })
									}
								/>
							</div>
							<div className="dm-form-group">
								<label>Email</label>
								<input
									type="email"
									value={doctorToEdit.email}
									onChange={(e) =>
										setDoctorToEdit({ ...doctorToEdit, email: e.target.value })
									}
								/>
							</div>
							<div className="dm-form-group">
								<label>Phone</label>
								<input
									type="text"
									value={doctorToEdit.phone}
									onChange={(e) =>
										setDoctorToEdit({ ...doctorToEdit, phone: e.target.value })
									}
								/>
							</div>
							<div className="dm-form-group">
								<label>Specialization (comma separated)</label>
								<input
									type="text"
									value={
										Array.isArray(doctorToEdit.specialization)
											? doctorToEdit.specialization.join(", ")
											: doctorToEdit.specialization
									}
									onChange={(e) =>
										setDoctorToEdit({
											...doctorToEdit,
											specialization: e.target.value.split(",").map((s) => s.trim()),
										})
									}
								/>
							</div>
							<div className="dm-form-group">
								<label>Experience (Years)</label>
								<input
									type="number"
									value={doctorToEdit.experience}
									onChange={(e) =>
										setDoctorToEdit({ ...doctorToEdit, experience: e.target.value })
									}
								/>
							</div>
						</div>
						<div className="dm-modal-footer">
							<button className="dm-btn-cancel" onClick={() => setIsEditModalOpen(false)}>
								Cancel
							</button>
							<button
								className="dm-btn-save"
								onClick={() => handleSaveChanges(doctorToEdit)}
							>
								Save Changes
							</button>
						</div>
					</div>
				</div>
			)}
			{/* Full Screen Info Modal */}
			{isInfoModalOpen && (
				<div className="dm-fullscreen-modal-overlay">
					<button onClick={() => setIsInfoModalOpen(false)} className="dm-close-fullscreen" title="Close">
						<span style={{ fontSize: "24px", fontWeight: "bold", lineHeight: "1" }}>&#x2715;</span>
					</button>

					<div className="dm-fullscreen-modal">
						
						<div className="dm-fullscreen-header">
							<h2><Info size={28} /> Excel Upload Guide</h2>
							<p>Follow this exact structure to seamlessly upload multiple doctors. We will securely handle the rest!</p>
						</div>

						<div className="dm-excel-showcase">
							{/* Required Columns Section */}
							<div className="dm-column-group required-group">
								<div className="dm-group-badge required-badge">REQUIRED FIELDS</div>
								<table className="dm-demo-table">
									<thead>
										<tr>
											<th>firstName</th>
											<th>lastName</th>
											<th>email</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Aditi</td>
											<td>Sharma</td>
											<td>aditi.s@clinic.com</td>
										</tr>
										<tr>
											<td>Rajesh</td>
											<td>Kumar</td>
											<td>rajesh.k@ayur.in</td>
										</tr>
									</tbody>
								</table>
							</div>

							{/* Optional Columns Section */}
							<div className="dm-column-group optional-group">
								<div className="dm-group-badge optional-badge">OPTIONAL FIELDS</div>
								<table className="dm-demo-table">
									<thead>
										<tr>
											<th>phone</th>
											<th>specialization</th>
											<th>experience</th>
											<th>gender</th>
											<th>price</th>
											<th className="highlight-header">password</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>+919876543210</td>
											<td>Cardiology, Ayurveda</td>
											<td>8</td>
											<td>Female</td>
											<td>800</td>
											<td className="highlight-cell">********</td>
										</tr>
										<tr>
											<td></td>
											<td>Panchakarma</td>
											<td>12</td>
											<td>Male</td>
											<td>1200</td>
											<td className="highlight-cell"></td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						{/* Explanatory Cards without Arrows */}
						<div className="dm-explanation-section">
							<div className="dm-info-cards">
								<div className="dm-card">
									<div className="dm-card-icon"><CheckSquare size={24} color="#555" /></div>
									<h4>Auto-Generated Credentials</h4>
									<p>If the <strong>password</strong> column is missing or shorter than 8 characters, we automatically generate a highly secure 8-character password for that doctor.</p>
								</div>
								
								<div className="dm-card">
									<div className="dm-card-icon"><Download size={24} color="#555" /></div>
									<h4>CSV Download</h4>
									<p>After a successful upload, you will immediately receive a CSV file containing all generated credentials. <strong>Keep this safe</strong> to distribute to your new doctors.</p>
								</div>

								<div className="dm-card">
									<div className="dm-card-icon"><Star size={24} color="#555" /></div>
									<h4>Forced Security Reset</h4>
									<p>On their very first login, every doctor will be automatically redirected to a secure screen and <strong>forced to change their password</strong> before accessing the dashboard.</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
			{/* Upload Report Modal */}
			{isUploadReportOpen && uploadReport && (
				<div className="dm-modal-overlay">
					<div className="dm-modal" style={{ maxWidth: "700px", width: "95%" }}>
						<div className="dm-modal-header" style={{ borderBottom: "1px solid #ddd", paddingBottom: "15px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<h3 style={{ margin: 0, color: "#333", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.5rem" }}>
								<CheckCircle size={28} color="#28a745" /> Upload Results Report
							</h3>
							<button onClick={() => setIsUploadReportOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}>
								<span style={{ fontSize: "24px", fontWeight: "bold", lineHeight: "1" }}>&#x2715;</span>
							</button>
						</div>
						
						<div className="dm-modal-body" style={{ maxHeight: "65vh", overflowY: "auto", color: "#444" }}>
							
							{/* Success Banner */}
							<div style={{ background: "#d4edda", border: "1px solid #c3e6cb", color: "#155724", padding: "15px", borderRadius: "8px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontWeight: "600", fontSize: "1.1rem" }}>
								<CheckCircle size={22} />
								{uploadReport.message}
							</div>

							{/* Credentials Notice */}
							{uploadReport.generatedCredentials && uploadReport.generatedCredentials.length > 0 && (
								<div style={{ background: "#cce5ff", border: "1px solid #b8daff", color: "#004085", padding: "15px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.95rem" }}>
									<strong>Note:</strong> A CSV file containing {uploadReport.generatedCredentials.length} auto-generated credentials has been downloaded to your computer. Please distribute these to the respective doctors so they can log in.
								</div>
							)}

							{/* Skipped Rows Section */}
							{uploadReport.skippedCount > 0 ? (
								<div style={{ marginTop: "30px" }}>
									<h4 style={{ color: "#dc3545", display: "flex", alignItems: "center", gap: "8px", marginBottom: "15px", fontSize: "1.2rem", borderBottom: "2px solid #dc3545", paddingBottom: "8px" }}>
										<AlertTriangle size={20} /> Failed to Register: {uploadReport.skippedCount} Doctors
									</h4>
									
									<table style={{ width: "100%", borderCollapse: "collapse", background: "#fdfdfd" }}>
										<thead>
											<tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6", color: "#495057", fontSize: "0.9rem", textAlign: "left" }}>
												<th style={{ padding: "12px", width: "20%" }}>Excel Row</th>
												<th style={{ padding: "12px", width: "80%" }}>Reason for Failure</th>
											</tr>
										</thead>
										<tbody>
											{uploadReport.skippedRows.map((skip, idx) => (
												<tr key={idx} style={{ borderBottom: "1px solid #eaeaea", fontSize: "0.95rem" }}>
													<td style={{ padding: "12px", color: "#6c757d", fontWeight: "bold" }}>
														Row {skip.row}
													</td>
													<td style={{ padding: "12px", color: "#dc3545" }}>
														{skip.reason}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div style={{ textAlign: "center", padding: "30px", color: "#6c757d", background: "#f8f9fa", borderRadius: "8px", border: "1px dashed #ced4da" }}>
									All doctors in the Excel file were successfully registered! No rows were skipped.
								</div>
							)}

						</div>

						<div className="dm-modal-footer" style={{ borderTop: "1px solid #ddd", paddingTop: "15px", marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
							<button type="button" onClick={() => setIsUploadReportOpen(false)} style={{ background: "#6c757d", color: "white", padding: "10px 24px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
								Done
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DoctorManagement;
