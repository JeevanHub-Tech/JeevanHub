import { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Pill,
	CalendarCheck2,
	MessageCircleMore,
	Mail,
	Phone,
	MapPin,
	Star,
	Upload,
	User,
	ArrowLeft,
	Briefcase,
	IndianRupee,
} from "lucide-react";

import { AuthContext } from "../../../context/AuthContext";
import { DashboardShell, DashboardPageHeader } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

import DoctorDetails from "./DoctorDetails";
import AppointmentsTab from "./Appointment";
import FeedbackTab from "./DoctorFeedback";
import PrescriptionsTab from "./Precription";
import Transactions from "./DoctorTrans";
import { BACKEND_URL } from "../../../config";
import { authFetch } from "../../../utils/authFetch";

const tabs = [
	{ name: "Details", icon: Briefcase },
	{ name: "Prescriptions", icon: Pill },
	{ name: "Appointments", icon: CalendarCheck2 },
	{ name: "Transction", icon: IndianRupee },
	{ name: "Feedback", icon: MessageCircleMore },
];

// Title-cases free text so admin edits ("skin, lifestyle disorder" ->
// "Skin, Lifestyle Disorder") land consistently formatted regardless of how
// the doctor or an Excel bulk-import entered it.
function titleCase(str) {
	return str.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function statusBadgeVariant(status) {
	if (status === "Approved") return "default";
	if (status === "Rejected") return "destructive";
	return "secondary";
}

function EditModal({ isOpen, onClose, currentProfile, onUpdate }) {
	const [formData, setFormData] = useState({
		...currentProfile,
		specialization: Array.isArray(currentProfile.specialization)
			? currentProfile.specialization.join(", ")
			: currentProfile.specialization || "",
	});
	const [previewImage, setPreviewImage] = useState(currentProfile.profileImage || null);
	const fileInputRef = useRef(null);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleImageUpload = (e) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				const result = reader.result;
				setPreviewImage(result);
				setFormData((prev) => ({ ...prev, profileImage: result }));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const normalized = {
			...formData,
			firstName: titleCase(formData.firstName || ""),
			lastName: titleCase(formData.lastName || ""),
			specialization: (formData.specialization || "")
				.split(",")
				.map((s) => titleCase(s.trim()))
				.filter(Boolean),
		};
		const success = await onUpdate(normalized);
		if (success) onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Update Profile</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col gap-6">
					<div className="flex flex-col items-center gap-3">
						<Avatar className="size-24">
							{previewImage ? <AvatarImage src={previewImage} alt="Profile preview" /> : null}
							<AvatarFallback>
								<User className="size-10" />
							</AvatarFallback>
						</Avatar>
						<Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
							<Upload data-icon="inline-start" />
							Upload Photo
						</Button>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleImageUpload}
							className="hidden"
						/>
					</div>

					<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field>
							<FieldLabel htmlFor="firstName">First Name *</FieldLabel>
							<Input
								id="firstName"
								name="firstName"
								value={formData.firstName}
								onChange={handleInputChange}
								required
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="lastName">Last Name *</FieldLabel>
							<Input
								id="lastName"
								name="lastName"
								value={formData.lastName}
								onChange={handleInputChange}
								required
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="email">Email *</FieldLabel>
							<Input
								id="email"
								type="email"
								name="email"
								value={formData.email}
								onChange={handleInputChange}
								required
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="experience">Years of Experience *</FieldLabel>
							<Input
								id="experience"
								type="number"
								name="experience"
								value={formData.experience}
								onChange={handleInputChange}
								min="0"
								required
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="specialization">Specialization *</FieldLabel>
							<Input
								id="specialization"
								name="specialization"
								value={formData.specialization}
								onChange={handleInputChange}
								required
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="gender">Gender *</FieldLabel>
							<Select
								value={formData.gender}
								onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
							>
								<SelectTrigger id="gender">
									<SelectValue placeholder="Select Gender" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Male">Male</SelectItem>
									<SelectItem value="Female">Female</SelectItem>
									<SelectItem value="Others">Others</SelectItem>
								</SelectContent>
							</Select>
						</Field>

						<Field className="sm:col-span-2">
							<FieldLabel htmlFor="address">Address *</FieldLabel>
							<Textarea
								id="address"
								name="address"
								value={formData.address}
								onChange={handleInputChange}
								rows={3}
								required
							/>
						</Field>

						<Field>
							<FieldLabel htmlFor="zipCode">Pincode *</FieldLabel>
							<Input
								id="zipCode"
								name="zipCode"
								value={formData.zipCode}
								onChange={handleInputChange}
								pattern="[0-9]{6}"
								maxLength={6}
								required
							/>
						</Field>
					</FieldGroup>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">Save Changes</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

const DoctorFullDetails = () => {
	const { auth } = useContext(AuthContext);
	const { id: doctorId } = useParams();
	const [doctor, setDoctor] = useState(null);
	const [loadingDoctor, setLoadingDoctor] = useState(true);
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState("Details");
	const [showEditModal, setShowEditModal] = useState(false);

	useEffect(() => {
		const fetchDoctorById = async () => {
			try {
				const token = localStorage.getItem("token");
				const res = await authFetch(`${BACKEND_URL}/api/doctors/getDoctorById/${doctorId}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!res.ok) {
					if (res.status === 404) {
						setDoctor([]);
						return;
					}
					throw new Error("Failed to fetch doctors");
				}

				const data = await res.json();
				setDoctor(data);
			} catch (error) {
				console.error("Error fetching doctors:", error);
			} finally {
				setLoadingDoctor(false);
			}
		};

		fetchDoctorById();
	}, [doctorId]);

	const handleUpdateProfile = async (updatedData) => {
		try {
			const token = localStorage.getItem("token") || "";
			const res = await fetch(`${BACKEND_URL}/api/doctors/updateDoctor/${doctorId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(updatedData),
			});

			const data = await res.json();

			if (res.ok && data.success) {
				setDoctor(data.data);
				return true;
			}

			alert(data.message || "Failed to update profile");
			return false;
		} catch (error) {
			console.error("Error updating doctor:", error);
			alert("An error occurred while updating.");
			return false;
		}
	};

	const handleVerify = async (status) => {
		try {
			const token = localStorage.getItem("token") || "";
			const res = await authFetch(`${BACKEND_URL}/api/doctors/verify/${doctorId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ approvalStatus: status }),
			});
			const data = await res.json();
			if (res.ok) {
				setDoctor((prev) => ({ ...prev, approvalStatus: status }));
				alert(data.message);
			} else {
				alert(data.message || "Failed to update status");
			}
		} catch (error) {
			console.error("Error verifying doctor:", error);
			alert("An error occurred.");
		}
	};

	const renderContent = () => {
		switch (activeTab) {
			case "Details":
				return <DoctorDetails doctor={doctor} />;
			case "Prescriptions":
				return <PrescriptionsTab doctorId={doctor._id} doctor={doctor} />;
			case "Appointments":
				return <AppointmentsTab doctorId={doctor._id} doctor={doctor} />;
			case "Transction":
				return <Transactions doctorId={doctor._id} doctor={doctor} />;
			case "Feedback":
				return <FeedbackTab doctorId={doctor._id} doctor={doctor} />;
			default:
				return null;
		}
	};

	if (loadingDoctor) {
		return (
			<DashboardShell>
				<p className="text-muted-foreground">Loading patients...</p>
			</DashboardShell>
		);
	}

	return (
		<DashboardShell>
			{showEditModal && doctor && (
				<EditModal
					isOpen={showEditModal}
					onClose={() => setShowEditModal(false)}
					onUpdate={handleUpdateProfile}
					currentProfile={{
						firstName: doctor.firstName,
						lastName: doctor.lastName,
						email: doctor.email,
						dateOfBirth: doctor.dateOfBirth,
						experience: doctor.experience,
						gender: doctor.gender,
						specialization: doctor.specialization,
						address: doctor.address,
						zipCode:
							typeof doctor.zipCode === "object" && doctor.zipCode !== null
								? doctor.zipCode.specific || doctor.zipCode.pincode || ""
								: doctor.zipCode || "",
						profileImage: doctor.profileImage || "",
					}}
				/>
			)}

			<Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
				<ArrowLeft data-icon="inline-start" /> Back to Doctors
			</Button>

			<DashboardPageHeader title="Doctor Dashboard" description="Detailed information and activity" />

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
				{doctor && (
					<Card className="h-fit p-6 text-center">
						<Avatar className="mx-auto size-20 text-2xl">
							<AvatarFallback>{doctor.firstName ? doctor.firstName.charAt(0) : "?"}</AvatarFallback>
						</Avatar>
						<h2 className="mt-3 text-lg font-semibold text-foreground">
							{doctor.firstName || "Unknown"} {doctor.lastName || ""}
						</h2>
						<p className="text-sm text-muted-foreground">
							{Array.isArray(doctor.specialization) && doctor.specialization.length > 0
								? doctor.specialization.join(", ")
								: "Not specified"}
						</p>

						<Button variant="outline" size="sm" className="mt-3" onClick={() => setShowEditModal(true)}>
							Edit
						</Button>

						<Separator className="my-5" />

						<div className="flex flex-col gap-2 text-left text-sm text-foreground/80">
							<p className="flex items-center gap-2">
								<Mail className="size-4 shrink-0 text-muted-foreground" /> {doctor.email || "Not specified"}
							</p>
							<p className="flex items-center gap-2">
								<Phone className="size-4 shrink-0 text-muted-foreground" /> {doctor.phone || "Not specified"}
							</p>
							<p className="flex items-center gap-2">
								<MapPin className="size-4 shrink-0 text-muted-foreground" />{" "}
								{typeof doctor.zipCode === "object" && doctor.zipCode !== null
									? doctor.zipCode.specific || doctor.zipCode.pincode || "Not specified"
									: doctor.zipCode || "Not specified"}
							</p>
						</div>

						<Separator className="my-5" />

						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-xl font-bold text-foreground">4.5</p>
								<p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
									<Star className="size-3.5 fill-primary text-primary" /> Rating
								</p>
							</div>
							<div>
								<p className="text-xl font-bold text-foreground">{doctor.experience || "N/A"}</p>
								<p className="text-xs text-muted-foreground">Years of Exp</p>
							</div>
						</div>

						<Separator className="my-5" />

						<div>
							<p className="mb-2 text-xs font-medium text-muted-foreground">Verification Status</p>
							<div className="flex flex-wrap items-center justify-center gap-2">
								<Badge variant={statusBadgeVariant(doctor.approvalStatus)}>{doctor.approvalStatus || "Pending"}</Badge>
								{auth?.user?.role === "admin" && auth?.user?.permissions?.manageDoctors && (
									<>
										{doctor.approvalStatus !== "Approved" && (
											<Button size="sm" onClick={() => handleVerify("Approved")}>
												Approve
											</Button>
										)}
										{doctor.approvalStatus !== "Rejected" && (
											<Button size="sm" variant="destructive" onClick={() => handleVerify("Rejected")}>
												Reject
											</Button>
										)}
									</>
								)}
							</div>
						</div>
					</Card>
				)}

				<div>
					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsList className="mb-6 h-auto flex-wrap">
							{tabs.map((tab) => (
								<TabsTrigger key={tab.name} value={tab.name}>
									<tab.icon data-icon="inline-start" />
									{tab.name}
								</TabsTrigger>
							))}
						</TabsList>
						<TabsContent value={activeTab}>{renderContent()}</TabsContent>
					</Tabs>
				</div>
			</div>
		</DashboardShell>
	);
};

export default DoctorFullDetails;
