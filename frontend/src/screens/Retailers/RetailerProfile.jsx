import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Camera } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import defaultProfilePic from "../../media/default-profile.png";
import { BACKEND_URL } from "../../config";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import ShippingSettingsPanel from "./ShippingSettingsPanel";
import BankDetailsPanel from "./BankDetailsPanel";

const RetailerProfile = () => {
	const { t } = useTranslation();
	const { auth, setAuth, logout, loading: authLoading } = useContext(AuthContext);
	const navigate = useNavigate();

	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [retailerData, setRetailerData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		address: "",
		profileImage: "",
	});

	const [passwords, setPasswords] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	useEffect(() => {
		const fetchRetailerData = async () => {
			try {
				const response = await axios.get(
					`${BACKEND_URL || "http://localhost:8080"}/api/retailers/getSingleRetailer/${auth.user?.id}`,
					{ headers: { Authorization: `Bearer ${auth.token}` } }
				);

				const data = response.data;

				setRetailerData({
					firstName: data.firstName || "",
					lastName: data.lastName || "",
					email: data.email || "",
					phone: data.phone || "",
					address: data.address || "",
					profileImage: data.profileImage || "",
				});
			} catch (error) {
				console.error("Error fetching retailer data:", error);
				alert(t("retailerProfile.alerts.loadFailed", "Failed to load profile details."));
			}
		};

		if (authLoading) return;

		if (auth.token && auth.user?.id) {
			fetchRetailerData();
		} else {
			navigate("/signin");
		}
	}, [auth, authLoading, navigate, t]);

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
				email: retailerData.email,
				phone: retailerData.phone,
				address: retailerData.address,
				profileImage: retailerData.profileImage,
			};

			const response = await axios.put(
				`${BACKEND_URL || "http://localhost:8080"}/api/retailers/updateRetailer/${auth.user.id}`,
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
				`${BACKEND_URL || "http://localhost:8080"}/api/auth/change-password`,
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
			const res = await axios.post(`${BACKEND_URL || "http://localhost:8080"}/api/medicines/upload-image`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
					Authorization: `Bearer ${auth.token}`,
				},
			});

			if (res.data.imageUrl) {
				const newImageUrl = res.data.imageUrl;
				setRetailerData({ ...retailerData, profileImage: newImageUrl });

				await axios.put(
					`${BACKEND_URL || "http://localhost:8080"}/api/retailers/updateRetailer/${auth.user.id}`,
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

	return (
		<DashboardShell>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
				<Card className="h-fit p-6 text-center">
					<div className="relative mx-auto w-fit">
						<Avatar className="size-28">
							<AvatarImage src={retailerData.profileImage || defaultProfilePic} alt="Profile" />
							<AvatarFallback>{retailerData.firstName?.charAt(0) || "?"}</AvatarFallback>
						</Avatar>
						<label
							htmlFor="profile-upload"
							className="absolute right-0 bottom-0 flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground"
						>
							<Camera className="size-4" />
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
					<h3 className="mt-4 text-lg font-semibold text-foreground">
						{retailerData.firstName} {retailerData.lastName}
					</h3>
					<p className="text-sm text-muted-foreground">{retailerData.email}</p>
					<Button variant="destructive" className="mt-4 w-full" onClick={handleSignOut}>
						{t("retailerProfile.signOut", "Sign Out")}
					</Button>
				</Card>

				<div className="flex flex-col gap-6">
					<Card className="p-6">
						<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
							<h2 className="text-lg font-semibold text-foreground">{t("retailerProfile.infoTitle", "Retailer Information")}</h2>
							<div className="flex gap-2">
								{isEditing ? (
									<>
										<Button onClick={handleSaveProfile} disabled={loading}>
											{loading ? t("retailerProfile.saving", "Saving...") : t("retailerProfile.saveProfile", "Save Profile")}
										</Button>
										<Button variant="outline" onClick={() => setIsEditing(false)}>
											{t("retailerProfile.cancel", "Cancel")}
										</Button>
									</>
								) : (
									<Button variant="outline" onClick={() => setIsEditing(true)}>
										{t("retailerProfile.editProfile", "Edit Profile")}
									</Button>
								)}
							</div>
						</div>

						<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="firstName">{t("retailerProfile.firstName", "First Name")}</FieldLabel>
								<Input
									id="firstName"
									name="firstName"
									value={retailerData.firstName}
									onChange={handleInputChange}
									disabled={!isEditing}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="lastName">{t("retailerProfile.lastName", "Last Name")}</FieldLabel>
								<Input
									id="lastName"
									name="lastName"
									value={retailerData.lastName}
									onChange={handleInputChange}
									disabled={!isEditing}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="phone">{t("retailerProfile.phone", "Phone")}</FieldLabel>
								<Input id="phone" name="phone" value={retailerData.phone} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<Field className="sm:col-span-2">
								<FieldLabel htmlFor="address">{t("retailerProfile.address", "Business Address")}</FieldLabel>
								<Input id="address" name="address" value={retailerData.address} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
						</FieldGroup>
					</Card>

					<Card className="p-6">
						<h3 className="mb-4 text-lg font-semibold text-foreground">{t("retailerProfile.changePassword", "Change Password")}</h3>
						<form onSubmit={handlePasswordSubmit}>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="currentPassword">{t("retailerProfile.currentPassword", "Current Password")}</FieldLabel>
									<Input
										id="currentPassword"
										type="password"
										name="currentPassword"
										value={passwords.currentPassword}
										onChange={handlePasswordChange}
										placeholder={t("retailerProfile.currentPassword", "Current Password")}
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="newPassword">{t("retailerProfile.newPassword", "New Password")}</FieldLabel>
									<Input
										id="newPassword"
										type="password"
										name="newPassword"
										value={passwords.newPassword}
										onChange={handlePasswordChange}
										placeholder={t("retailerProfile.newPassword", "New Password")}
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="confirmPassword">{t("retailerProfile.confirmPassword", "Confirm New Password")}</FieldLabel>
									<Input
										id="confirmPassword"
										type="password"
										name="confirmPassword"
										value={passwords.confirmPassword}
										onChange={handlePasswordChange}
										placeholder={t("retailerProfile.confirmPassword", "Confirm New Password")}
										required
									/>
								</Field>
								<Button type="submit" className="w-fit">
									{t("retailerProfile.updatePassword", "Update Password")}
								</Button>
							</FieldGroup>
						</form>
					</Card>

					{/* Standalone Shipping Integration Settings */}
					{auth.user?.id && auth.token && (
						<ShippingSettingsPanel retailerId={auth.user.id} token={auth.token} />
					)}

					{/* Standalone Bank Details Panel */}
					{auth.user?.id && auth.token && (
						<BankDetailsPanel retailerId={auth.user.id} token={auth.token} />
					)}
				</div>
			</div>
		</DashboardShell>
	);
};

export default RetailerProfile;
