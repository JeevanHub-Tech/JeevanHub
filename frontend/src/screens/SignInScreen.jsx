import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AuthContext } from "../context/AuthContext";
import { BACKEND_URL } from "../config";
import logo from "../media/logo.png";

const ROLE_OPTIONS = [
	{ value: "patient", label: "Patient" },
	{ value: "doctor", label: "Doctor" },
	{ value: "retailer", label: "Retailer" },
];

function PasswordField({ value, onChange, name, placeholder, id }) {
	const [show, setShow] = useState(false);
	return (
		<div className="relative">
			<Input
				id={id}
				type={show ? "text" : "password"}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				required
				autoComplete="current-password"
				className="h-11 pr-10"
			/>
			<button
				type="button"
				tabIndex={-1}
				onClick={() => setShow((s) => !s)}
				aria-label={show ? "Hide password" : "Show password"}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
			>
				{show ? <EyeOff size={18} /> : <Eye size={18} />}
			</button>
		</div>
	);
}

function SignInScreen() {
	const { auth, setAuth } = useContext(AuthContext);
	const [formData, setFormData] = useState({ email: "", password: "", role: "patient" });
	const [passwordResetEmail, setPasswordResetEmail] = useState("");
	const [passwordResetRole, setPasswordResetRole] = useState("patient");
	const [otp, setOtp] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [resetToken, setResetToken] = useState("");

	const [showReset, setShowReset] = useState(false);
	const navigate = useNavigate();
	const [showPage, setShowPage] = useState("enterEmail");

	const [tempAuth, setTempAuth] = useState(null);

	useEffect(() => {
		if (auth && auth.user) {
			const role = auth.role || localStorage.getItem("role");
			switch (role) {
				case "doctor":
					navigate("/doctor-home", { replace: true });
					break;
				case "retailer":
					navigate("/retailer-home", { replace: true });
					break;
				case "patient":
					navigate("/patient-home", { replace: true });
					break;
				case "admin":
					navigate("/admin-home", { replace: true });
					break;
				default:
					navigate("/", { replace: true });
					break;
			}
		}
	}, [auth, navigate]);

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSignUp = () => navigate("/signup");

	const finalizeLogin = (token, user, role) => {
		localStorage.setItem("token", token);
		localStorage.setItem("email", formData.email);
		localStorage.setItem("role", role);
		setAuth({ token, user, role });
	};

	const handleSignIn = async (e) => {
		e.preventDefault();

		try {
			const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const result = await response.json();
			if (response.ok) {
				switch (formData.role) {
					case "doctor":
						if (result.forcePasswordReset) {
							setTempAuth(result);
							setShowReset(true);
							setShowPage("ForceChangePassword");
						} else {
							finalizeLogin(result.token, result.user, "doctor");
							navigate("/doctor-home");
						}
						break;
					case "retailer":
						finalizeLogin(result.token, result.user, "retailer");
						navigate("/retailer-home");
						break;
					case "patient":
						finalizeLogin(result.token, result.user, "patient");
						navigate("/patient-home");
						break;
					default:
						navigate("/");
						break;
				}
			} else {
				alert(result.message || result.error || "Invalid credentials");
			}
		} catch (error) {
			console.error("Error during sign-in:", error);
		}
	};

	const handleForgotPassword = async () => {
		if (!passwordResetEmail || !passwordResetRole) {
			alert("Please provide both email and role.");
			return;
		}

		try {
			const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: passwordResetEmail, role: passwordResetRole }),
			});

			const data = await response.json();

			if (response.ok) {
				alert("OTP has been sent to your registered WhatsApp number.");
				setShowPage("OTPVerification");
			} else {
				alert(data.message || "Failed to initiate password reset.");
			}
		} catch (error) {
			console.error("Forgot Password Error:", error);
			alert("An error occurred. Please try again later.");
		}
	};

	const handleVerifyOtp = async () => {
		if (!otp || otp.length !== 5) {
			alert("Please enter a valid 5-digit OTP.");
			return;
		}

		try {
			const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: passwordResetEmail, role: passwordResetRole, otp }),
			});

			const data = await response.json();

			if (response.ok) {
				alert("OTP Verified successfully!");
				setResetToken(data.resetToken);
				setShowPage("NewPassword");
			} else {
				alert(data.message || "Invalid or expired OTP.");
			}
		} catch (error) {
			console.error("OTP Verification Error:", error);
			alert("An error occurred during verification. Please try again.");
		}
	};

	const handleChangePassword = async () => {
		if (!newPassword || !confirmPassword) {
			alert("Please fill in both password fields.");
			return;
		}

		if (newPassword !== confirmPassword) {
			alert("Passwords do not match. Please try again.");
			return;
		}

		try {
			const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: passwordResetEmail, role: passwordResetRole, newPassword, resetToken }),
			});

			const data = await response.json();

			if (response.ok) {
				alert("Password has been reset successfully!");
				setShowReset(false);
				setShowPage("SignIn");
			} else {
				alert(data.message || "Failed to reset password.");
			}
		} catch (error) {
			console.error("Reset Password Error:", error);
			alert("An error occurred. Please try again.");
		}
	};

	const handleForceChangePassword = async () => {
		if (!newPassword || !confirmPassword) {
			alert("Please fill in both password fields.");
			return;
		}

		if (newPassword !== confirmPassword) {
			alert("Passwords do not match. Please try again.");
			return;
		}

		try {
			const response = await fetch(`${BACKEND_URL}/api/auth/force-change-password`, {
				method: "PUT",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${tempAuth.token}` },
				body: JSON.stringify({ newPassword }),
			});

			const data = await response.json();

			if (response.ok) {
				alert("Password successfully updated! Logging you in...");
				finalizeLogin(tempAuth.token, tempAuth.user, formData.role);
				setShowReset(false);
				setTempAuth(null);
				navigate("/doctor-home");
			} else {
				alert(data.message || "Failed to update password.");
			}
		} catch (error) {
			console.error("Force Change Password Error:", error);
			alert("An error occurred. Please try again.");
		}
	};

	const resetShell = (heading, children) => (
		<div className="flex flex-col gap-5">
			<h2 className="font-display text-2xl text-foreground">{heading}</h2>
			{children}
		</div>
	);

	const enterEmail = () =>
		resetShell(
			"Reset your password",
			<>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="reset-email">Email</Label>
						<Input
							id="reset-email"
							type="email"
							name="email"
							value={passwordResetEmail}
							onChange={(e) => setPasswordResetEmail(e.target.value)}
							placeholder="Enter your email"
							required
							className="h-11"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="reset-role">Role</Label>
						<Select value={passwordResetRole} onValueChange={setPasswordResetRole} items={ROLE_OPTIONS}>
							<SelectTrigger id="reset-role" className="h-11">
								<SelectValue placeholder="Select role" />
							</SelectTrigger>
							<SelectContent>
								{ROLE_OPTIONS.map((r) => (
									<SelectItem key={r.value} value={r.value}>
										{r.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="flex gap-3">
					<Button type="button" variant="outline" className="flex-1" onClick={() => { setShowReset(false); setShowPage("enterEmail"); }}>
						Back to sign in
					</Button>
					<Button type="button" className="flex-1" onClick={handleForgotPassword}>
						Send OTP
					</Button>
				</div>
			</>
		);

	const OTPVerification = () =>
		resetShell(
			"Enter the OTP",
			<>
				<p className="text-sm text-muted-foreground">Sent to your registered WhatsApp number.</p>
				<Input
					type="text"
					name="otp"
					value={otp}
					onChange={(e) => setOtp(e.target.value)}
					placeholder="5-digit OTP"
					className="h-11 text-center text-lg tracking-widest"
				/>
				<Button type="button" className="w-full" onClick={handleVerifyOtp}>
					Verify OTP
				</Button>
			</>
		);

	const NewPassword = () =>
		resetShell(
			"Set your new password",
			<>
				<div className="flex flex-col gap-3">
					<PasswordField name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
					<PasswordField name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
				</div>
				<Button type="button" className="w-full" onClick={handleChangePassword}>
					Reset password
				</Button>
			</>
		);

	const ForceChangePassword = () =>
		resetShell(
			"Set your permanent password",
			<>
				<p className="text-sm text-muted-foreground">For security, you must replace your temporary password before continuing.</p>
				<div className="flex flex-col gap-3">
					<PasswordField name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
					<PasswordField name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
				</div>
				<Button type="button" className="w-full" onClick={handleForceChangePassword}>
					Update password & log in
				</Button>
			</>
		);

	return (
		<div className="grid min-h-screen lg:grid-cols-2">
			<div className="relative hidden flex-col justify-between overflow-hidden bg-(--jh-ink-strong) px-10 py-12 text-(--jh-cream) lg:flex">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--jh-cream)_8%,transparent)_0%,transparent_55%)]" />
				<a href="/" className="relative flex items-center gap-2.5">
					<img src={logo} alt="JeevanHub" className="size-9 rounded-full object-contain" />
					<span className="font-display text-lg text-(--jh-cream)">JeevanHub</span>
				</a>

				<div className="relative flex flex-col gap-4">
					<h1 className="font-display text-4xl leading-tight text-(--jh-cream)">
						Ayurvedic care,
						<br />
						organized end to end.
					</h1>
					<p className="max-w-sm text-(--jh-cream)/70">
						Book consultations, manage prescriptions, and track your wellness journey — all in one calm, deliberate workspace.
					</p>
				</div>

				<p className="relative text-sm text-(--jh-cream)/50">Trusted by patients, doctors, and retailers across India.</p>
			</div>

			<div className="flex items-center justify-center px-6 py-16 sm:px-10">
				<div className="w-full max-w-sm">
					{!showReset ? (
						<>
							<h1 className="font-display text-3xl text-foreground">Login to your account</h1>
							<p className="mt-1.5 text-sm text-muted-foreground">Welcome back! We're happy to see you again.</p>

							<form className="mt-8 flex flex-col gap-4" onSubmit={handleSignIn}>
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="signin-email">Email</Label>
									<Input
										id="signin-email"
										type="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										placeholder="you@example.com"
										required
										className="h-11"
									/>
								</div>

								<div className="flex flex-col gap-1.5">
									<Label htmlFor="signin-password">Password</Label>
									<PasswordField id="signin-password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" />
								</div>

								<div className="flex flex-col gap-1.5">
									<Label htmlFor="signin-role">I am a</Label>
									<Select value={formData.role} onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))} items={ROLE_OPTIONS}>
										<SelectTrigger id="signin-role" className="h-11">
											<SelectValue placeholder="Select role" />
										</SelectTrigger>
										<SelectContent>
											{ROLE_OPTIONS.map((r) => (
												<SelectItem key={r.value} value={r.value}>
													{r.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<button
									type="button"
									onClick={() => setShowReset(true)}
									className="self-end text-sm font-semibold text-primary hover:underline"
								>
									Forgot password?
								</button>

								<Button type="submit" size="lg" className="mt-2 w-full">
									Login
								</Button>
							</form>

							<p className="mt-6 text-center text-sm text-muted-foreground">
								Don't have an account?{" "}
								<button type="button" onClick={handleSignUp} className="font-semibold text-primary hover:underline">
									Sign up
								</button>
							</p>
						</>
					) : (
						(showPage === "enterEmail" && enterEmail()) ||
						(showPage === "OTPVerification" && OTPVerification()) ||
						(showPage === "NewPassword" && NewPassword()) ||
						(showPage === "ForceChangePassword" && ForceChangePassword())
					)}
				</div>
			</div>
		</div>
	);
}

export default SignInScreen;
