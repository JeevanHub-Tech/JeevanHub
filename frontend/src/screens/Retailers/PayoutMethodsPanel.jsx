import { useState, useEffect } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
	Landmark, 
	Smartphone, 
	Plus, 
	CheckCircle2, 
	Trash2, 
	Edit3, 
	Star, 
	AlertCircle,
	Eye,
	EyeOff,
	ShieldCheck
} from "lucide-react";

const PayoutMethodsPanel = ({ retailerId, token }) => {
	const [methods, setMethods] = useState([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState("");
	const [successMsg, setSuccessMsg] = useState("");

	// Dialog state
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [selectedType, setSelectedType] = useState("bank_account"); // 'bank_account' | 'upi'
	const [showAccountNumbers, setShowAccountNumbers] = useState({});

	// Form state
	const [formData, setFormData] = useState({
		accountHolderName: "",
		accountNumber: "",
		confirmAccountNumber: "",
		ifscCode: "",
		bankName: "",
		upiId: "",
		isPrimary: false
	});

	const fetchPayoutMethods = async () => {
		try {
			setLoading(true);
			const res = await axios.get(`${BACKEND_URL}/api/retailers/${retailerId}/payout-methods`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			setMethods(res.data.payoutMethods || []);
		} catch (err) {
			console.error("Failed to load payout methods:", err);
			setError("Failed to load payout methods. Please refresh.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (retailerId && token) {
			fetchPayoutMethods();
		}
	}, [retailerId, token]);

	const handleOpenAdd = () => {
		setEditingId(null);
		setSelectedType("bank_account");
		setFormData({
			accountHolderName: "",
			accountNumber: "",
			confirmAccountNumber: "",
			ifscCode: "",
			bankName: "",
			upiId: "",
			isPrimary: methods.length === 0
		});
		setError("");
		setIsModalOpen(true);
	};

	const handleOpenEdit = (method) => {
		setEditingId(method._id);
		setSelectedType(method.type);
		setFormData({
			accountHolderName: method.accountHolderName || "",
			accountNumber: method.accountNumber || "",
			confirmAccountNumber: method.accountNumber || "",
			ifscCode: method.ifscCode || "",
			bankName: method.bankName || "",
			upiId: method.upiId || "",
			isPrimary: Boolean(method.isPrimary)
		});
		setError("");
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingId(null);
		setError("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!formData.accountHolderName.trim()) {
			setError("Please enter the account holder / beneficiary name.");
			return;
		}

		if (selectedType === "bank_account") {
			if (!formData.accountNumber.trim()) {
				setError("Account number is required.");
				return;
			}
			if (formData.accountNumber.trim() !== formData.confirmAccountNumber.trim()) {
				setError("Account numbers do not match. Please verify.");
				return;
			}
			if (!formData.ifscCode.trim()) {
				setError("IFSC code is required.");
				return;
			}
		} else if (selectedType === "upi") {
			if (!formData.upiId.trim() || !formData.upiId.includes("@")) {
				setError("Please enter a valid UPI ID (e.g. pharmacy@okhdfcbank).");
				return;
			}
		}

		try {
			setActionLoading(true);
			const payload = {
				type: selectedType,
				accountHolderName: formData.accountHolderName.trim(),
				accountNumber: selectedType === "bank_account" ? formData.accountNumber.trim() : null,
				ifscCode: selectedType === "bank_account" ? formData.ifscCode.trim().toUpperCase() : null,
				bankName: selectedType === "bank_account" ? formData.bankName.trim() : null,
				upiId: selectedType === "upi" ? formData.upiId.trim().toLowerCase() : null,
				isPrimary: formData.isPrimary
			};

			if (editingId) {
				const res = await axios.put(
					`${BACKEND_URL}/api/retailers/${retailerId}/payout-methods/${editingId}`,
					payload,
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				setMethods(res.data.payoutMethods || []);
				setSuccessMsg("Payout method updated successfully.");
			} else {
				const res = await axios.post(
					`${BACKEND_URL}/api/retailers/${retailerId}/payout-methods`,
					payload,
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				setMethods(res.data.payoutMethods || []);
				setSuccessMsg("New payout method added successfully.");
			}

			handleCloseModal();
			setTimeout(() => setSuccessMsg(""), 4000);
		} catch (err) {
			console.error("Error saving payout method:", err);
			setError(err.response?.data?.message || "Failed to save payout method.");
		} finally {
			setActionLoading(false);
		}
	};

	const handleSetPrimary = async (methodId) => {
		try {
			setActionLoading(true);
			const res = await axios.patch(
				`${BACKEND_URL}/api/retailers/${retailerId}/payout-methods/${methodId}/primary`,
				{},
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setMethods(res.data.payoutMethods || []);
			setSuccessMsg("Active payout method updated.");
			setTimeout(() => setSuccessMsg(""), 3000);
		} catch (err) {
			console.error("Failed to set primary method:", err);
			alert(err.response?.data?.message || "Could not set primary method.");
		} finally {
			setActionLoading(false);
		}
	};

	const handleDelete = async (methodId, isPrimary) => {
		const confirmMsg = isPrimary && methods.length > 1
			? "This is your active payout method. Deleting it will make another method active. Proceed?"
			: "Are you sure you want to remove this payout method?";
		
		if (!window.confirm(confirmMsg)) return;

		try {
			setActionLoading(true);
			const res = await axios.delete(
				`${BACKEND_URL}/api/retailers/${retailerId}/payout-methods/${methodId}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			setMethods(res.data.payoutMethods || []);
			setSuccessMsg("Payout method removed.");
			setTimeout(() => setSuccessMsg(""), 3000);
		} catch (err) {
			console.error("Failed to delete payout method:", err);
			alert(err.response?.data?.message || "Could not delete payout method.");
		} finally {
			setActionLoading(false);
		}
	};

	const toggleShowAccount = (id) => {
		setShowAccountNumbers(prev => ({ ...prev, [id]: !prev[id] }));
	};

	const maskAccount = (acc, isVisible) => {
		if (!acc) return "";
		if (isVisible) return acc;
		if (acc.length <= 4) return acc;
		return "•••• •••• " + acc.slice(-4);
	};

	if (loading) {
		return (
			<Card className="p-6">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
					Loading Payout Methods...
				</div>
			</Card>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Main Card */}
			<Card className="p-6">
				<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
					<div>
						<div className="flex items-center gap-2">
							<h3 className="text-lg font-semibold text-foreground">Disbursement & Payout Methods</h3>
							<Badge variant="outline" className="text-xs border-emerald-600/30 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20">
								<ShieldCheck className="size-3 mr-1" /> Direct IMPS / UPI
							</Badge>
						</div>
						<p className="text-sm text-muted-foreground mt-0.5">
							Manage the accounts where your order earnings are transferred following the 7-day post-delivery lock-in period.
						</p>
					</div>
					<Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
						<Plus className="size-4 mr-1.5" /> Add Payout Method
					</Button>
				</div>

				{successMsg && (
					<div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40">
						<CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
						{successMsg}
					</div>
				)}

				{methods.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center bg-muted/20">
						<div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600 mb-3">
							<Landmark className="size-6" />
						</div>
						<h4 className="font-semibold text-foreground">No Payout Methods Linked</h4>
						<p className="text-xs text-muted-foreground max-w-md mt-1 mb-4">
							Add your bank account or UPI ID. Your medicines will become visible to customers once your payout method is linked and verified.
						</p>
						<Button onClick={handleOpenAdd} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
							<Plus className="size-4 mr-1.5" /> Add Bank Account or UPI
						</Button>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{methods.map((method) => {
							const isAccVisible = showAccountNumbers[method._id];
							return (
								<div
									key={method._id}
									className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
										method.isPrimary
											? "border-emerald-600 bg-emerald-500/5 shadow-xs ring-1 ring-emerald-600/20"
											: "border-border bg-card hover:border-border/80"
									}`}
								>
									<div>
										<div className="flex items-start justify-between gap-2 mb-3">
											<div className="flex items-center gap-2.5">
												<div className={`p-2 rounded-lg ${method.type === 'upi' ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-950/30' : 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/30'}`}>
													{method.type === 'upi' ? <Smartphone className="size-4" /> : <Landmark className="size-4" />}
												</div>
												<div>
													<div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
														{method.type === 'upi' ? 'UPI VPA' : (method.bankName || 'Bank Account')}
													</div>
													<div className="font-semibold text-sm text-foreground">
														{method.accountHolderName}
													</div>
												</div>
											</div>
											{method.isPrimary ? (
												<Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1">
													<CheckCircle2 className="size-3" /> Active Payout
												</Badge>
											) : (
												<Badge variant="outline" className="text-xs text-muted-foreground">
													Secondary
												</Badge>
											)}
										</div>

										<div className="rounded-lg bg-background/80 p-3 text-xs border border-border/60 mb-3 space-y-1.5">
											{method.type === 'bank_account' ? (
												<>
													<div className="flex items-center justify-between text-muted-foreground">
														<span>A/C Number:</span>
														<div className="flex items-center gap-1.5 font-mono font-medium text-foreground">
															<span>{maskAccount(method.accountNumber, isAccVisible)}</span>
															<button
																type="button"
																onClick={() => toggleShowAccount(method._id)}
																className="text-muted-foreground hover:text-foreground cursor-pointer"
															>
																{isAccVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
															</button>
														</div>
													</div>
													<div className="flex items-center justify-between text-muted-foreground">
														<span>IFSC Code:</span>
														<span className="font-mono font-medium text-foreground">{method.ifscCode}</span>
													</div>
												</>
											) : (
												<div className="flex items-center justify-between text-muted-foreground">
													<span>VPA Address:</span>
													<span className="font-mono font-medium text-purple-700 dark:text-purple-300">{method.upiId}</span>
												</div>
											)}
										</div>
									</div>

									<div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
										<div>
											{!method.isPrimary && (
												<Button
													variant="ghost"
													size="sm"
													disabled={actionLoading}
													onClick={() => handleSetPrimary(method._id)}
													className="h-7 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400"
												>
													<Star className="size-3 mr-1" /> Set as Active
												</Button>
											)}
										</div>
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="sm"
												disabled={actionLoading}
												onClick={() => handleOpenEdit(method)}
												className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
											>
												<Edit3 className="size-3 mr-1" /> Edit
											</Button>
											<Button
												variant="ghost"
												size="sm"
												disabled={actionLoading}
												onClick={() => handleDelete(method._id, method.isPrimary)}
												className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
											>
												<Trash2 className="size-3 mr-1" /> Delete
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</Card>

			{/* Add / Edit Payout Method Modal */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-base font-semibold">
							{editingId ? "Edit Payout Method" : "Add Payout Method"}
						</DialogTitle>
					</DialogHeader>

					{error && (
						<div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
							<AlertCircle className="size-4 shrink-0" />
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4 pt-1">
						{!editingId && (
							<div>
								<label className="text-xs font-medium text-foreground block mb-1.5">Payment Method Type</label>
								<div className="grid grid-cols-2 gap-2">
									<button
										type="button"
										onClick={() => setSelectedType("bank_account")}
										className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
											selectedType === "bank_account"
												? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-500"
												: "border-border bg-card text-muted-foreground hover:text-foreground"
										}`}
									>
										<Landmark className="size-4" /> Bank Account (IMPS/NEFT)
									</button>
									<button
										type="button"
										onClick={() => setSelectedType("upi")}
										className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
											selectedType === "upi"
												? "border-purple-600 bg-purple-50 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-500"
												: "border-border bg-card text-muted-foreground hover:text-foreground"
										}`}
									>
										<Smartphone className="size-4" /> UPI ID (Instant VPA)
									</button>
								</div>
							</div>
						)}

						<FieldGroup className="space-y-3">
							<Field>
								<FieldLabel htmlFor="accountHolderName" className="text-xs">
									Beneficiary / Account Holder Name *
								</FieldLabel>
								<Input
									id="accountHolderName"
									value={formData.accountHolderName}
									onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
									placeholder="Exact name registered on bank or UPI"
									required
								/>
							</Field>

							{selectedType === "bank_account" ? (
								<>
									<Field>
										<FieldLabel htmlFor="bankName" className="text-xs">
											Bank Name (Optional)
										</FieldLabel>
										<Input
											id="bankName"
											value={formData.bankName}
											onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
											placeholder="e.g. HDFC Bank, SBI, ICICI"
										/>
									</Field>

									<Field>
										<FieldLabel htmlFor="accountNumber" className="text-xs">
											Bank Account Number *
										</FieldLabel>
										<Input
											id="accountNumber"
											type="password"
											value={formData.accountNumber}
											onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
											placeholder="9 to 18 digits account number"
											required
										/>
									</Field>

									<Field>
										<FieldLabel htmlFor="confirmAccountNumber" className="text-xs">
											Confirm Account Number *
										</FieldLabel>
										<Input
											id="confirmAccountNumber"
											value={formData.confirmAccountNumber}
											onChange={(e) => setFormData({ ...formData, confirmAccountNumber: e.target.value })}
											placeholder="Re-enter account number"
											required
										/>
									</Field>

									<Field>
										<FieldLabel htmlFor="ifscCode" className="text-xs">
											IFSC Code *
										</FieldLabel>
										<Input
											id="ifscCode"
											value={formData.ifscCode}
											onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
											placeholder="e.g. HDFC0001234"
											maxLength={11}
											required
										/>
									</Field>
								</>
							) : (
								<Field>
									<FieldLabel htmlFor="upiId" className="text-xs">
										UPI ID / VPA *
									</FieldLabel>
									<Input
										id="upiId"
										value={formData.upiId}
										onChange={(e) => setFormData({ ...formData, upiId: e.target.value.toLowerCase() })}
										placeholder="e.g. yourstore@okhdfcbank or 9999999999@upi"
										required
									/>
									<p className="text-[11px] text-muted-foreground mt-1">
										Disbursements sent via RazorpayX instant UPI transfer.
									</p>
								</Field>
							)}

							<div className="flex items-center gap-2 pt-1">
								<input
									type="checkbox"
									id="isPrimary"
									checked={formData.isPrimary}
									onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
									className="size-4 rounded border-input text-emerald-600 focus:ring-emerald-500 cursor-pointer"
								/>
								<label htmlFor="isPrimary" className="text-xs font-medium text-foreground cursor-pointer">
									Set this as my active payout method for orders
								</label>
							</div>
						</FieldGroup>

						<div className="flex items-center justify-end gap-2 pt-3 border-t">
							<Button type="button" variant="outline" size="sm" onClick={handleCloseModal}>
								Cancel
							</Button>
							<Button type="submit" size="sm" disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
								{actionLoading ? "Saving..." : editingId ? "Update Method" : "Save Payout Method"}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default PayoutMethodsPanel;
