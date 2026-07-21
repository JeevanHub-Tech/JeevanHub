import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { recordsData } from "./Patientdata";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const AdminUsers = () => {
	const [, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);

	const navigate = useNavigate();

	const handleRowClick = (id) => {
		navigate(`/patients/${id}`);
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				console.error("No authentication token found.");
				return;
			}

			const response = await authFetch(`${BACKEND_URL}/api/patient-records/getAllRecords`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();
			setUsers(data?.data?.records || []);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching users:", error);
			setLoading(false);
		}
	};

	const handleDelete = async (userId) => {
		if (window.confirm("Are you sure you want to delete this user?")) {
			try {
				const token = localStorage.getItem("token");
				const response = await authFetch(`${BACKEND_URL}/api/auth/users/${userId}`, {
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error(`Error deleting user: ${response.status}`);
				}

				fetchUsers();
			} catch (error) {
				console.error("Error deleting user:", error);
			}
		}
	};

	if (loading) {
		return (
			<DashboardShell>
				<p className="text-center text-muted-foreground">Loading users...</p>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<DashboardPageHeader title="Manage Users" />

			<Card className="overflow-hidden p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Phone No.</TableHead>
								<TableHead>Gender</TableHead>
								<TableHead>Age</TableHead>
								<TableHead>ZipCode</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{recordsData.map((record) => {
								const patient = record.patient;
								return (
									<TableRow key={record._id} className="cursor-pointer" onClick={() => handleRowClick(record._id)}>
										<TableCell className="font-medium text-foreground">
											{patient.firstName} {patient.lastName}
										</TableCell>
										<TableCell>{patient.email}</TableCell>
										<TableCell>{patient.phone}</TableCell>
										<TableCell>{patient.gender}</TableCell>
										<TableCell>{patient.age}</TableCell>
										<TableCell>{patient.zipCode}</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button
													variant="destructive"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														handleDelete(record._id);
													}}
												>
													Delete
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={(e) => {
														e.stopPropagation();
														navigate(`/patients/${record._id}`);
													}}
												>
													Update
												</Button>
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
			</Card>
		</DashboardShell>
	);
};

export default AdminUsers;
