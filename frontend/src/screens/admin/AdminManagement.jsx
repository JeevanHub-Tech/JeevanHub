import { useState, useEffect, useContext, useCallback } from "react";
import { ListFilter, Plus, Trash2, Eye, EyeOff, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AuthContext } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

const defaultPermissions = {
	manageAdmins: false,
	manageUsers: false,
	manageDoctors: false,
	manageRetailers: false,
	manageTransactions: false,
	manageBlogs: false,
};

const permissionFallbackLabel = (key) => key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

const AdminManagement = () => {
	const { t } = useTranslation();
	useContext(AuthContext);
	const [admins, setAdmins] = useState([]);
	const [loading, setLoading] = useState(true);

	const getPermissionLabel = (key) => t(`adminManagement.permissions.${key}`, { defaultValue: permissionFallbackLabel(key) });

	// Search/status/reset/sort live in the URL so leaving this admin section
	// (lazy route swap unmounts it) and coming back restores the filters
	// instead of resetting.
	const { values: urlFilters, setFilter } = useUrlFilters({
		q: "",
		status: "all",
		reset: "all",
		sort: "date_desc",
	});
	const searchQuery = urlFilters.q;
	const setSearchQuery = useCallback((v) => setFilter("q", v), [setFilter]);
	const filterStatus = urlFilters.status;
	const setFilterStatus = useCallback((v) => setFilter("status", v), [setFilter]);
	const filterReset = urlFilters.reset;
	const setFilterReset = useCallback((v) => setFilter("reset", v), [setFilter]);
	const sortBy = urlFilters.sort;
	const setSortBy = useCallback((v) => setFilter("sort", v), [setFilter]);

	const [showFilters, setShowFilters] = useState(false);
	const [filterPermissions, setFilterPermissions] = useState({ ...defaultPermissions });

	const [showRegisterModal, setShowRegisterModal] = useState(false);
	const [adminForm, setAdminForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		password: "",
		permissions: { ...defaultPermissions },
	});
	const [adminExistsInfo, setAdminExistsInfo] = useState(null);
	const [showPassword, setShowPassword] = useState(false);

	const [showEditModal, setShowEditModal] = useState(false);
	const [editingAdmin, setEditingAdmin] = useState(null);
	const [editPermissions, setEditPermissions] = useState({});

	const [confirmModal, setConfirmModal] = useState({ show: false, title: "", message: "", onConfirm: null });

	useEffect(() => {
		fetchAdmins();
	}, []);

	const fetchAdmins = async () => {
		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/auth/admin/all`, {
				headers: { Authorization: `Bearer ${token}` },
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

	const handleAdminEmailBlur = async () => {
		if (!adminForm.email) return;
		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/auth/admin/check-email/${adminForm.email}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await response.json();
			if (data.exists) {
				setAdminExistsInfo(data);
				if (data.role === "admin") alert(t("adminManagement.registerModal.emailAlreadyAdmin"));
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
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(adminForm),
			});
			const data = await response.json();
			if (response.ok) {
				alert(data.promoted ? t("adminManagement.registerModal.promoteSuccess") : t("adminManagement.registerModal.createSuccess"));
				setShowRegisterModal(false);
				setAdminForm({
					firstName: "",
					lastName: "",
					email: "",
					phone: "",
					password: "",
					permissions: { ...defaultPermissions },
				});
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
		setAdminForm((prev) => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));
	};

	const toggleAllAdminFormPermissions = () => {
		const allChecked = Object.values(adminForm.permissions).every(Boolean);
		const newState = {};
		for (const key in adminForm.permissions) {
			newState[key] = !allChecked;
		}
		setAdminForm((prev) => ({ ...prev, permissions: newState }));
	};

	const handleCopyPassword = (e) => {
		e.preventDefault();
		if (adminForm.password) {
			navigator.clipboard.writeText(adminForm.password);
			alert(t("adminManagement.registerModal.copied"));
		}
	};

	const executeUpdateStatus = async (adminId, payload) => {
		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/auth/admin/update-status/${adminId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
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
				headers: { Authorization: `Bearer ${token}` },
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
		setEditPermissions(admin.permissions || { ...defaultPermissions });
		setShowEditModal(true);
	};

	const toggleEditPermission = (key) => {
		setEditPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const toggleFilterPermission = (key) => {
		setFilterPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const getProcessedAdmins = () => {
		let result = [...admins];

		if (searchQuery) {
			result = result.filter((admin) => {
				const full = `${admin.firstName} ${admin.lastName} ${admin.email}`.toLowerCase();
				return full.includes(searchQuery.toLowerCase());
			});
		}

		if (filterStatus !== "all") {
			result = result.filter((admin) => (filterStatus === "active" ? admin.isActive : !admin.isActive));
		}

		if (filterReset !== "all") {
			result = result.filter((admin) => (filterReset === "requested" ? admin.forcePasswordReset : !admin.forcePasswordReset));
		}

		const requiredPermissions = Object.keys(filterPermissions).filter((key) => filterPermissions[key]);
		if (requiredPermissions.length > 0) {
			result = result.filter((admin) => requiredPermissions.every((key) => admin.permissions && admin.permissions[key]));
		}

		result.sort((a, b) => {
			if (sortBy === "name_asc") return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
			if (sortBy === "name_desc") return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
			if (sortBy === "login_desc") return new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0);
			if (sortBy === "login_asc") return new Date(a.lastLogin || 0) - new Date(b.lastLogin || 0);
			if (sortBy === "date_asc") return a._id > b._id ? 1 : -1;
			if (sortBy === "date_desc") return a._id < b._id ? 1 : -1;
			return 0;
		});

		return result;
	};

	const processedAdmins = getProcessedAdmins();

	if (loading) {
		return (
			<DashboardShell>
				<p className="text-center text-muted-foreground">{t("adminManagement.loading")}</p>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<DashboardPageHeader
				title={t("adminManagement.title")}
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<Input
							placeholder={t("adminManagement.searchPlaceholder")}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-60"
						/>
						<Button variant={showFilters ? "secondary" : "outline"} onClick={() => setShowFilters(!showFilters)}>
							<ListFilter data-icon="inline-start" /> {t("adminManagement.filterAndSort")}
						</Button>
						<Button onClick={() => setShowRegisterModal(true)}>
							<Plus data-icon="inline-start" /> {t("adminManagement.registerNewAdmin")}
						</Button>
					</div>
				}
			/>

			{showFilters ? (
				<Card className="mb-6 p-5">
					<div className="flex flex-wrap gap-8">
						<div className="flex flex-col gap-2">
							<span className="text-sm font-semibold text-foreground">{t("adminManagement.sortBy")}</span>
							<Select
								value={sortBy}
								onValueChange={setSortBy}
								items={[
									{ value: "date_desc", label: t("adminManagement.sortOptions.dateDesc") },
									{ value: "date_asc", label: t("adminManagement.sortOptions.dateAsc") },
									{ value: "login_desc", label: t("adminManagement.sortOptions.loginDesc") },
									{ value: "login_asc", label: t("adminManagement.sortOptions.loginAsc") },
									{ value: "name_asc", label: t("adminManagement.sortOptions.nameAsc") },
									{ value: "name_desc", label: t("adminManagement.sortOptions.nameDesc") },
								]}
							>
								<SelectTrigger className="w-56">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="date_desc">{t("adminManagement.sortOptions.dateDesc")}</SelectItem>
									<SelectItem value="date_asc">{t("adminManagement.sortOptions.dateAsc")}</SelectItem>
									<SelectItem value="login_desc">{t("adminManagement.sortOptions.loginDesc")}</SelectItem>
									<SelectItem value="login_asc">{t("adminManagement.sortOptions.loginAsc")}</SelectItem>
									<SelectItem value="name_asc">{t("adminManagement.sortOptions.nameAsc")}</SelectItem>
									<SelectItem value="name_desc">{t("adminManagement.sortOptions.nameDesc")}</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<span className="text-sm font-semibold text-foreground">{t("adminManagement.accountStatus")}</span>
							<Select
								value={filterStatus}
								onValueChange={setFilterStatus}
								items={[
									{ value: "all", label: t("adminManagement.all") },
									{ value: "active", label: t("adminManagement.activeOnly") },
									{ value: "inactive", label: t("adminManagement.inactiveOnly") },
								]}
							>
								<SelectTrigger className="w-44">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("adminManagement.all")}</SelectItem>
									<SelectItem value="active">{t("adminManagement.activeOnly")}</SelectItem>
									<SelectItem value="inactive">{t("adminManagement.inactiveOnly")}</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-2">
							<span className="text-sm font-semibold text-foreground">{t("adminManagement.resetRequests")}</span>
							<Select
								value={filterReset}
								onValueChange={setFilterReset}
								items={[
									{ value: "all", label: t("adminManagement.all") },
									{ value: "requested", label: t("adminManagement.resetRequested") },
									{ value: "not_requested", label: t("adminManagement.noResetPending") },
								]}
							>
								<SelectTrigger className="w-52">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t("adminManagement.all")}</SelectItem>
									<SelectItem value="requested">{t("adminManagement.resetRequested")}</SelectItem>
									<SelectItem value="not_requested">{t("adminManagement.noResetPending")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="mt-5">
						<div className="mb-3 flex items-center justify-between">
							<span className="text-sm font-semibold text-foreground">{t("adminManagement.filterByPermissions")}</span>
							<Button
								variant="ghost"
								size="sm"
								className="text-destructive hover:text-destructive"
								onClick={() => setFilterPermissions({ ...defaultPermissions })}
							>
								{t("adminManagement.clearPermissionsFilter")}
							</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							{Object.keys(filterPermissions).map((key) => (
								<button
									key={key}
									type="button"
									onClick={() => toggleFilterPermission(key)}
									className={
										filterPermissions[key]
											? "rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
											: "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40"
									}
								>
									{getPermissionLabel(key)}
								</button>
							))}
						</div>
					</div>
				</Card>
			) : null}

			<Card className="overflow-hidden p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("adminManagement.table.name")}</TableHead>
								<TableHead>{t("adminManagement.table.email")}</TableHead>
								<TableHead>{t("adminManagement.table.status")}</TableHead>
								<TableHead>{t("adminManagement.table.lastLogin")}</TableHead>
								<TableHead>{t("adminManagement.table.actions")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{processedAdmins.length > 0 ? (
								processedAdmins.map((admin) => (
									<TableRow key={admin._id}>
										<TableCell className="font-medium text-foreground">
											{admin.firstName} {admin.lastName}
										</TableCell>
										<TableCell className="break-all">{admin.email}</TableCell>
										<TableCell>
											<Badge variant={admin.isActive ? "default" : "destructive"}>
												{admin.isActive ? t("adminManagement.status.active") : t("adminManagement.status.inactive")}
											</Badge>
										</TableCell>
										<TableCell className="text-sm text-muted-foreground">
											{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : t("adminManagement.status.never")}
										</TableCell>
										<TableCell>
											<div className="flex flex-wrap items-center gap-2">
												<Button variant="outline" size="sm" onClick={() => openEditModal(admin)}>
													{t("adminManagement.actions.permissions")}
												</Button>
												<Button
													size="sm"
													variant={admin.isActive ? "destructive" : "default"}
													onClick={() =>
														openConfirmModal(
															admin.isActive ? t("adminManagement.confirmModal.deactivateTitle") : t("adminManagement.confirmModal.activateTitle"),
															admin.isActive
																? t("adminManagement.confirmModal.deactivateMsg", { email: admin.email })
																: t("adminManagement.confirmModal.activateMsg", { email: admin.email }),
															() => executeUpdateStatus(admin._id, { isActive: !admin.isActive })
														)
													}
												>
													{admin.isActive ? t("adminManagement.actions.deactivate") : t("adminManagement.actions.activate")}
												</Button>
												<Button
													size="sm"
													variant="secondary"
													onClick={() =>
														openConfirmModal(
															admin.forcePasswordReset ? t("adminManagement.actions.cancelReset") : t("adminManagement.actions.forceReset"),
															t("adminManagement.confirmModal.toggleResetMsg", { email: admin.email }),
															() => executeUpdateStatus(admin._id, { forcePasswordReset: !admin.forcePasswordReset })
														)
													}
												>
													{admin.forcePasswordReset ? t("adminManagement.actions.cancelReset") : t("adminManagement.actions.forceReset")}
												</Button>
												<Button
													size="icon"
													variant="destructive"
													title={t("adminManagement.actions.delete")}
													onClick={() =>
														openConfirmModal(
															t("adminManagement.confirmModal.deleteTitle"),
															t("adminManagement.confirmModal.deleteMsg", { email: admin.email }),
															() => handleDeleteAdmin(admin._id)
														)
													}
												>
													<Trash2 />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
										{t("adminManagement.noAdminsFound")}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</Card>

			{/* REGISTER ADMIN MODAL */}
			<Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
				<DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("adminManagement.registerModal.title")}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleAdminRegister} className="flex flex-col gap-4">
						<div className="grid grid-cols-2 gap-3">
							<Input
								placeholder={t("adminManagement.registerModal.firstName")}
								value={adminForm.firstName}
								onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })}
								required
							/>
							<Input
								placeholder={t("adminManagement.registerModal.lastName")}
								value={adminForm.lastName}
								onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })}
								required
							/>
						</div>
						<Input
							type="email"
							placeholder={t("adminManagement.registerModal.email")}
							value={adminForm.email}
							onBlur={handleAdminEmailBlur}
							onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
							required
						/>

						{adminExistsInfo && adminExistsInfo.role !== "admin" ? (
							<div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
								<strong>Note:</strong> {t("adminManagement.registerModal.existingAccountNotice", { role: adminExistsInfo.role })}
							</div>
						) : null}

						<Input
							placeholder={t("adminManagement.registerModal.phone")}
							value={adminForm.phone}
							onChange={(e) => {
								const val = e.target.value;
								if (val === "" || /^[0-9]+$/.test(val)) {
									setAdminForm({ ...adminForm, phone: val });
								}
							}}
						/>

						{!(adminExistsInfo && adminExistsInfo.role !== "admin") ? (
							<div className="flex items-center rounded-lg border border-input overflow-hidden">
								<Input
									type={showPassword ? "text" : "password"}
									placeholder={t("adminManagement.registerModal.temporaryPassword")}
									value={adminForm.password}
									onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
									className="border-0 shadow-none focus-visible:ring-0"
									required
								/>
								<button
									type="button"
									title="Toggle Visibility"
									onClick={() => setShowPassword(!showPassword)}
									className="flex items-center px-3 text-muted-foreground"
								>
									{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
								</button>
								<button
									type="button"
									title="Copy Password"
									onClick={handleCopyPassword}
									className="flex items-center border-l border-input bg-muted px-3 py-2.5 text-foreground"
								>
									<Copy className="size-4" />
								</button>
							</div>
						) : null}

						<div>
							<div className="mb-2 flex items-center justify-between">
								<span className="text-sm font-semibold text-foreground">{t("adminManagement.registerModal.initialPermissions")}</span>
								<Button type="button" variant="outline" size="sm" onClick={toggleAllAdminFormPermissions}>
									{t("adminManagement.registerModal.toggleAll")}
								</Button>
							</div>
							<div className="grid grid-cols-2 gap-2">
								{Object.keys(adminForm.permissions).map((key) => (
									<label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
										<input
											type="checkbox"
											checked={adminForm.permissions[key]}
											onChange={() => toggleAdminFormPermission(key)}
										/>
										{getPermissionLabel(key)}
									</label>
								))}
							</div>
						</div>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setShowRegisterModal(false)}>
								{t("adminManagement.registerModal.cancel")}
							</Button>
							<Button type="submit" disabled={adminExistsInfo && adminExistsInfo.role === "admin"}>
								{t("adminManagement.registerModal.register")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* EDIT PERMISSIONS MODAL */}
			<Dialog open={showEditModal} onOpenChange={setShowEditModal}>
				<DialogContent className="max-w-md">
					{editingAdmin ? (
						<>
							<DialogHeader>
								<DialogTitle>{t("adminManagement.editModal.title")}</DialogTitle>
								<DialogDescription>
									{t("adminManagement.editModal.description", { name: `${editingAdmin.firstName} ${editingAdmin.lastName}` })}
								</DialogDescription>
							</DialogHeader>

							<FieldGroup>
								{Object.keys(editPermissions).map((key) => (
									<Field key={key} orientation="horizontal" className="justify-between">
										<FieldLabel htmlFor={`perm-${key}`}>{getPermissionLabel(key)}</FieldLabel>
										<input
											id={`perm-${key}`}
											type="checkbox"
											className="size-4"
											checked={editPermissions[key]}
											onChange={() => toggleEditPermission(key)}
										/>
									</Field>
								))}
							</FieldGroup>

							<DialogFooter>
								<Button variant="outline" onClick={() => setShowEditModal(false)}>
									{t("adminManagement.editModal.cancel")}
								</Button>
								<Button onClick={() => executeUpdateStatus(editingAdmin._id, { permissions: editPermissions })}>
									{t("adminManagement.editModal.saveChanges")}
								</Button>
							</DialogFooter>
						</>
					) : null}
				</DialogContent>
			</Dialog>

			{/* CONFIRMATION MODAL */}
			<Dialog open={confirmModal.show} onOpenChange={(open) => !open && setConfirmModal({ show: false, title: "", message: "", onConfirm: null })}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{confirmModal.title}</DialogTitle>
						<DialogDescription>{confirmModal.message}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmModal({ show: false, title: "", message: "", onConfirm: null })}
						>
							{t("adminManagement.confirmModal.cancel")}
						</Button>
						<Button
							variant={confirmModal.title.includes("Delete") || confirmModal.title.includes("हटाएं") ? "destructive" : "default"}
							onClick={confirmModal.onConfirm}
						>
							{t("adminManagement.confirmModal.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</DashboardShell>
	);
};

export default AdminManagement;
