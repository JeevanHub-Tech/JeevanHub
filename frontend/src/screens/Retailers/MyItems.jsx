import { useState, useEffect, useRef } from "react";
import { Search, Plus, Edit2, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download, ChevronsUpDown } from "lucide-react";

import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const CATEGORY_FILTER_OPTIONS = [
	{ value: "all", label: "All Categories" },
	{ value: "Ayurvedic", label: "Ayurvedic" },
	{ value: "Allopathic", label: "Allopathic" },
	{ value: "Supplements", label: "Supplements" },
	{ value: "Personal Care", label: "Personal Care" },
];

const STATUS_FILTER_OPTIONS = [
	{ value: "all", label: "All Statuses" },
	{ value: "active", label: "Active" },
	{ value: "inactive", label: "Inactive" },
	{ value: "in-stock", label: "In Stock" },
	{ value: "out-of-stock", label: "Out of Stock" },
];

const stockBadgeVariant = (quantity) => {
	if (quantity > 10) return "default";
	if (quantity > 0) return "secondary";
	return "destructive";
};

function MyItems() {
	const [items, setItems] = useState([]);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);

	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");

	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(10);
	const [sortBy, setSortBy] = useState("createdAt");
	const [sortOrder, setSortOrder] = useState("desc");
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);

	const [selectedIds, setSelectedIds] = useState(new Set());

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [editingItem, setEditingItem] = useState(null);
	const [editForm, setEditForm] = useState({
		name: "",
		price: "",
		quantity: "",
		category: "",
		description: "",
		prescription: false,
		isActive: true,
	});

	const [inlineEditField, setInlineEditField] = useState({ id: null, field: null, value: "" });

	const [selectedGalleryItem, setSelectedGalleryItem] = useState(null);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [imageToDelete, setImageToDelete] = useState(null);
	const fileInputRef = useRef(null);

	const fetchMyItems = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page,
				limit,
				sortBy,
				sortOrder,
				...(searchQuery && { search: searchQuery }),
				...(categoryFilter !== "all" && { category: categoryFilter }),
				...(statusFilter !== "all" && { status: statusFilter }),
			});

			const response = await authFetch(`${BACKEND_URL}/api/medicines/my?${params.toString()}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
			});
			const data = await response.json();
			if (response.ok) {
				setItems(data.medicines || []);
				setTotalPages(data.totalPages || 1);
				setTotalItems(data.totalItems || 0);
			} else {
				setError(data.message || "Failed to fetch items");
			}
		} catch (error) {
			setError("An error occurred while fetching items");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			fetchMyItems();
		}, 300);
		return () => clearTimeout(delayDebounce);
	}, [page, limit, sortBy, sortOrder, searchQuery, categoryFilter, statusFilter]);

	useEffect(() => {
		if (imageToDelete !== null) {
			const handleKeyDown = (e) => {
				if (e.key === "Enter") confirmRemoveImage();
				if (e.key === "Escape") setImageToDelete(null);
			};
			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}
	}, [imageToDelete, selectedGalleryItem]);

	const toggleSelection = (id) => {
		const newSelection = new Set(selectedIds);
		if (newSelection.has(id)) newSelection.delete(id);
		else newSelection.add(id);
		setSelectedIds(newSelection);
	};

	const toggleSelectAll = () => {
		if (selectedIds.size === items.length && items.length > 0) setSelectedIds(new Set());
		else setSelectedIds(new Set(items.map((i) => i._id)));
	};

	const handleStatusToggle = async (id, currentStatus) => {
		try {
			const response = await authFetch(`${BACKEND_URL}/api/medicines/${id}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ isActive: !currentStatus }),
			});
			if (response.ok) fetchMyItems();
		} catch (error) {
			console.error("Toggle error", error);
		}
	};

	const deleteItem = async (id) => {
		if (!window.confirm("Are you sure you want to delete this product?")) return;
		try {
			const response = await authFetch(`${BACKEND_URL}/api/medicines/${id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
			});
			if (response.ok) fetchMyItems();
		} catch (error) {
			console.error("Delete error", error);
		}
	};

	const handleBulkAction = async (action) => {
		const ids = Array.from(selectedIds);
		if (!ids.length) return;

		try {
			if (action === "delete") {
				if (!window.confirm(`Delete ${ids.length} items?`)) return;
				await authFetch(`${BACKEND_URL}/api/medicines/bulk-delete`, {
					method: "POST",
					headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
					body: JSON.stringify({ ids }),
				});
			} else {
				const isActive = action === "activate";
				await authFetch(`${BACKEND_URL}/api/medicines/bulk-status`, {
					method: "PUT",
					headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
					body: JSON.stringify({ ids, isActive }),
				});
			}
			setSelectedIds(new Set());
			fetchMyItems();
		} catch (err) {
			console.error(err);
		}
	};

	const openEditDrawer = (item) => {
		setEditingItem(item);
		setEditForm({
			name: item.name,
			price: item.price,
			quantity: item.quantity,
			category: item.category,
			description: item.description || "",
			prescription: item.prescription,
			isActive: item.isActive !== false,
		});
		setIsDrawerOpen(true);
	};

	const handleEditSubmit = async (e) => {
		e.preventDefault();
		try {
			const payload = { ...editForm, quantity: Math.floor(Number(editForm.quantity)) };
			const response = await authFetch(`${BACKEND_URL}/api/medicines/${editingItem._id}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("token")}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});
			if (response.ok) {
				setIsDrawerOpen(false);
				fetchMyItems();
			} else {
				const errData = await response.json();
				alert(errData.message || "Failed to update item");
			}
		} catch (error) {
			console.error(error);
		}
	};

	const handleInlineSave = async () => {
		if (!inlineEditField.id) return;

		const { id, field, value } = inlineEditField;
		const item = items.find((i) => i._id === id);
		const parsedValue = field === "quantity" ? Math.floor(Number(value)) : Number(value);

		if (item && item[field] !== parsedValue) {
			try {
				const payload = {};
				payload[field] = parsedValue;
				const response = await authFetch(`${BACKEND_URL}/api/medicines/${id}`, {
					method: "PUT",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				});
				if (response.ok) {
					fetchMyItems();
				} else {
					const errData = await response.json();
					alert(errData.message || "Failed to save inline edit");
				}
			} catch (error) {
				console.error("Inline edit error", error);
			}
		}
		setInlineEditField({ id: null, field: null, value: "" });
	};

	const handleExport = async () => {
		try {
			const response = await authFetch(`${BACKEND_URL}/api/medicines/export`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
			});
			if (!response.ok) throw new Error("Export failed");

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `my_items_export_${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error(error);
			alert("Failed to export items.");
		}
	};

	const openGallery = (item) => {
		setSelectedGalleryItem(item);
		setCurrentImageIndex(0);
	};

	const handleImageUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;
		try {
			const formData = new FormData();
			formData.append("image", file);

			const uploadRes = await authFetch(`${BACKEND_URL}/api/medicines/upload-image`, {
				method: "POST",
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
				body: formData,
			});
			const uploadData = await uploadRes.json();

			if (uploadRes.ok) {
				const newImages = [...(selectedGalleryItem.images || []), uploadData.url];

				await authFetch(`${BACKEND_URL}/api/medicines/${selectedGalleryItem._id}`, {
					method: "PUT",
					headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
					body: JSON.stringify({ images: newImages }),
				});

				setSelectedGalleryItem({ ...selectedGalleryItem, images: newImages });
				setItems(items.map((item) => (item._id === selectedGalleryItem._id ? { ...item, images: newImages } : item)));
			}
		} catch (err) {
			console.error("Upload error", err);
		}
	};

	const confirmRemoveImage = async () => {
		if (imageToDelete === null || !selectedGalleryItem) return;
		try {
			const urlToRemove = selectedGalleryItem.images[imageToDelete];

			await authFetch(`${BACKEND_URL}/api/medicines/delete-images`, {
				method: "POST",
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
				body: JSON.stringify({ urls: [urlToRemove] }),
			});

			const newImages = selectedGalleryItem.images.filter((_, idx) => idx !== imageToDelete);

			await authFetch(`${BACKEND_URL}/api/medicines/${selectedGalleryItem._id}`, {
				method: "PUT",
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
				body: JSON.stringify({ images: newImages }),
			});

			setSelectedGalleryItem({ ...selectedGalleryItem, images: newImages });
			setItems(items.map((item) => (item._id === selectedGalleryItem._id ? { ...item, images: newImages } : item)));

			if (currentImageIndex >= newImages.length) {
				setCurrentImageIndex(Math.max(0, newImages.length - 1));
			}
		} catch (err) {
			console.error("Delete error", err);
		}
		setImageToDelete(null);
	};

	const renderSortIcon = (columnName) => {
		if (sortBy !== columnName) {
			return <ChevronsUpDown size={14} className="inline align-middle text-muted-foreground" />;
		}
		return sortOrder === "asc" ? (
			<ChevronUp size={14} className="inline align-middle" />
		) : (
			<ChevronDown size={14} className="inline align-middle" />
		);
	};

	const handleSortClick = (columnName) => {
		if (sortBy === columnName) {
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			setSortBy(columnName);
			setSortOrder("desc");
		}
	};

	return (
		<DashboardShell>
			<DashboardPageHeader
				title="My Items"
				actions={
					<div className="flex flex-wrap items-center gap-2">
						<Button variant="outline" onClick={handleExport}>
							<Download data-icon="inline-start" /> Export CSV
						</Button>
						<Button onClick={() => (window.location.href = "/manage-products/add")}>
							<Plus data-icon="inline-start" /> Add Product
						</Button>
					</div>
				}
			/>

			<Card className="mb-6 flex flex-row flex-wrap items-center gap-3 p-4">
				<div className="flex min-w-52 flex-1 items-center gap-2 rounded-lg border border-input px-3 py-2">
					<Search className="size-4 shrink-0 text-muted-foreground" />
					<Input
						placeholder="Search products by name..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
					/>
				</div>

				<Select value={categoryFilter} onValueChange={setCategoryFilter} items={CATEGORY_FILTER_OPTIONS}>
					<SelectTrigger className="w-48">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{CATEGORY_FILTER_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={statusFilter} onValueChange={setStatusFilter} items={STATUS_FILTER_OPTIONS}>
					<SelectTrigger className="w-44">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{STATUS_FILTER_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</Card>

			{error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

			{selectedIds.size > 0 ? (
				<Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
					<span className="text-sm font-medium text-foreground">{selectedIds.size} items selected</span>
					<div className="flex gap-2">
						<Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
							Set Active
						</Button>
						<Button size="sm" variant="outline" onClick={() => handleBulkAction("deactivate")}>
							Set Inactive
						</Button>
						<Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
							Delete
						</Button>
					</div>
				</Card>
			) : null}

			<Card className="overflow-hidden p-0">
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10">
									<input
										type="checkbox"
										checked={selectedIds.size === items.length && items.length > 0}
										onChange={toggleSelectAll}
									/>
								</TableHead>
								<TableHead>Image</TableHead>
								<TableHead className="cursor-pointer select-none" onClick={() => handleSortClick("name")}>
									Product Name {renderSortIcon("name")}
								</TableHead>
								<TableHead className="cursor-pointer select-none" onClick={() => handleSortClick("category")}>
									Category {renderSortIcon("category")}
								</TableHead>
								<TableHead className="cursor-pointer select-none" onClick={() => handleSortClick("price")}>
									Price {renderSortIcon("price")}
								</TableHead>
								<TableHead className="cursor-pointer select-none" onClick={() => handleSortClick("quantity")}>
									Stock {renderSortIcon("quantity")}
								</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								[1, 2, 3, 4, 5].map((n) => (
									<TableRow key={n}>
										<TableCell>
											<Skeleton className="mx-auto size-4" />
										</TableCell>
										<TableCell>
											<Skeleton className="size-12 rounded-md" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-32" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-24" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-16" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-5 w-20 rounded-full" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-5 w-9 rounded-full" />
										</TableCell>
										<TableCell>
											<Skeleton className="h-4 w-16" />
										</TableCell>
									</TableRow>
								))
							) : items.length === 0 ? (
								<TableRow>
									<TableCell colSpan={8} className="py-12 text-center">
										<h3 className="font-semibold text-foreground">No products found</h3>
										<p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
									</TableCell>
								</TableRow>
							) : (
								items.map((item) => {
									const isSelected = selectedIds.has(item._id);
									const isActive = item.isActive !== false;

									return (
										<TableRow key={item._id} className={isSelected ? "bg-muted/40" : undefined}>
											<TableCell>
												<input type="checkbox" checked={isSelected} onChange={() => toggleSelection(item._id)} />
											</TableCell>
											<TableCell onClick={() => openGallery(item)} className="cursor-pointer" title="View Images">
												{item.images && item.images.length > 0 ? (
													<img
														src={
															item.images[0].startsWith("http")
																? item.images[0]
																: `${BACKEND_URL}/${item.images[0].replace(/\\/g, "/")}`
														}
														alt={item.name}
														className="size-12 rounded-md object-cover"
													/>
												) : (
													<div className="flex size-12 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
														No Img
													</div>
												)}
											</TableCell>
											<TableCell className="font-semibold text-foreground">{item.name}</TableCell>
											<TableCell>{item.category}</TableCell>
											<TableCell
												onClick={() => setInlineEditField({ id: item._id, field: "price", value: item.price })}
												className="cursor-pointer"
												title="Click to edit price"
											>
												{inlineEditField.id === item._id && inlineEditField.field === "price" ? (
													<Input
														type="number"
														autoFocus
														className="h-8 w-20"
														value={inlineEditField.value}
														onChange={(e) => setInlineEditField({ ...inlineEditField, value: e.target.value })}
														onBlur={handleInlineSave}
														onKeyDown={(e) => e.key === "Enter" && handleInlineSave()}
													/>
												) : (
													`₹${item.price}`
												)}
											</TableCell>
											<TableCell
												onClick={() => setInlineEditField({ id: item._id, field: "quantity", value: item.quantity })}
												className="cursor-pointer"
												title="Click to edit stock"
											>
												{inlineEditField.id === item._id && inlineEditField.field === "quantity" ? (
													<Input
														type="number"
														autoFocus
														className="h-8 w-16"
														value={inlineEditField.value}
														onChange={(e) => setInlineEditField({ ...inlineEditField, value: e.target.value })}
														onBlur={handleInlineSave}
														onKeyDown={(e) => e.key === "Enter" && handleInlineSave()}
													/>
												) : (
													<Badge variant={stockBadgeVariant(item.quantity)}>{item.quantity} in stock</Badge>
												)}
											</TableCell>
											<TableCell>
												<Switch checked={isActive} onCheckedChange={() => handleStatusToggle(item._id, isActive)} />
											</TableCell>
											<TableCell>
												<div className="flex gap-1.5">
													<Button variant="ghost" size="icon" onClick={() => openEditDrawer(item)} title="Edit">
														<Edit2 size={16} />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="text-destructive hover:text-destructive"
														onClick={() => deleteItem(item._id)}
														title="Delete"
													>
														<Trash2 size={16} />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</div>
			</Card>

			{totalPages > 0 ? (
				<div className="mt-4 flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span>Rows per page:</span>
						<Select
							value={String(limit)}
							onValueChange={(v) => {
								setLimit(Number(v));
								setPage(1);
							}}
						>
							<SelectTrigger className="w-20">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="10">10</SelectItem>
								<SelectItem value="20">20</SelectItem>
								<SelectItem value="50">50</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-4">
						<span className="text-sm text-muted-foreground">
							Page {page} of {totalPages} ({totalItems} items)
						</span>
						<div className="flex gap-2">
							<Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
								<ChevronLeft size={16} />
							</Button>
							<Button
								variant="outline"
								size="icon"
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page === totalPages}
							>
								<ChevronRight size={16} />
							</Button>
						</div>
					</div>
				</div>
			) : null}

			{/* Edit Drawer */}
			<Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Edit Product</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="name">Name</FieldLabel>
								<Input id="name" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
							</Field>
							<Field>
								<FieldLabel htmlFor="price">Price (₹)</FieldLabel>
								<Input
									id="price"
									type="number"
									required
									value={editForm.price}
									onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="quantity">Quantity</FieldLabel>
								<Input
									id="quantity"
									type="number"
									required
									value={editForm.quantity}
									onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="category">Category</FieldLabel>
								<Input
									id="category"
									required
									value={editForm.category}
									onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="description">Description</FieldLabel>
								<Textarea
									id="description"
									required
									rows={3}
									value={editForm.description}
									onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
								/>
							</Field>
							<Field orientation="horizontal">
								<input
									type="checkbox"
									id="prescription"
									className="size-4"
									checked={editForm.prescription}
									onChange={(e) => setEditForm({ ...editForm, prescription: e.target.checked })}
								/>
								<FieldLabel htmlFor="prescription">Requires Prescription</FieldLabel>
							</Field>
							<Field orientation="horizontal">
								<input
									type="checkbox"
									id="isActive"
									className="size-4"
									checked={editForm.isActive}
									onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
								/>
								<FieldLabel htmlFor="isActive">Active (Visible to users)</FieldLabel>
							</Field>
						</FieldGroup>

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setIsDrawerOpen(false)}>
								Cancel
							</Button>
							<Button type="submit">Save Changes</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Image Gallery Modal */}
			<Dialog open={!!selectedGalleryItem} onOpenChange={(open) => !open && setSelectedGalleryItem(null)}>
				<DialogContent className="max-w-2xl">
					{selectedGalleryItem ? (
						<>
							<div className="relative flex min-h-64 items-center justify-center rounded-lg bg-muted/40">
								{selectedGalleryItem.images && selectedGalleryItem.images.length > 0 ? (
									<>
										<img
											src={
												selectedGalleryItem.images[currentImageIndex].startsWith("http")
													? selectedGalleryItem.images[currentImageIndex]
													: `${BACKEND_URL}/${selectedGalleryItem.images[currentImageIndex].replace(/\\/g, "/")}`
											}
											alt="Product"
											className="max-h-[50vh] w-full rounded-lg object-contain"
										/>
										{selectedGalleryItem.images.length > 1 ? (
											<>
												<button
													className="absolute left-2 flex size-9 items-center justify-center rounded-full bg-card/80 text-foreground shadow"
													onClick={() =>
														setCurrentImageIndex((prev) =>
															prev === 0 ? selectedGalleryItem.images.length - 1 : prev - 1
														)
													}
												>
													<ChevronLeft size={20} />
												</button>
												<button
													className="absolute right-2 flex size-9 items-center justify-center rounded-full bg-card/80 text-foreground shadow"
													onClick={() =>
														setCurrentImageIndex((prev) =>
															prev === selectedGalleryItem.images.length - 1 ? 0 : prev + 1
														)
													}
												>
													<ChevronRight size={20} />
												</button>
											</>
										) : null}
									</>
								) : (
									<div className="text-muted-foreground">No images available</div>
								)}
							</div>

							<div className="flex flex-wrap gap-2">
								{selectedGalleryItem.images?.map((imgUrl, idx) => (
									<div
										key={idx}
										onClick={() => setCurrentImageIndex(idx)}
										className={
											currentImageIndex === idx
												? "relative size-16 cursor-pointer rounded-md border-2 border-primary"
												: "relative size-16 cursor-pointer rounded-md border border-border"
										}
									>
										<img
											src={imgUrl.startsWith("http") ? imgUrl : `${BACKEND_URL}/${imgUrl.replace(/\\/g, "/")}`}
											alt="Thumbnail"
											className="size-full rounded-md object-cover"
										/>
										<button
											onClick={(e) => {
												e.stopPropagation();
												setImageToDelete(idx);
											}}
											title="Remove Image"
											className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
										>
											<Trash2 size={11} />
										</button>
									</div>
								))}

								<button
									onClick={() => fileInputRef.current?.click()}
									title="Add Image"
									className="flex size-16 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground hover:text-primary"
								>
									<Plus size={24} />
								</button>
								<input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
							</div>

							{imageToDelete !== null ? (
								<div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
									<h3 className="font-semibold text-foreground">Remove Image?</h3>
									<p className="mt-1 text-sm text-muted-foreground">
										Are you sure you want to delete this image?
										<br />
										<small>
											(Press <strong>Enter</strong> to confirm, <strong>Esc</strong> to cancel)
										</small>
									</p>
									<div className="mt-3 flex gap-2">
										<Button variant="outline" size="sm" onClick={() => setImageToDelete(null)}>
											Cancel (Esc)
										</Button>
										<Button variant="destructive" size="sm" onClick={confirmRemoveImage}>
											Delete (Enter)
										</Button>
									</div>
								</div>
							) : null}
						</>
					) : null}
				</DialogContent>
			</Dialog>
		</DashboardShell>
	);
}

export default MyItems;
