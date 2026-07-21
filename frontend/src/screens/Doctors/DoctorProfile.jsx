import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Camera, AlertTriangle, CreditCard, Pencil, Check } from "lucide-react";

import { AuthContext } from "../../context/AuthContext";
import defaultProfilePic from "../../media/default-profile.png";
import { BACKEND_URL } from "../../config";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const DoctorProfile = () => {
	const { auth, setAuth, logout, loading: authLoading } = useContext(AuthContext);
	const navigate = useNavigate();

	const [isEditing, setIsEditing] = useState(false);
	const [isEditingUpi, setIsEditingUpi] = useState(false);
	const [tempUpiId, setTempUpiId] = useState("");
	const [loading, setLoading] = useState(false);
	const [doctorData, setDoctorData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		registrationNumber: "",
		specialization: "",
		experience: "",
		price: "",
		age: "",
		gender: "",
		zipCode: "",
		education: "",
		designation: "",
		profileImage: "",
		upiId: "",
	});

	const [passwords, setPasswords] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [zoomImage, setZoomImage] = useState(false);

	useEffect(() => {
		const fetchDoctorData = async () => {
			try {
				const response = await axios.get(
					`${BACKEND_URL || "http://localhost:8080"}/api/doctors/getDoctorById/${auth.user?.id}`,
					{ headers: { Authorization: `Bearer ${auth.token}` } }
				);

				const data = response.data;
				const specString = Array.isArray(data.specialization) ? data.specialization.join(", ") : data.specialization || "";

				setDoctorData({
					firstName: data.firstName || "",
					lastName: data.lastName || "",
					email: data.email || "",
					phone: data.phone || "",
					registrationNumber: data.registrationNumber || "",
					specialization: specString,
					experience: data.experience || "",
					price: data.price || "",
					age: data.age || "",
					gender: data.gender || "",
					zipCode: data.zipCode || "",
					education: data.education || "",
					designation: data.designation || "",
					profileImage: data.profileImage || "",
					upiId: data.upiId || "",
				});
			} catch (error) {
				console.error("Error fetching doctor data:", error);
				alert("Failed to load profile details.");
			}
		};

		if (authLoading) return;

		if (auth.token && auth.user?.id) {
			fetchDoctorData();
		} else {
			navigate("/signin");
		}
	}, [auth, authLoading, navigate]);

	const handleInputChange = (e) => {
		setDoctorData({ ...doctorData, [e.target.name]: e.target.value });
	};

	const handlePasswordChange = (e) => {
		setPasswords({ ...passwords, [e.target.name]: e.target.value });
	};

	const handleSaveProfile = async () => {
		setLoading(true);
		try {
			const specArray = doctorData.specialization
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean);

			const payload = {
				firstName: doctorData.firstName,
				lastName: doctorData.lastName,
				email: doctorData.email,
				phone: doctorData.phone,
				registrationNumber: doctorData.registrationNumber,
				specialization: specArray,
				experience: doctorData.experience,
				price: doctorData.price,
				age: doctorData.age,
				gender: doctorData.gender,
				zipCode: doctorData.zipCode,
				education: doctorData.education,
				designation: doctorData.designation,
				profileImage: doctorData.profileImage,
				upiId: doctorData.upiId,
			};

			const response = await axios.put(
				`${BACKEND_URL || "http://localhost:8080"}/api/doctors/updateDoctor/${auth.user.id}`,
				payload,
				{ headers: { Authorization: `Bearer ${auth.token}` } }
			);

			alert("Profile updated successfully!");

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
			alert("Failed to update profile.");
		} finally {
			setLoading(false);
		}
	};

	const handleSaveUpiId = async () => {
		const upiRegex = /^[a-zA-Z0-9.\-_]{1,256}@[a-zA-Z0-9.\-_]{1,64}$/;
		if (tempUpiId && !upiRegex.test(tempUpiId)) {
			alert("Please enter a valid UPI ID format (e.g., doctor@upi).");
			return;
		}

		setLoading(true);
		try {
			await axios.put(
				`${BACKEND_URL || "http://localhost:8080"}/api/doctors/updateDoctor/${auth.user.id}`,
				{ upiId: tempUpiId },
				{ headers: { Authorization: `Bearer ${auth.token}` } }
			);

			setDoctorData((prev) => ({ ...prev, upiId: tempUpiId }));
			alert("UPI ID updated successfully!");
			setIsEditingUpi(false);
		} catch (error) {
			console.error("Error updating UPI ID:", error);
			alert(error.response?.data?.message || "Failed to update UPI ID.");
		} finally {
			setLoading(false);
		}
	};

	const handlePasswordSubmit = async (e) => {
		e.preventDefault();
		if (passwords.newPassword !== passwords.confirmPassword) {
			return alert("New passwords do not match!");
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

			alert("Password changed successfully!");
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

			const newImageUrl = res.data.url || res.data.imageUrl;
			if (newImageUrl) {
				setDoctorData({ ...doctorData, profileImage: newImageUrl });

				await axios.put(
					`${BACKEND_URL || "http://localhost:8080"}/api/doctors/updateDoctor/${auth.user.id}`,
					{ profileImage: newImageUrl },
					{ headers: { Authorization: `Bearer ${auth.token}` } }
				);

				setAuth((prev) => ({
					...prev,
					user: { ...prev.user, profileImage: newImageUrl },
				}));

				alert("Profile image updated successfully!");
			}
		} catch (error) {
			console.error("Error uploading image:", error);
			alert("Failed to upload image.");
		} finally {
			setLoading(false);
		}
	};

	const handleSignOut = () => {
		logout();
		navigate("/signin");
	};

	const currentProfilePic =
		doctorData.profileImage && doctorData.profileImage !== "undefined" && doctorData.profileImage !== "null"
			? doctorData.profileImage
			: defaultProfilePic;

	return (
		<DashboardShell>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
				<Card className="h-fit p-6 text-center">
					<div className="relative mx-auto w-fit">
						<Avatar className="size-28 cursor-zoom-in" onClick={() => setZoomImage(true)}>
							<AvatarImage src={currentProfilePic} alt="Profile" />
							<AvatarFallback>{doctorData.firstName?.charAt(0) || "?"}</AvatarFallback>
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
						Dr. {doctorData.firstName} {doctorData.lastName}
					</h3>
					<p className="mt-1 text-sm font-semibold text-primary">{doctorData.specialization || "General Practitioner"}</p>
					<p className="text-sm text-muted-foreground">{doctorData.email}</p>
					<Button variant="destructive" className="mt-4 w-full" onClick={handleSignOut}>
						Sign Out
					</Button>
				</Card>

				<div className="flex flex-col gap-6">
					<Card className="p-6">
						<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
							<h2 className="text-lg font-semibold text-foreground">Professional Information</h2>
							<div className="flex gap-2">
								{isEditing ? (
									<>
										<Button onClick={handleSaveProfile} disabled={loading}>
											{loading ? "Saving..." : "Save Profile"}
										</Button>
										<Button variant="outline" onClick={() => setIsEditing(false)}>
											Cancel
										</Button>
									</>
								) : (
									<Button variant="outline" onClick={() => setIsEditing(true)}>
										Edit Profile
									</Button>
								)}
							</div>
						</div>

						{/* UPI Payment Setup */}
						<div className="mb-6">
							{isEditingUpi ? (
								<div className="rounded-lg border border-border bg-muted/40 p-4">
									<div className="mb-2 flex items-center gap-2">
										<CreditCard className="size-5 text-primary" />
										<h4 className="font-semibold text-foreground">Configure UPI ID</h4>
									</div>
									<p className="mb-3 text-sm text-muted-foreground">
										Enter your UPI ID to receive direct payments for consultation slots.
									</p>
									<div className="flex flex-wrap items-center gap-2">
										<Input
											placeholder="e.g. doctorname@okaxis"
											value={tempUpiId}
											onChange={(e) => setTempUpiId(e.target.value)}
											className="min-w-52 flex-1"
										/>
										<Button size="icon" onClick={handleSaveUpiId} disabled={loading} title="Save UPI ID">
											<Check />
										</Button>
										<Button variant="outline" onClick={() => setIsEditingUpi(false)}>
											Cancel
										</Button>
									</div>
								</div>
							) : !doctorData.upiId ? (
								<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-4">
									<div className="flex items-start gap-3">
										<AlertTriangle className="size-6 shrink-0 text-primary" />
										<div>
											<h4 className="font-semibold text-foreground">UPI ID Missing</h4>
											<p className="text-sm text-muted-foreground">
												Your paid slots will not be visible to the patients until you configure a valid UPI ID.
											</p>
										</div>
									</div>
									<Button
										onClick={() => {
											setIsEditingUpi(true);
											setTempUpiId("");
										}}
									>
										Add UPI ID
									</Button>
								</div>
							) : (
								<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-4">
									<div className="flex items-start gap-3">
										<CreditCard className="size-6 shrink-0 text-primary" />
										<div>
											<h4 className="font-semibold text-foreground">UPI ID Configured</h4>
											<p className="text-sm text-muted-foreground">{doctorData.upiId}</p>
										</div>
									</div>
									<Button
										variant="outline"
										size="icon"
										onClick={() => {
											setIsEditingUpi(true);
											setTempUpiId(doctorData.upiId);
										}}
										title="Edit UPI ID"
									>
										<Pencil />
									</Button>
								</div>
							)}
						</div>

						<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field>
								<FieldLabel htmlFor="firstName">First Name</FieldLabel>
								<Input id="firstName" name="firstName" value={doctorData.firstName} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<Field>
								<FieldLabel htmlFor="lastName">Last Name</FieldLabel>
								<Input id="lastName" name="lastName" value={doctorData.lastName} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<Field>
								<FieldLabel htmlFor="phone">Phone</FieldLabel>
								<Input id="phone" name="phone" value={doctorData.phone} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<Field>
								<FieldLabel htmlFor="registrationNumber">Registration Number</FieldLabel>
								<Input
									id="registrationNumber"
									name="registrationNumber"
									value={doctorData.registrationNumber}
									onChange={handleInputChange}
									disabled={!isEditing}
								/>
							</Field>
							<Field className="sm:col-span-2">
								<FieldLabel htmlFor="specialization">Specialization (Comma separated)</FieldLabel>
								<Input
									id="specialization"
									name="specialization"
									value={doctorData.specialization}
									onChange={handleInputChange}
									disabled={!isEditing}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="education">Education</FieldLabel>
								<Input id="education" name="education" value={doctorData.education} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<Field>
								<FieldLabel htmlFor="designation">Designation</FieldLabel>
								<Input
									id="designation"
									name="designation"
									value={doctorData.designation}
									onChange={handleInputChange}
									disabled={!isEditing}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="experience">Experience (Years)</FieldLabel>
								<Input
									id="experience"
									type="number"
									name="experience"
									value={doctorData.experience}
									onChange={handleInputChange}
									disabled={!isEditing}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="price">Consultation Price (₹)</FieldLabel>
								<Input id="price" type="number" name="price" value={doctorData.price} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<Field>
								<FieldLabel htmlFor="age">Age</FieldLabel>
								<Input id="age" type="number" name="age" value={doctorData.age} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<Field>
								<FieldLabel htmlFor="gender">Gender</FieldLabel>
								<Select
									value={doctorData.gender}
									onValueChange={(value) => setDoctorData((prev) => ({ ...prev, gender: value }))}
									disabled={!isEditing}
								>
									<SelectTrigger id="gender">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Male">Male</SelectItem>
										<SelectItem value="Female">Female</SelectItem>
										<SelectItem value="Other">Other</SelectItem>
									</SelectContent>
								</Select>
							</Field>
							<Field>
								<FieldLabel htmlFor="zipCode">Zip Code</FieldLabel>
								<Input id="zipCode" name="zipCode" value={doctorData.zipCode} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
						</FieldGroup>
					</Card>

					<Card className="p-6">
						<h3 className="mb-4 text-lg font-semibold text-foreground">Change Password</h3>
						<form onSubmit={handlePasswordSubmit}>
							<FieldGroup>
								<Field>
									<FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
									<Input
										id="currentPassword"
										type="password"
										name="currentPassword"
										value={passwords.currentPassword}
										onChange={handlePasswordChange}
										placeholder="Enter current password"
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="newPassword">New Password</FieldLabel>
									<Input
										id="newPassword"
										type="password"
										name="newPassword"
										value={passwords.newPassword}
										onChange={handlePasswordChange}
										placeholder="Enter new password"
										required
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
									<Input
										id="confirmPassword"
										type="password"
										name="confirmPassword"
										value={passwords.confirmPassword}
										onChange={handlePasswordChange}
										placeholder="Confirm new password"
										required
									/>
								</Field>
								<Button type="submit" className="w-fit">
									Update Password
								</Button>
							</FieldGroup>
						</form>
					</Card>
				</div>
			</div>

			<Dialog open={zoomImage} onOpenChange={setZoomImage}>
				<DialogContent showClose={false} className="max-w-2xl border-0 bg-transparent p-0 shadow-none">
					<img src={currentProfilePic} alt="Enlarged Profile" className="max-h-[80vh] w-full rounded-xl object-contain" />
				</DialogContent>
			</Dialog>
		</DashboardShell>
	);
};

export default DoctorProfile;
