import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Store, Mail, Phone, MapPin, Search, ArrowLeft, Pencil } from "lucide-react";

import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BACKEND_URL } from "../../../config";
import { authFetch } from "../../../utils/authFetch";

const initialRetailersData = [
	{
		_id: "dummy1",
		BusinessName: "Loading...",
		firstName: "Test",
		lastName: "Retailer",
		email: "loading@example.com",
		phone: "0000000000",
		status: "active",
		zipCode: "123456",
	},
];

const RetailerManagement = () => {
	const [retailers, setRetailers] = useState(initialRetailersData);
	const [loadingRetailers, setLoadingRetailers] = useState(true);
	const [search, setSearch] = useState("");
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [retailerToEdit, setRetailerToEdit] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchAllRetailers = async () => {
			try {
				const token = localStorage.getItem("token");
				const res = await authFetch(`${BACKEND_URL}/api/retailers/getAllRetailers`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				if (!res.ok) {
					if (res.status === 404) {
						setRetailers([]);
						return;
					}
					throw new Error("Failed to fetch retailers");
				}
				const data = await res.json();
				setRetailers(data);
			} catch (error) {
				console.error("Error fetching retailers:", error);
			} finally {
				setLoadingRetailers(false);
			}
		};
		fetchAllRetailers();
	}, []);

	const filteredRetailers = retailers.filter((r) => {
		const term = search.toLowerCase();
		return (
			(r.firstName || "").toLowerCase().includes(term) ||
			(r.lastName || "").toLowerCase().includes(term) ||
			(r.BusinessName || "").toLowerCase().includes(term) ||
			(r.email || "").toLowerCase().includes(term) ||
			(r.phone || "").includes(term) ||
			(r.zipCode || "").includes(term)
		);
	});

	const handleRowClick = (_id) => navigate(`/admin/medicine-orders/${_id}`);
	const handleEditClick = (e, retailer) => {
		e.stopPropagation();
		setRetailerToEdit(retailer);
		setIsEditModalOpen(true);
	};
	const handleSaveChanges = (updatedRetailer) => {
		setRetailers(retailers.map((r) => (r._id === updatedRetailer._id ? updatedRetailer : r)));
		setIsEditModalOpen(false);
		setRetailerToEdit(null);
	};

	if (loadingRetailers) {
		return (
			<DashboardShell>
				<p className="text-center text-muted-foreground">Loading Retailers...</p>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
				<ArrowLeft data-icon="inline-start" /> Back
			</Button>

			<DashboardPageHeader title="Retailer Management" />

			<Card className="mb-6 p-4">
				<div className="flex max-w-md min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
					<Search className="size-4 shrink-0 text-muted-foreground" />
					<Input
						placeholder="Search by name, business, email, or phone..."
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
								<TableHead>
									<span className="flex items-center gap-1.5">
										<Store className="size-4" /> Business Name
									</span>
								</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>
									<span className="flex items-center gap-1.5">
										<Mail className="size-4" /> Email
									</span>
								</TableHead>
								<TableHead>
									<span className="flex items-center gap-1.5">
										<Phone className="size-4" /> Phone
									</span>
								</TableHead>
								<TableHead>
									<span className="flex items-center gap-1.5">
										<MapPin className="size-4" /> Zip Code
									</span>
								</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredRetailers.length > 0 ? (
								filteredRetailers.map((retailer) => (
									<TableRow key={retailer._id} className="cursor-pointer" onClick={() => handleRowClick(retailer._id)}>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="size-9">
													<AvatarFallback>
														{(retailer.BusinessName || retailer.firstName || "?").charAt(0)}
													</AvatarFallback>
												</Avatar>
												<span className="font-semibold text-foreground">
													{retailer.BusinessName || `${retailer.firstName} ${retailer.lastName}`}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant={(retailer.status || "").toLowerCase() === "active" ? "default" : "secondary"}>
												{retailer.status}
											</Badge>
										</TableCell>
										<TableCell>{retailer.email}</TableCell>
										<TableCell>{retailer.phone}</TableCell>
										<TableCell>{retailer.zipCode}</TableCell>
										<TableCell>
											<Button variant="outline" size="sm" onClick={(e) => handleEditClick(e, retailer)}>
												<Pencil data-icon="inline-start" /> Edit
											</Button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
										No retailers found matching your criteria.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</Card>

			{retailerToEdit && (
				<EditModal
					isOpen={isEditModalOpen}
					onClose={() => setIsEditModalOpen(false)}
					retailer={retailerToEdit}
					onSave={handleSaveChanges}
				/>
			)}
		</DashboardShell>
	);
};

const EditModal = ({ isOpen, onClose, retailer, onSave }) => {
	const [formData, setFormData] = useState(retailer);
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
					<DialogTitle>Edit Retailer Details</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="flex flex-col gap-6">
					<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field className="sm:col-span-2">
							<FieldLabel htmlFor="BusinessName">Business Name</FieldLabel>
							<Input id="BusinessName" name="BusinessName" value={formData.BusinessName} onChange={handleChange} />
						</Field>
						<Field>
							<FieldLabel htmlFor="email">Email</FieldLabel>
							<Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} />
						</Field>
						<Field>
							<FieldLabel htmlFor="phone">Phone</FieldLabel>
							<Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
						</Field>
						<Field>
							<FieldLabel htmlFor="status">Status</FieldLabel>
							<Select
								value={formData.status}
								onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
								items={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
							>
								<SelectTrigger id="status">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<Field>
							<FieldLabel htmlFor="zipCode">Zip Code</FieldLabel>
							<Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} />
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

export default RetailerManagement;
