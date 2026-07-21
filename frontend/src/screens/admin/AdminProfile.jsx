import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import { authFetch } from "../../utils/authFetch";
import { BACKEND_URL } from "../../config";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const PasswordInput = ({ show, toggle, ...props }) => (
	<div className="relative">
		<Input type={show ? "text" : "password"} className="pr-10" {...props} />
		<button
			type="button"
			tabIndex={-1}
			onClick={toggle}
			className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center text-muted-foreground"
		>
			{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
		</button>
	</div>
);

const AdminProfile = () => {
	const { auth, setAuth, logout } = useContext(AuthContext);
	const navigate = useNavigate();

	const [profileForm, setProfileForm] = useState({
		firstName: auth.user?.firstName || "",
		lastName: auth.user?.lastName || "",
		phone: auth.user?.phone || "",
	});

	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [profileLoading, setProfileLoading] = useState(false);
	const [passwordLoading, setPasswordLoading] = useState(false);
	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [showSignOutPopup, setShowSignOutPopup] = useState(false);

	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const handleSignOut = () => {
		logout();
		navigate("/signin");
	};

	const handleProfileUpdate = async (e) => {
		e.preventDefault();
		setProfileLoading(true);
		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/auth/admin/update-profile`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(profileForm),
			});
			const data = await response.json();
			if (response.ok) {
				alert("Profile updated successfully!");
				setAuth({ ...auth, user: data.user });
			} else {
				alert(data.message || "Failed to update profile");
			}
		} catch (err) {
			console.error(err);
			alert("Error updating profile");
		} finally {
			setProfileLoading(false);
		}
	};

	const handlePasswordUpdate = async (e) => {
		e.preventDefault();
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			return alert("New passwords do not match!");
		}
		setPasswordLoading(true);
		try {
			const token = localStorage.getItem("token");
			const response = await authFetch(`${BACKEND_URL}/api/auth/admin/change-password`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					currentPassword: passwordForm.currentPassword,
					newPassword: passwordForm.newPassword,
				}),
			});
			const data = await response.json();
			if (response.ok) {
				alert("Password changed successfully! Please log in again.");
				setAuth({ token: null, user: null, role: "guest" });
				localStorage.removeItem("token");
				localStorage.removeItem("role");
				navigate("/signin");
			} else {
				alert(data.message || "Failed to change password");
			}
		} catch (err) {
			console.error(err);
			alert("Error changing password");
		} finally {
			setPasswordLoading(false);
		}
	};

	return (
		<DashboardShell>
			<Dialog open={showSignOutPopup} onOpenChange={setShowSignOutPopup}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Sign Out</DialogTitle>
						<DialogDescription>Are you sure you want to sign out?</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowSignOutPopup(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleSignOut}>
							Sign Out
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<DashboardPageHeader title="Admin Profile" />

			<div className="flex flex-wrap justify-center gap-6">
				<Card className="min-w-80 flex-1 p-6">
					<h3 className="mb-4 text-base font-semibold text-foreground">Update Details</h3>
					<form onSubmit={handleProfileUpdate}>
						<FieldGroup>
							<div className="grid grid-cols-2 gap-4">
								<Field>
									<FieldLabel htmlFor="firstName">First Name</FieldLabel>
									<Input
										id="firstName"
										value={profileForm.firstName}
										onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="lastName">Last Name</FieldLabel>
									<Input
										id="lastName"
										value={profileForm.lastName}
										onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
										required
									/>
								</Field>
							</div>
							<Field>
								<FieldLabel htmlFor="phone">Phone Number</FieldLabel>
								<Input
									id="phone"
									value={profileForm.phone}
									onChange={(e) => {
										const val = e.target.value;
										if (val === "" || /^[0-9]+$/.test(val)) {
											setProfileForm({ ...profileForm, phone: val });
										}
									}}
									required
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="email">Email Address</FieldLabel>
								<Input id="email" type="email" value={auth.user?.email || ""} disabled />
							</Field>
							<Button disabled={profileLoading} type="submit">
								{profileLoading ? "Updating..." : "Save Details"}
							</Button>
						</FieldGroup>
					</form>

					<div className="mt-4 flex gap-3">
						<Button variant="secondary" className="flex-1" onClick={() => setShowPasswordForm(!showPasswordForm)}>
							{showPasswordForm ? "Hide Password Form" : "Change Password"}
						</Button>
						<Button variant="destructive" className="flex-1" onClick={() => setShowSignOutPopup(true)}>
							Sign Out
						</Button>
					</div>
				</Card>

				{showPasswordForm ? (
					<Card className="min-w-72 flex-1 p-6">
						<h3 className="mb-4 text-base font-semibold text-foreground">Change Password</h3>
						<form onSubmit={handlePasswordUpdate}>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
									<PasswordInput
										id="currentPassword"
										show={showCurrentPassword}
										toggle={() => setShowCurrentPassword(!showCurrentPassword)}
										value={passwordForm.currentPassword}
										onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="newPassword">New Password</FieldLabel>
									<PasswordInput
										id="newPassword"
										show={showNewPassword}
										toggle={() => setShowNewPassword(!showNewPassword)}
										value={passwordForm.newPassword}
										onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
									<PasswordInput
										id="confirmPassword"
										show={showConfirmPassword}
										toggle={() => setShowConfirmPassword(!showConfirmPassword)}
										value={passwordForm.confirmPassword}
										onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
										required
									/>
								</Field>
								<Button disabled={passwordLoading} type="submit">
									{passwordLoading ? "Changing..." : "Change Password"}
								</Button>
							</FieldGroup>
						</form>
					</Card>
				) : null}
			</div>
		</DashboardShell>
	);
};

export default AdminProfile;
