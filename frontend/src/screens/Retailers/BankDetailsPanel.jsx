import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { BACKEND_URL } from "../../config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const BankDetailsPanel = ({ retailerId, token }) => {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	
	const [bankDetails, setBankDetails] = useState({
		accountHolderName: "",
		accountNumber: "",
		ifscCode: "",
		businessType: "individual"
	});
	const [razorpayAccountId, setRazorpayAccountId] = useState(null);

	useEffect(() => {
		const fetchBankDetails = async () => {
			try {
				const response = await axios.get(
					`${BACKEND_URL}/api/retailers/${retailerId}/bank-details`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				
				if (response.data.bankDetails) {
					setBankDetails(prev => ({
						...prev,
						...response.data.bankDetails
					}));
				}
				setRazorpayAccountId(response.data.razorpayAccountId);
			} catch (error) {
				console.error("Error fetching bank details:", error);
			} finally {
				setFetching(false);
			}
		};

		if (retailerId && token) {
			fetchBankDetails();
		}
	}, [retailerId, token]);

	const handleInputChange = (e) => {
		setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			await axios.put(
				`${BACKEND_URL}/api/retailers/${retailerId}/bank-details`,
				bankDetails,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			alert(t("retailerBankDetails.alerts.saveSuccess", "Bank details saved successfully. Our team will verify and link your account for payouts."));
			setIsEditing(false);
		} catch (error) {
			console.error("Error saving bank details:", error);
			alert(error.response?.data?.message || t("retailerBankDetails.alerts.saveFailed", "Failed to save bank details."));
		} finally {
			setLoading(false);
		}
	};

	if (fetching) return <Card className="p-6">{t("retailerBankDetails.loading", "Loading Bank Details...")}</Card>;

	return (
		<Card className="p-6">
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h3 className="text-lg font-semibold text-foreground">{t("retailerBankDetails.title", "Bank Account Details (Payouts)")}</h3>
					<p className="text-sm text-muted-foreground">{t("retailerBankDetails.subtitle", "Provide your bank details to receive payouts for your orders.")}</p>
				</div>
				<div className="flex gap-2">
					{isEditing ? (
						<>
							<Button onClick={handleSave} disabled={loading}>
								{loading ? t("retailerBankDetails.saving", "Saving...") : t("retailerBankDetails.saveDetails", "Save Details")}
							</Button>
							<Button variant="outline" onClick={() => setIsEditing(false)}>
								{t("retailerBankDetails.cancel", "Cancel")}
							</Button>
						</>
					) : (
						<Button variant="outline" onClick={() => setIsEditing(true)}>
							{t("retailerBankDetails.editBankDetails", "Edit Bank Details")}
						</Button>
					)}
				</div>
			</div>

			{razorpayAccountId && !isEditing && (
				<div className="mb-4 rounded bg-green-100 p-3 text-sm text-green-800">
					{t("retailerBankDetails.verifiedMessage", { id: razorpayAccountId, defaultValue: `✅ Your bank account is verified and successfully linked for payouts. (Account ID: ${razorpayAccountId})` })}
				</div>
			)}
			
			{!razorpayAccountId && bankDetails.isSubmitted && !isEditing && (
				<div className="mb-4 rounded bg-yellow-100 p-3 text-sm text-yellow-800">
					{t("retailerBankDetails.reviewMessage", "⏳ Your bank details are under review. Payouts will start once verified by the admin.")}
				</div>
			)}

			<form onSubmit={handleSave}>
				<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="accountHolderName">{t("retailerBankDetails.accountHolderName", "Account Holder Name")}</FieldLabel>
						<Input
							id="accountHolderName"
							name="accountHolderName"
							value={bankDetails.accountHolderName || ""}
							onChange={handleInputChange}
							disabled={!isEditing}
							placeholder={t("retailerBankDetails.accountHolderNamePlaceholder", "Exact name as per bank records")}
							required
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="accountNumber">{t("retailerBankDetails.accountNumber", "Account Number")}</FieldLabel>
						<Input
							id="accountNumber"
							name="accountNumber"
							type="password"
							value={bankDetails.accountNumber || ""}
							onChange={handleInputChange}
							disabled={!isEditing}
							placeholder={t("retailerBankDetails.accountNumberPlaceholder", "1234567890")}
							required
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="ifscCode">{t("retailerBankDetails.ifscCode", "IFSC Code")}</FieldLabel>
						<Input
							id="ifscCode"
							name="ifscCode"
							value={bankDetails.ifscCode || ""}
							onChange={handleInputChange}
							disabled={!isEditing}
							placeholder={t("retailerBankDetails.ifscCodePlaceholder", "HDFC0001234")}
							required
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="businessType">{t("retailerBankDetails.businessType", "Business Type")}</FieldLabel>
						<Select 
							value={bankDetails.businessType || "individual"}
							onValueChange={(value) => setBankDetails({ ...bankDetails, businessType: value })}
							disabled={!isEditing}
						>
							<SelectTrigger id="businessType">
								<SelectValue placeholder={t("retailerBankDetails.selectBusinessType", "Select Business Type")} />
							</SelectTrigger>
							<SelectContent>
								<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
									{t("retailerBankDetails.standardFastOnboarding", "Standard (Fast Onboarding)")}
								</div>
								<SelectItem value="individual">{t("retailerBankDetails.types.individual", "Individual")}</SelectItem>
								<SelectItem value="proprietorship">{t("retailerBankDetails.types.proprietorship", "Proprietorship")}</SelectItem>
								
								<div className="my-1 h-px bg-border" />

								<div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground leading-tight">
									{t("retailerBankDetails.corporateKycNotice", "Corporate (Razorpay may email you for KYC docs)")}
								</div>
								<SelectItem value="partnership">{t("retailerBankDetails.types.partnership", "Partnership")}</SelectItem>
								<SelectItem value="private_limited">{t("retailerBankDetails.types.private_limited", "Private Limited")}</SelectItem>
								<SelectItem value="public_limited">{t("retailerBankDetails.types.public_limited", "Public Limited")}</SelectItem>
								<SelectItem value="llp">{t("retailerBankDetails.types.llp", "LLP")}</SelectItem>
								<SelectItem value="trust">{t("retailerBankDetails.types.trust", "Trust")}</SelectItem>
								<SelectItem value="society">{t("retailerBankDetails.types.society", "Society")}</SelectItem>
								<SelectItem value="ngo">{t("retailerBankDetails.types.ngo", "NGO")}</SelectItem>
							</SelectContent>
						</Select>
					</Field>
				</FieldGroup>
			</form>
		</Card>
	);
};

export default BankDetailsPanel;

