import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";

import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const PatientManagement = () => {
	const [patients, setPatients] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [patientToEdit, setPatientToEdit] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchPatients = async () => {
			try {
				const token = localStorage.getItem("token");
				const res = await authFetch(`${BACKEND_URL}/api/patients/getAllPatients`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				if (!res.ok) throw new Error("Failed to fetch patients");
				const data = await res.json();
				setPatients(data);
			} catch (error) {
				console.error("Error fetching patients:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchPatients();
	}, []);

	const filteredPatients = patients.filter(
		(p) =>
			p.firstName?.toLowerCase().includes(search.toLowerCase()) ||
			p.lastName?.toLowerCase().includes(search.toLowerCase()) ||
			p.email?.toLowerCase().includes(search.toLowerCase()) ||
			p.phone?.toLowerCase().includes(search.toLowerCase())
	);

	const handleRowClick = (id) => {
		navigate(`/patients/${id}`);
	};

	const handleDelete = async (e, id) => {
		e.stopPropagation();
		if (!window.confirm("Are you sure you want to delete this patient?")) return;

		try {
			const res = await authFetch(`${BACKEND_URL}/api/patients/deletePatient/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.message || "Failed to delete patient");
			}

			setPatients((prev) => prev.filter((p) => p._id !== id));
			alert("Patient deleted successfully!");
		} catch (error) {
			alert("Error deleting patient: " + error.message);
		}
	};

	const handleEdit = (e, patient) => {
		e.stopPropagation();
		setPatientToEdit(patient);
		setIsEditModalOpen(true);
	};

	const handleSaveChanges = (updatedPatient) => {
		setPatients((prev) => prev.map((p) => (p._id === updatedPatient._id ? updatedPatient : p)));
		setIsEditModalOpen(false);
		setPatientToEdit(null);
	};

	if (loading) {
		return (
			<DashboardShell>
				<p className="text-center text-muted-foreground">Loading patients...</p>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
				<ArrowLeft data-icon="inline-start" /> Back
			</Button>

			<DashboardPageHeader title="Patient Management" />

			<Card className="mb-6 p-4">
				<div className="flex max-w-md min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
					<Search className="size-4 shrink-0 text-muted-foreground" />
					<Input
						placeholder="Search patients by name, email, or contact..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
					/>
				</div>
			</Card>

			<Card className="overflow-hidden p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Contact No.</TableHead>
								<TableHead>Gender</TableHead>
								<TableHead>ZipCode</TableHead>
								<TableHead>Age</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredPatients.length > 0 ? (
								filteredPatients.map((patient) => (
									<TableRow key={patient._id} className="cursor-pointer" onClick={() => handleRowClick(patient._id)}>
										<TableCell className="font-semibold text-foreground">
											{patient.firstName} {patient.lastName}
										</TableCell>
										<TableCell>{patient.email}</TableCell>
										<TableCell>{patient.phone}</TableCell>
										<TableCell>{patient.gender}</TableCell>
										<TableCell>
											{typeof patient.zipCode === "object" && patient.zipCode !== null
												? patient.zipCode.specific || patient.zipCode.pincode || "Not specified"
												: patient.zipCode || "Not specified"}
										</TableCell>
										<TableCell>{patient.age || "N/A"}</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button size="sm" onClick={(e) => handleEdit(e, patient)}>
													Edit
												</Button>
												<Button size="sm" variant="secondary" onClick={(e) => handleDelete(e, patient._id)}>
													Delete
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
										No patients found matching your search.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</Card>

			{patientToEdit ? (
				<EditModal
					isOpen={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					patient={patientToEdit}
					onSave={handleSaveChanges}
				/>
			) : null}
		</DashboardShell>
	);
};

const EditModal = ({ isOpen, onClose, patient, onSave }) => {
	const [formData, setFormData] = useState({ ...patient });

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		onSave(formData);
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Edit Patient Details</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="flex flex-col gap-6">
					<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field>
							<FieldLabel htmlFor="firstName">First Name</FieldLabel>
							<Input id="firstName" name="firstName" value={formData.firstName || ""} onChange={handleChange} />
						</Field>
						<Field>
							<FieldLabel htmlFor="lastName">Last Name</FieldLabel>
							<Input id="lastName" name="lastName" value={formData.lastName || ""} onChange={handleChange} />
						</Field>
						<Field className="sm:col-span-2">
							<FieldLabel htmlFor="email">Email</FieldLabel>
							<Input id="email" type="email" name="email" value={formData.email || ""} onChange={handleChange} />
						</Field>
						<Field className="sm:col-span-2">
							<FieldLabel htmlFor="phone">Phone</FieldLabel>
							<Input id="phone" name="phone" value={formData.phone || ""} onChange={handleChange} />
						</Field>
						<Field>
							<FieldLabel htmlFor="age">Age</FieldLabel>
							<Input id="age" type="number" name="age" value={formData.age || ""} onChange={handleChange} />
						</Field>
						<Field>
							<FieldLabel htmlFor="gender">Gender</FieldLabel>
							<Select value={formData.gender || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}>
								<SelectTrigger id="gender">
									<SelectValue placeholder="Select Gender" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Male">Male</SelectItem>
									<SelectItem value="Female">Female</SelectItem>
									<SelectItem value="Other">Other</SelectItem>
								</SelectContent>
							</Select>
						</Field>
					</FieldGroup>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">Save Changes</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default PatientManagement;
