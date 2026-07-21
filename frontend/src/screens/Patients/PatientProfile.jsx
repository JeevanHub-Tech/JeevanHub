import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Camera, FileText, Trash2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentViewerModal } from "../../components/DocumentViewerModal";
import { AuthContext } from "../../context/AuthContext";
import { BACKEND_URL } from "../../config";
import defaultProfilePic from "../../media/default-profile.png";

const API = BACKEND_URL || "http://localhost:8080";

function Field({ label, htmlFor, children }) {
	return (
		<div className="flex flex-col gap-1.5">
			<Label htmlFor={htmlFor}>{label}</Label>
			{children}
		</div>
	);
}

const PatientProfile = () => {
	const { auth, setAuth, logout, loading: authLoading } = useContext(AuthContext);
	const navigate = useNavigate();

	const [isEditing, setIsEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [patientData, setPatientData] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		dob: "",
		gender: "",
		zipCode: "",
		address: "",
		profileImage: "",
	});

	const [passwords, setPasswords] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [medicalHistory, setMedicalHistory] = useState([]);
	const [uploadingDocs, setUploadingDocs] = useState(false);
	const [viewingDoc, setViewingDoc] = useState(null);

	useEffect(() => {
		window.scrollTo(0, 0);

		const fetchPatientData = async () => {
			try {
				const response = await axios.get(`${API}/api/patients/getPatient/${auth.user?.id}`, {
					headers: { Authorization: `Bearer ${auth.token}` },
				});

				let formattedDob = "";
				if (response.data.dob) {
					formattedDob = new Date(response.data.dob).toISOString().split("T")[0];
				}

				setPatientData({
					firstName: response.data.firstName || "",
					lastName: response.data.lastName || "",
					email: response.data.email || "",
					phone: response.data.phone || "",
					dob: formattedDob,
					gender: response.data.gender || "",
					zipCode: response.data.zipCode || "",
					address: response.data.address || "",
					profileImage: response.data.profileImage || "",
				});
			} catch (error) {
				console.error("Error fetching patient data:", error);
				alert("Failed to load profile details.");
			}
		};

		const fetchMedicalHistory = async () => {
			try {
				const response = await axios.get(`${API}/api/patients/${auth.user?.id}/medical-history`, {
					headers: { Authorization: `Bearer ${auth.token}` },
				});
				setMedicalHistory(response.data.medicalHistory || []);
			} catch (error) {
				console.error("Error fetching medical history:", error);
			}
		};

		// Wait for AuthContext's bootstrap check to settle -- right after a hard
		// refresh auth.user is legitimately null for a moment, and redirecting
		// here before that resolves bounces a logged-in user off this page.
		if (authLoading) return;

		if (auth.token && auth.user?.id) {
			fetchPatientData();
			fetchMedicalHistory();
		} else {
			navigate("/signin");
		}
	}, [auth, authLoading, navigate]);

	const handleInputChange = (e) => {
		setPatientData({ ...patientData, [e.target.name]: e.target.value });
	};

	const handlePasswordChange = (e) => {
		setPasswords({ ...passwords, [e.target.name]: e.target.value });
	};

	const handleSaveProfile = async () => {
		setLoading(true);
		try {
			const payload = {
				firstName: patientData.firstName,
				lastName: patientData.lastName,
				email: patientData.email,
				phone: patientData.phone,
				dateOfBirth: patientData.dob,
				gender: patientData.gender,
				pincode: patientData.zipCode,
				address: patientData.address,
				profileImage: patientData.profileImage,
			};

			const response = await axios.put(`${API}/api/patients/updatePatient/${auth.user.id}`, payload, {
				headers: { Authorization: `Bearer ${auth.token}` },
			});

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

	const handlePasswordSubmit = async (e) => {
		e.preventDefault();
		if (passwords.newPassword !== passwords.confirmPassword) {
			return alert("New passwords do not match!");
		}

		try {
			const response = await axios.put(
				`${API}/api/auth/change-password`,
				{ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword },
				{ headers: { Authorization: `Bearer ${auth.token}` } },
			);

			// Changing the password invalidates the old token server-side, so the
			// session must pick up the fresh one or every following request 401s.
			if (response.data.token) {
				setAuth((prev) => ({ ...prev, token: response.data.token }));
				localStorage.setItem("token", response.data.token);
			}

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
			const res = await axios.post(`${API}/api/patients/${auth.user.id}/profile-image`, formData, {
				headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${auth.token}` },
			});

			if (res.data.url) {
				const newImageUrl = res.data.url;
				setPatientData({ ...patientData, profileImage: newImageUrl });
				setAuth((prev) => ({ ...prev, user: { ...prev.user, profileImage: newImageUrl } }));
				alert("Profile image updated successfully!");
			}
		} catch (error) {
			console.error("Error uploading image:", error);
			alert("Failed to upload image.");
		} finally {
			setLoading(false);
		}
	};

	const handleMedicalHistoryUpload = async (e) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		const formData = new FormData();
		files.forEach((file) => formData.append("documents", file));

		try {
			setUploadingDocs(true);
			const res = await axios.post(`${API}/api/patients/${auth.user.id}/medical-history`, formData, {
				headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${auth.token}` },
			});
			setMedicalHistory(res.data.medicalHistory || []);
		} catch (error) {
			console.error("Error uploading medical history:", error);
			alert(error.response?.data?.message || "Failed to upload document(s).");
		} finally {
			setUploadingDocs(false);
			e.target.value = "";
		}
	};

	const handleDeleteMedicalHistoryDoc = async (docId) => {
		if (!window.confirm("Remove this document?")) return;
		try {
			const res = await axios.delete(`${API}/api/patients/${auth.user.id}/medical-history/${docId}`, {
				headers: { Authorization: `Bearer ${auth.token}` },
			});
			setMedicalHistory(res.data.medicalHistory || []);
		} catch (error) {
			console.error("Error deleting medical history document:", error);
			alert("Failed to delete document.");
		}
	};

	const handleSignOut = () => {
		logout();
		navigate("/signin");
	};

	return (
		<main className="bg-background">
			<div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
				<Card className="h-fit">
					<CardContent className="flex flex-col items-center gap-3 text-center">
						<div className="relative">
							<img
								src={patientData.profileImage || defaultProfilePic}
								alt="Profile"
								className="size-28 rounded-full border-2 border-border object-cover"
							/>
							<label
								htmlFor="profile-upload"
								className="absolute bottom-0 right-0 flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-(--jh-shadow-rest) transition-colors hover:bg-primary/80"
							>
								<Camera size={16} />
							</label>
							<input
								type="file"
								id="profile-upload"
								className="sr-only"
								accept="image/*"
								onChange={handleImageUpload}
								disabled={loading}
							/>
						</div>
						<div>
							<h3 className="font-display text-lg text-foreground">
								{patientData.firstName} {patientData.lastName}
							</h3>
							<p className="text-sm text-muted-foreground">{patientData.email}</p>
						</div>
						<Button variant="outline" onClick={handleSignOut} className="w-full">
							Sign out
						</Button>
					</CardContent>
				</Card>

				<div className="flex flex-col gap-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between gap-3">
							<CardTitle className="font-display text-xl">Personal information</CardTitle>
							{isEditing ? (
								<div className="flex gap-2">
									<Button size="sm" onClick={handleSaveProfile} disabled={loading}>
										{loading ? "Saving..." : "Save"}
									</Button>
									<Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
										Cancel
									</Button>
								</div>
							) : (
								<Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
									Edit profile
								</Button>
							)}
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2">
							<Field label="First name" htmlFor="firstName">
								<Input id="firstName" name="firstName" value={patientData.firstName} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<Field label="Last name" htmlFor="lastName">
								<Input id="lastName" name="lastName" value={patientData.lastName} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<Field label="Phone" htmlFor="phone">
								<Input id="phone" name="phone" value={patientData.phone} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<Field label="Date of birth" htmlFor="dob">
								<Input id="dob" type="date" name="dob" value={patientData.dob} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<Field label="Gender" htmlFor="gender">
								<Select
									value={patientData.gender}
									onValueChange={(value) => setPatientData({ ...patientData, gender: value })}
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
							<Field label="Zip code" htmlFor="zipCode">
								<Input id="zipCode" name="zipCode" value={patientData.zipCode} onChange={handleInputChange} disabled={!isEditing} />
							</Field>
							<div className="sm:col-span-2">
								<Field label="Address" htmlFor="address">
									<Input id="address" name="address" value={patientData.address} onChange={handleInputChange} disabled={!isEditing} />
								</Field>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="font-display text-xl">Change password</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handlePasswordSubmit} className="grid gap-4 sm:grid-cols-3">
								<Field label="Current password" htmlFor="currentPassword">
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
								<Field label="New password" htmlFor="newPassword">
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
								<Field label="Confirm new password" htmlFor="confirmPassword">
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
								<Button type="submit" className="sm:col-span-3 sm:w-fit">
									Update password
								</Button>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="font-display text-xl">Medical history</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<p className="text-sm text-muted-foreground">
								Upload previous medical records (PDF, JPG, PNG) so doctors you consult can reference them.
							</p>

							<div>
								<label
									htmlFor="medical-history-upload"
									className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
								>
									<UploadCloud size={16} />
									{uploadingDocs ? "Uploading..." : "Upload documents"}
								</label>
								<input
									type="file"
									id="medical-history-upload"
									className="sr-only"
									accept=".pdf,.jpg,.jpeg,.png"
									multiple
									onChange={handleMedicalHistoryUpload}
									disabled={uploadingDocs}
								/>
							</div>

							{medicalHistory.length === 0 ? (
								<EmptyState title="No documents uploaded yet" description="Upload a PDF, JPG, or PNG to get started." />
							) : (
								<div className="flex flex-col gap-2">
									{medicalHistory.map((doc) => (
										<div key={doc._id} className="flex items-center justify-between gap-2 rounded-(--jh-radius-md) bg-secondary/60 px-3 py-2">
											<button
												type="button"
												onClick={() => setViewingDoc(doc)}
												className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-foreground hover:text-primary"
											>
												<FileText size={18} className="shrink-0" />
												<span className="truncate">{doc.fileName}</span>
											</button>
											<button
												type="button"
												onClick={() => handleDeleteMedicalHistoryDoc(doc._id)}
												aria-label="Delete document"
												className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
											>
												<Trash2 size={16} />
											</button>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{viewingDoc ? <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} /> : null}
		</main>
	);
};

export default PatientProfile;
