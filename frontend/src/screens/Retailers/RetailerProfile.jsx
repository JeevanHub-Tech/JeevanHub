import { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { 
	Camera, 
	User, 
	CreditCard, 
	Truck, 
	ShieldCheck, 
	ShieldAlert, 
	CheckCircle2, 
	AlertCircle,
	Lock
} from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import defaultProfilePic from "../../media/default-profile.png";
import { BACKEND_URL } from "../../config";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

import ShippingSettingsPanel from "./ShippingSettingsPanel";
import PayoutMethodsPanel from "./PayoutMethodsPanel";

const VALID_TABS = ["personal", "payouts", "shipping", "verification"];

const RetailerProfile = () => {
	const { t } = useTranslation();
	const { auth, setAuth, logout, loading: authLoading } = useContext(AuthContext);
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	const retailerId = auth?.user?.id || auth?.user?._id;
	const tabParam = searchParams.get("tab");
	const [activeTab, setActiveTab] = useState(
		VALID_TABS.includes(tabParam) ? tabParam : "personal"
	);

	useEffect(() => {
		const currentTabFromUrl = searchParams.get("tab");
		if (currentTabFromUrl && VALID_TABS.includes(currentTabFromUrl) && currentTabFromUrl !== activeTab) {
			setActiveTab(currentTabFromUrl);
		}
	}, [searchParams]);

	const handleTabChange = (newTab) => {
		setActiveTab(newTab);
		setSearchParams({ tab: newTab });
	};

	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [retailerData, setRetailerData] = useState({
		firstName: "",
		lastName: "",
		BusinessName: "",
		licenseNumber: "DL-AY-10001",
		email: "",
		phone: "",
		address: "",
		profileImage: "",
		adminVerification: null,
		warehouse: null,
		shippingIntegrations: null
	});

	const [passwords, setPasswords] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	useEffect(() => {
		const fetchRetailerData = async () => {
			if (!retailerId || !auth?.token) return;
			try {
				const response = await axios.get(
					`${BACKEND_URL || "http://localhost:5000"}/api/retailers/getSingleRetailer/${retailerId}`,
					{ headers: { Authorization: `Bearer ${auth.token}` } }
				);

				const data = response.data;

				setRetailerData({
					firstName: data.firstName || "",
					lastName: data.lastName || "",
					BusinessName: data.BusinessName || "",
					licenseNumber: data.licenseNumber || "DL-AY-10001",
					email: data.email || "",
					phone: data.phone || "",
					address: data.address || "",
					profileImage: data.profileImage || "",
					adminVerification: data.adminVerification || null,
					warehouse: data.warehouse || null,
					shippingIntegrations: data.shippingIntegrations || null
				});
			} catch (error) {
				console.error("Error fetching retailer data:", error);
				alert(t("retailerProfile.alerts.loadFailed", "Failed to load profile details."));
			}
		};

		if (authLoading) return;

		if (auth?.token && retailerId) {
			fetchRetailerData();
		} else if (!authLoading && (!auth?.token || !retailerId)) {
			navigate("/signin");
		}
	}, [auth, authLoading, retailerId, navigate, t]);

	const handleInputChange = (e) => {
		setRetailerData({ ...retailerData, [e.target.name]: e.target.value });
	};

	const handlePasswordChange = (e) => {
		setPasswords({ ...passwords, [e.target.name]: e.target.value });
	};

	const handleSaveProfile = async () => {
		setLoading(true);
		try {
			const payload = {
				firstName: retailerData.firstName,
				lastName: retailerData.lastName,
				BusinessName: retailerData.BusinessName,
				licenseNumber: retailerData.licenseNumber,
				email: retailerData.email,
				phone: retailerData.phone,
				address: retailerData.address,
				profileImage: retailerData.profileImage,
			};

			const response = await axios.put(
				`${BACKEND_URL || "http://localhost:5000"}/api/retailers/updateRetailer/${retailerId}`,
				payload,
				{ headers: { Authorization: `Bearer ${auth.token}` } }
			);

			alert(t("retailerProfile.alerts.updateSuccess", "Profile updated successfully!"));

			if (response.data.data) {
				setAuth((prev) => ({
					...prev,
					user: {
						...prev.user,
						firstName: response.data.data.firstName,
						lastName: response.data.data.lastName,
						profileImage: response.data.data.profileImage,
						phone: response.data.data.phone,
					},
				}));
			}

			setIsEditing(false);
		} catch (error) {
			console.error("Error updating profile:", error);
			alert(t("retailerProfile.alerts.updateFailed", "Failed to update profile."));
		} finally {
			setLoading(false);
		}
	};

	const handlePasswordSubmit = async (e) => {
		e.preventDefault();
		if (passwords.newPassword !== passwords.confirmPassword) {
			return alert(t("retailerProfile.alerts.passwordMismatch", "New passwords do not match!"));
		}

		try {
			await axios.put(
				`${BACKEND_URL || "http://localhost:5000"}/api/auth/change-password`,
				{
					currentPassword: passwords.currentPassword,
					newPassword: passwords.newPassword,
				},
				{ headers: { Authorization: `Bearer ${auth.token}` } }
			);

			alert(t("retailerProfile.alerts.passwordSuccess", "Password changed successfully!"));
			setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
		} catch (error) {
			console.error("Error changing password:", error);
			alert(error.response?.data?.message || "Failed to change password");
		}
	};

	const handleImageUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const formData = new FormData();
		formData.append("image", file);

		try {
			setLoading(true);
			const res = await axios.post(`${BACKEND_URL || "http://localhost:5000"}/api/medicines/upload-image`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
					Authorization: `Bearer ${auth.token}`,
				},
			});

			if (res.data.imageUrl) {
				const newImageUrl = res.data.imageUrl;
				setRetailerData({ ...retailerData, profileImage: newImageUrl });

				await axios.put(
					`${BACKEND_URL || "http://localhost:5000"}/api/retailers/updateRetailer/${retailerId}`,
					{ profileImage: newImageUrl },
					{ headers: { Authorization: `Bearer ${auth.token}` } }
				);

				setAuth((prev) => ({
					...prev,
					user: { ...prev.user, profileImage: newImageUrl },
				}));

				alert(t("retailerProfile.alerts.imageSuccess", "Profile image updated successfully!"));
			}
		} catch (error) {
			console.error("Error uploading image:", error);
			alert(t("retailerProfile.alerts.imageFailed", "Failed to upload image."));
		} finally {
			setLoading(false);
		}
	};

	const handleSignOut = () => {
		logout();
		navigate("/signin");
	};

	const isVerified = Boolean(retailerData.adminVerification?.isVerified);

	if (authLoading) {
		return (
			<DashboardShell>
				<Card className="p-12 text-center text-sm text-muted-foreground">
					Loading profile...
				</Card>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
				{/* Left Sidebar Profile Summary Card */}
				<div className="flex flex-col gap-4">
					<Card className="p-6 text-center shadow-xs">
						<div className="relative mx-auto w-fit">
							<Avatar className="size-24 ring-2 ring-primary/20">
								<AvatarImage src={retailerData.profileImage || defaultProfilePic} alt="Profile" />
								<AvatarFallback>{retailerData.firstName?.charAt(0) || "?"}</AvatarFallback>
							</Avatar>
							<label
								htmlFor="profile-upload"
								className="absolute right-0 bottom-0 flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:scale-105 transition-transform"
								title="Change Profile Photo"
							>
								<Camera className="size-3.5" />
							</label>
							<input
								type="file"
								id="profile-upload"
								className="hidden"
								accept="image/*"
								onChange={handleImageUpload}
								disabled={loading}
							/>
						</div>

						<h3 className="mt-4 text-base font-semibold text-foreground">
							{retailerData.firstName || "AyurCare"} {retailerData.lastName || "Pharmacy"}
						</h3>
						{retailerData.BusinessName && (
							<p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
								{retailerData.BusinessName}
							</p>
						)}
						<p className="text-xs text-muted-foreground mt-0.5">{retailerData.email || auth?.user?.email}</p>

						<div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">Seller Status:</span>
								{isVerified ? (
									<Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] py-0 gap-1">
										<ShieldCheck className="size-3" /> Verified Seller
									</Badge>
								) : (
									<Badge variant="outline" className="border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/20 text-[11px] py-0 gap-1">
										<ShieldAlert className="size-3" /> Under Review
									</Badge>
								)}
							</div>
							<div className="flex items-center justify-between text-xs">
								<span className="text-muted-foreground">Drug License:</span>
								<span className="font-mono font-medium text-foreground text-[11px]">
									{retailerData.licenseNumber || "DL-AY-10001"}
								</span>
							</div>
						</div>

						<Button variant="outline" size="sm" className="mt-5 w-full text-xs text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
							{t("retailerProfile.signOut", "Sign Out")}
						</Button>
					</Card>
				</div>

				{/* Right Main Tabbed Content */}
				<div className="flex flex-col gap-4">
					{/* Tab Navigation Header */}
					<div className="flex border-b border-border gap-1 overflow-x-auto bg-card rounded-xl px-2 pt-2 border shadow-xs">
						<button
							type="button"
							onClick={() => handleTabChange("personal")}
							className={`flex items-center gap-2 pb-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
								activeTab === "personal"
									? "border-primary text-foreground font-semibold"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<User className="size-4" /> Profile & Business
						</button>
						<button
							type="button"
							onClick={() => handleTabChange("payouts")}
							className={`flex items-center gap-2 pb-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
								activeTab === "payouts"
									? "border-primary text-foreground font-semibold"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<CreditCard className="size-4" /> Payout Methods
						</button>
						<button
							type="button"
							onClick={() => handleTabChange("shipping")}
							className={`flex items-center gap-2 pb-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
								activeTab === "shipping"
									? "border-primary text-foreground font-semibold"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<Truck className="size-4" /> Shipping & Warehouse
						</button>
						<button
							type="button"
							onClick={() => handleTabChange("verification")}
							className={`flex items-center gap-2 pb-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
								activeTab === "verification"
									? "border-primary text-foreground font-semibold"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							<ShieldCheck className="size-4" /> Seller Status
						</button>
					</div>

					{/* TAB 1: Profile & Business Information */}
					{activeTab === "personal" && (
						<div className="space-y-6">
							<Card className="p-6">
								<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
									<div>
										<h2 className="text-base font-semibold text-foreground">Personal & Business Details</h2>
										<p className="text-xs text-muted-foreground mt-0.5">Manage your legal pharmacy credentials and contact information.</p>
									</div>
									<div className="flex gap-2">
										{isEditing ? (
											<>
												<Button size="sm" onClick={handleSaveProfile} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
													{loading ? "Saving..." : "Save Details"}
												</Button>
												<Button size="sm" variant="outline" className="text-xs" onClick={() => setIsEditing(false)}>
													Cancel
												</Button>
											</>
										) : (
											<Button size="sm" variant="outline" className="text-xs" onClick={() => setIsEditing(true)}>
												Edit Details
											</Button>
										)}
									</div>
								</div>

								<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<Field>
										<FieldLabel htmlFor="firstName" className="text-xs">First Name</FieldLabel>
										<Input
											id="firstName"
											name="firstName"
											value={retailerData.firstName}
											onChange={handleInputChange}
											disabled={!isEditing}
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="lastName" className="text-xs">Last Name</FieldLabel>
										<Input
											id="lastName"
											name="lastName"
											value={retailerData.lastName}
											onChange={handleInputChange}
											disabled={!isEditing}
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="BusinessName" className="text-xs">Pharmacy / Business Name</FieldLabel>
										<Input
											id="BusinessName"
											name="BusinessName"
											value={retailerData.BusinessName}
											onChange={handleInputChange}
											disabled={!isEditing}
											placeholder="e.g. AyurCare Pharmacy"
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="licenseNumber" className="text-xs">Drug License Number</FieldLabel>
										<Input
											id="licenseNumber"
											name="licenseNumber"
											value={retailerData.licenseNumber}
											onChange={handleInputChange}
											disabled={!isEditing}
											placeholder="e.g. DL-AY-10001"
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="phone" className="text-xs">Phone Number</FieldLabel>
										<Input
											id="phone"
											name="phone"
											value={retailerData.phone}
											onChange={handleInputChange}
											disabled={!isEditing}
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor="email" className="text-xs">Email Address</FieldLabel>
										<Input
											id="email"
											name="email"
											value={retailerData.email || auth?.user?.email}
											disabled={true}
											className="bg-muted/50"
										/>
									</Field>
									<Field className="sm:col-span-2">
										<FieldLabel htmlFor="address" className="text-xs">Registered Pharmacy Address</FieldLabel>
										<Input
											id="address"
											name="address"
											value={retailerData.address}
											onChange={handleInputChange}
											disabled={!isEditing}
										/>
									</Field>
								</FieldGroup>
							</Card>

							<Card className="p-6">
								<div className="mb-4 flex items-center gap-2">
									<Lock className="size-4 text-muted-foreground" />
									<h3 className="text-base font-semibold text-foreground">Change Password</h3>
								</div>
								<form onSubmit={handlePasswordSubmit}>
									<FieldGroup className="grid grid-cols-1 sm:grid-cols-3 gap-4">
										<Field>
											<FieldLabel htmlFor="currentPassword" className="text-xs">Current Password</FieldLabel>
											<Input
												id="currentPassword"
												type="password"
												name="currentPassword"
												value={passwords.currentPassword}
												onChange={handlePasswordChange}
												placeholder="••••••••"
												required
											/>
										</Field>
										<Field>
											<FieldLabel htmlFor="newPassword" className="text-xs">New Password</FieldLabel>
											<Input
												id="newPassword"
												type="password"
												name="newPassword"
												value={passwords.newPassword}
												onChange={handlePasswordChange}
												placeholder="••••••••"
												required
											/>
										</Field>
										<Field>
											<FieldLabel htmlFor="confirmPassword" className="text-xs">Confirm New Password</FieldLabel>
											<Input
												id="confirmPassword"
												type="password"
												name="confirmPassword"
												value={passwords.confirmPassword}
												onChange={handlePasswordChange}
												placeholder="••••••••"
												required
											/>
										</Field>
									</FieldGroup>
									<div className="mt-4 flex justify-end">
										<Button type="submit" size="sm" className="text-xs">
											Update Password
										</Button>
									</div>
								</form>
							</Card>
						</div>
					)}

					{/* TAB 2: Multi-Payout Methods */}
					{activeTab === "payouts" && (
						<div className="pt-1">
							{retailerId && auth?.token && (
								<PayoutMethodsPanel retailerId={retailerId} token={auth.token} />
							)}
						</div>
					)}

					{/* TAB 3: Shipping & Warehouse */}
					{activeTab === "shipping" && (
						<div className="pt-1">
							{retailerId && auth?.token && (
								<ShippingSettingsPanel retailerId={retailerId} token={auth.token} />
							)}
						</div>
					)}

					{/* TAB 4: Seller Status & Verification */}
					{activeTab === "verification" && (
						<div className="pt-1">
							<Card className="p-6 space-y-5">
								<div>
									<h3 className="text-base font-semibold text-foreground">Seller Verification & Onboarding Status</h3>
									<p className="text-xs text-muted-foreground mt-0.5">
										Overview of requirements needed to publish your medicines live to patients.
									</p>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
									<div className={`p-4 rounded-xl border flex flex-col justify-between ${
										retailerData.shippingIntegrations?.delhivery?.isConfigured && retailerData.warehouse?.isConfigured
											? "bg-emerald-500/5 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
											: "bg-background border-border text-foreground"
									}`}>
										<div>
											<div className="flex items-center justify-between mb-2">
												<span className="font-semibold text-xs">1. Delivery Partner</span>
												{retailerData.shippingIntegrations?.delhivery?.isConfigured && retailerData.warehouse?.isConfigured ? (
													<CheckCircle2 className="size-4 text-emerald-600" />
												) : (
													<AlertCircle className="size-4 text-amber-600" />
												)}
											</div>
											<p className="text-[11px] text-muted-foreground">
												{retailerData.shippingIntegrations?.delhivery?.isConfigured && retailerData.warehouse?.isConfigured
													? "Delhivery credentials & pickup warehouse active."
													: "Configure Delhivery & pickup warehouse in the Shipping tab."}
											</p>
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="mt-3 h-7 text-xs text-primary justify-start p-0 hover:bg-transparent"
											onClick={() => handleTabChange("shipping")}
										>
											Manage Shipping &rarr;
										</Button>
									</div>

									<div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex flex-col justify-between">
										<div>
											<div className="flex items-center justify-between mb-2">
												<span className="font-semibold text-xs">2. Payout Account</span>
												<CheckCircle2 className="size-4 text-emerald-600" />
											</div>
											<p className="text-[11px] text-muted-foreground">
												Manage bank accounts & UPI IDs for automatic order disbursements.
											</p>
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="mt-3 h-7 text-xs text-primary justify-start p-0 hover:bg-transparent"
											onClick={() => handleTabChange("payouts")}
										>
											Manage Payouts &rarr;
										</Button>
									</div>

									<div className={`p-4 rounded-xl border flex flex-col justify-between ${
										isVerified
											? "bg-emerald-500/5 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
											: "bg-amber-500/5 border-amber-500/30 text-amber-800 dark:text-amber-300"
									}`}>
										<div>
											<div className="flex items-center justify-between mb-2">
												<span className="font-semibold text-xs">3. Admin Review</span>
												{isVerified ? (
													<CheckCircle2 className="size-4 text-emerald-600" />
												) : (
													<ShieldAlert className="size-4 text-amber-600" />
												)}
											</div>
											<p className="text-[11px] text-muted-foreground">
												{isVerified
													? `Verified by Admin on ${new Date(retailerData.adminVerification?.verifiedAt || Date.now()).toLocaleDateString()}`
													: "Our compliance team verifies your drug license & warehouse before activating inventory."}
											</p>
										</div>
										<span className="text-[11px] font-medium mt-3">
											{isVerified ? "✅ Approved" : "⏳ Pending Approval"}
										</span>
									</div>
								</div>
							</Card>
						</div>
					)}
				</div>
			</div>
		</DashboardShell>
	);
};

export default RetailerProfile;
