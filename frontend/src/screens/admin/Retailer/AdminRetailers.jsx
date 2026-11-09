import { useEffect, useState } from "react";
import { Upload, CheckCircle2, XCircle, ShieldCheck, ShieldAlert } from "lucide-react";

import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";

const AdminRetailers = () => {
	const [retailers, setRetailers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [file, setFile] = useState(null);
	const [togglingId, setTogglingId] = useState(null);

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
			setLoading(false);
		}
	};

	const handleToggleVerify = async (retailer) => {
		const isCurrentlyVerified = Boolean(retailer.adminVerification?.isVerified);
		const actionPrompt = isCurrentlyVerified ? "revoke verification for" : "approve & verify";
		if (!window.confirm(`Are you sure you want to ${actionPrompt} ${retailer.firstName} ${retailer.lastName}?`)) {
			return;
		}

		setTogglingId(retailer._id);
		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/retailers/${retailer._id}/verify`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ isVerified: !isCurrentlyVerified })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to update verification");
			}

			const result = await response.json();
			setRetailers(prev => prev.map(r => {
				if (r._id === retailer._id) {
					return {
						...r,
						adminVerification: result.adminVerification || {
							...r.adminVerification,
							isVerified: !isCurrentlyVerified,
							verifiedAt: !isCurrentlyVerified ? new Date() : null,
						}
					};
				}
				return r;
			}));
		} catch (error) {
			console.error("Error toggling verification:", error);
			alert(error.message || "Failed to toggle verification");
		} finally {
			setTogglingId(null);
		}
	};

	const handleLinkRazorpay = async (retailer) => {
		const defaultId = retailer.razorpayAccountId || `acc_${retailer._id.toString().slice(-8)}`;
		const promptId = window.prompt(
			`Enter Razorpay Linked Account ID for ${retailer.firstName} ${retailer.lastName} (or keep default to approve for testing):`,
			defaultId
		);
		if (promptId === null) return;
		const accountId = promptId.trim() || defaultId;

		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/retailers/${retailer._id}/verify`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ isVerified: true, razorpayAccountId: accountId })
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(err.message || "Failed to link account");
			}

			alert(`Razorpay account linked successfully: ${accountId}`);
			fetchRetailers();
		} catch (error) {
			console.error("Error linking Razorpay account:", error);
			alert(error.message || "Failed to link Razorpay account");
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
								<TableHead>Retailer / Business</TableHead>
								<TableHead>Contact</TableHead>
								<TableHead>Courier Partner</TableHead>
								<TableHead>Warehouse</TableHead>
								<TableHead>Payout Setup</TableHead>
								<TableHead>Verification</TableHead>
								<TableHead className="text-right">Actions</TableHead>
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
								retailers.map((retailer) => {
									const isVerified = Boolean(retailer.adminVerification?.isVerified);
									const courierLinked = Boolean(retailer.shippingIntegrations?.delhivery?.isConfigured);
									const warehouseSet = Boolean(retailer.warehouse?.isConfigured);
									const primaryPayout = retailer.payoutMethods?.find(m => m.isPrimary) || retailer.payoutMethods?.[0];
									const hasPayout = Boolean(primaryPayout || retailer.bankDetails?.isSubmitted || retailer.razorpayAccountId);

									return (
										<TableRow key={retailer._id}>
											<TableCell>
												<div className="font-medium text-foreground">
													{retailer.firstName} {retailer.lastName}
												</div>
												<div className="text-xs text-muted-foreground">
													{retailer.BusinessName || "No business name"} • Zip: {retailer.zipCode || "N/A"}
												</div>
											</TableCell>
											<TableCell>
												<div className="text-sm">{retailer.email}</div>
												<div className="text-xs text-muted-foreground">{retailer.phone}</div>
											</TableCell>
											<TableCell>
												{courierLinked ? (
													<Badge variant="outline" className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-xs py-0">
														<CheckCircle2 className="size-3 mr-1" />
														Delhivery
													</Badge>
												) : (
													<Badge variant="outline" className="border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-xs py-0">
														<XCircle className="size-3 mr-1" />
														Missing
													</Badge>
												)}
											</TableCell>
											<TableCell>
												{warehouseSet ? (
													<Badge variant="outline" className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-xs py-0">
														<CheckCircle2 className="size-3 mr-1" />
														Configured
													</Badge>
												) : (
													<Badge variant="outline" className="border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-xs py-0">
														<XCircle className="size-3 mr-1" />
														Missing
													</Badge>
												)}
											</TableCell>
											<TableCell>
												{primaryPayout ? (
													<Badge variant="outline" className="border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-xs py-0">
														<CheckCircle2 className="size-3 mr-1" />
														{primaryPayout.type === 'upi' ? `UPI: ${primaryPayout.upiId}` : `A/C: ••${primaryPayout.accountNumber?.slice(-4) || 'XXXX'}`}
													</Badge>
												) : retailer.bankDetails?.isSubmitted ? (
													<Badge variant="outline" className="border-emerald-500/30 bg-emerald-50 text-emerald-700 text-xs py-0">
														<CheckCircle2 className="size-3 mr-1" />
														Bank: ••{retailer.bankDetails.accountNumber?.slice(-4) || 'XXXX'}
													</Badge>
												) : (
													<Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-xs py-0">
														Not Linked
													</Badge>
												)}
											</TableCell>
											<TableCell>
												{isVerified ? (
													<Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1">
														<ShieldCheck className="size-3" />
														Verified
													</Badge>
												) : (
													<Badge variant="secondary" className="text-xs gap-1 text-muted-foreground">
														<ShieldAlert className="size-3" />
														Unverified
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex items-center justify-end gap-2">
													<Button
														variant={isVerified ? "outline" : "default"}
														size="sm"
														disabled={togglingId === retailer._id}
														onClick={() => handleToggleVerify(retailer)}
														className={isVerified ? "border-amber-500/40 text-amber-700 hover:bg-amber-50" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
													>
														{togglingId === retailer._id
															? "Updating..."
															: isVerified
															? "Revoke"
															: "Verify Seller"}
													</Button>
													<Button variant="destructive" size="sm" onClick={() => handleDelete(retailer._id)}>
														Delete
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
		</DashboardShell>
	);
};

export default AdminRetailers;
