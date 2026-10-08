import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation();
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
				<p className="text-center text-muted-foreground">{t("adminRetailers.loading")}</p>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
				<ArrowLeft data-icon="inline-start" /> {t("adminRetailers.back")}
			</Button>

			<DashboardPageHeader title={t("adminRetailers.title")} />

			<Card className="mb-6 p-4">
				<div className="flex max-w-md min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
					<Search className="size-4 shrink-0 text-muted-foreground" />
					<Input
						placeholder={t("adminRetailers.searchPlaceholder")}
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
										<Store className="size-4" /> {t("adminRetailers.table.businessName")}
									</span>
								</TableHead>
								<TableHead>{t("adminRetailers.table.status")}</TableHead>
								<TableHead>
									<span className="flex items-center gap-1.5">
										<Mail className="size-4" /> {t("adminRetailers.table.email")}
									</span>
								</TableHead>
								<TableHead>
									<span className="flex items-center gap-1.5">
										<Phone className="size-4" /> {t("adminRetailers.table.phone")}
									</span>
								</TableHead>
								<TableHead>
									<span className="flex items-center gap-1.5">
										<MapPin className="size-4" /> {t("adminRetailers.table.zipCode")}
									</span>
								</TableHead>
								<TableHead>{t("adminRetailers.table.actions")}</TableHead>
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
												<Pencil data-icon="inline-start" /> {t("adminRetailers.edit")}
											</Button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
										{t("adminRetailers.noRetailersFound")}
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
	const { t } = useTranslation();
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
					<DialogTitle>{t("adminRetailers.editModal.title")}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="flex flex-col gap-6">
					<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field className="sm:col-span-2">
							<FieldLabel htmlFor="BusinessName">{t("adminRetailers.editModal.businessName")}</FieldLabel>
							<Input id="BusinessName" name="BusinessName" value={formData.BusinessName} onChange={handleChange} />
						</Field>
						<Field>
							<FieldLabel htmlFor="email">{t("adminRetailers.editModal.email")}</FieldLabel>
							<Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} />
						</Field>
						<Field>
							<FieldLabel htmlFor="phone">{t("adminRetailers.editModal.phone")}</FieldLabel>
							<Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
						</Field>
						<Field>
							<FieldLabel htmlFor="status">{t("adminRetailers.editModal.status")}</FieldLabel>
							<Select
								value={formData.status}
								onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
								items={[{ value: "active", label: t("adminRetailers.editModal.active") }, { value: "inactive", label: t("adminRetailers.editModal.inactive") }]}
							>
								<SelectTrigger id="status">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">{t("adminRetailers.editModal.active")}</SelectItem>
									<SelectItem value="inactive">{t("adminRetailers.editModal.inactive")}</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						<Field>
							<FieldLabel htmlFor="zipCode">{t("adminRetailers.editModal.zipCode")}</FieldLabel>
							<Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} />
						</Field>
					</FieldGroup>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							{t("adminRetailers.editModal.cancel")}
						</Button>
						<Button type="submit">{t("adminRetailers.editModal.saveChanges")}</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default RetailerManagement;
