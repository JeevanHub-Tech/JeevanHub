import { useEffect, useState } from "react";
import { Upload } from "lucide-react";

import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";

const AdminRetailers = () => {
	const [retailers, setRetailers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [file, setFile] = useState(null);

	const handleFileChange = (e) => {
		setFile(e.target.files[0]);
	};

	const handleUpload = async () => {
		if (!file) {
			alert("Please select a file.");
			return;
		}

		const formData = new FormData();
		formData.append("file", file);

		try {
			const response = await fetch(`${BACKEND_URL}/api/auth/upload-retailers`, {
				method: "POST",
				body: formData,
			});

			const result = await response.json();
			alert(result.message);
			fetchRetailers();
		} catch (error) {
			console.error("Error uploading file:", error);
		}
	};

	useEffect(() => {
		fetchRetailers();
	}, []);

	const fetchRetailers = async () => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				console.error("No authentication token found.");
				return;
			}

			const response = await authFetch(`${BACKEND_URL}/api/auth/retailers`, {
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
			setRetailers(data);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching retailers:", error);
		}
	};

	const handleDelete = async (id) => {
		if (!window.confirm("Are you sure you want to delete this retailer?")) return;

		try {
			const token = localStorage.getItem("token");
			if (!token) {
				console.error("No authentication token found.");
				return;
			}

			const response = await authFetch(`${BACKEND_URL}/api/auth/retailers/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error("Error response:", errorData);
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			alert("Retailer deleted successfully.");
			fetchRetailers();
		} catch (error) {
			console.error("Error deleting retailer:", error);
		}
	};

	if (loading) {
		return (
			<DashboardShell>
				<p className="text-center text-muted-foreground">Loading retailers...</p>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<DashboardPageHeader title="Manage Retailers" />

			<Card className="mb-6 p-6">
				<h3 className="mb-3 text-base font-semibold text-foreground">Upload Retailers via Excel</h3>
				<div className="flex flex-wrap items-center gap-3">
					<input
						type="file"
						accept=".xlsx, .xls"
						onChange={handleFileChange}
						className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground"
					/>
					<Button onClick={handleUpload}>
						<Upload data-icon="inline-start" /> Upload
					</Button>
				</div>
			</Card>

			<Card className="overflow-hidden p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Phone</TableHead>
								<TableHead>Age</TableHead>
								<TableHead>Gender</TableHead>
								<TableHead>Zip Code</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{retailers.length === 0 ? (
								<TableRow>
									<TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
										No retailers found.
									</TableCell>
								</TableRow>
							) : (
								retailers.map((retailer) => (
									<TableRow key={retailer._id}>
										<TableCell className="font-medium text-foreground">
											{retailer.firstName} {retailer.lastName}
										</TableCell>
										<TableCell>{retailer.email}</TableCell>
										<TableCell>{retailer.phone}</TableCell>
										<TableCell>{retailer.age}</TableCell>
										<TableCell>{retailer.gender}</TableCell>
										<TableCell>{retailer.zipCode}</TableCell>
										<TableCell>
											<Button variant="destructive" size="sm" onClick={() => handleDelete(retailer._id)}>
												Delete
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</Card>
		</DashboardShell>
	);
};

export default AdminRetailers;
