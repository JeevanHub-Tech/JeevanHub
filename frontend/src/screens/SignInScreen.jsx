import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AuthContext } from "../context/AuthContext";
import { BACKEND_URL } from "../config";
import logo from "../media/logo.png";

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
	const { t } = useTranslation();
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

	const roleOptions = [
		{ value: "patient", label: t("auth.signIn.roles.patient") },
		{ value: "doctor", label: t("auth.signIn.roles.doctor") },
		{ value: "retailer", label: t("auth.signIn.roles.retailer") },
	];

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
				alert(result.message || result.error || t("auth.signIn.alerts.invalidCredentials"));
			}
		} catch (error) {
			console.error("Error during sign-in:", error);
		}
	};

	const handleForgotPassword = async () => {
		if (!passwordResetEmail || !passwordResetRole) {
			alert(t("auth.signIn.alerts.provideEmailRole"));
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
				alert(t("auth.signIn.alerts.otpSent"));
				setShowPage("OTPVerification");
			} else {
				alert(data.message || t("auth.signIn.alerts.otpFailed"));
			}
		} catch (error) {
			console.error("Forgot Password Error:", error);
			alert(t("auth.signIn.alerts.errorOccurred"));
		}
	};

	const handleVerifyOtp = async () => {
		if (!otp || otp.length !== 5) {
			alert(t("auth.signIn.alerts.enterValidOtp"));
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
				alert(t("auth.signIn.alerts.otpVerified"));
				setResetToken(data.resetToken);
				setShowPage("NewPassword");
			} else {
				alert(data.message || t("auth.signIn.alerts.invalidOtp"));
			}
		} catch (error) {
			console.error("OTP Verification Error:", error);
			alert(t("auth.signIn.alerts.errorOccurred"));
		}
	};

	const handleChangePassword = async () => {
		if (!newPassword || !confirmPassword) {
			alert(t("auth.signIn.alerts.fillBothPasswords"));
			return;
		}

		if (newPassword !== confirmPassword) {
			alert(t("auth.signIn.alerts.passwordsDoNotMatch"));
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
				alert(t("auth.signIn.alerts.passwordResetSuccess"));
				setShowReset(false);
				setShowPage("SignIn");
			} else {
				alert(data.message || t("auth.signIn.alerts.passwordResetFailed"));
			}
		} catch (error) {
			console.error("Reset Password Error:", error);
			alert(t("auth.signIn.alerts.errorOccurred"));
		}
	};

	const handleForceChangePassword = async () => {
		if (!newPassword || !confirmPassword) {
			alert(t("auth.signIn.alerts.fillBothPasswords"));
			return;
		}

		if (newPassword !== confirmPassword) {
			alert(t("auth.signIn.alerts.passwordsDoNotMatch"));
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
				alert(t("auth.signIn.alerts.passwordUpdatedLoggingIn"));
				finalizeLogin(tempAuth.token, tempAuth.user, formData.role);
				setShowReset(false);
				setTempAuth(null);
				navigate("/doctor-home");
			} else {
				alert(data.message || t("auth.signIn.alerts.failedToUpdatePassword"));
			}
		} catch (error) {
			console.error("Force Change Password Error:", error);
			alert(t("auth.signIn.alerts.errorOccurred"));
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
			t("auth.signIn.resetPassword"),
			<>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="reset-email">{t("auth.signIn.resetEmail")}</Label>
						<Input
							id="reset-email"
							type="email"
							name="email"
							value={passwordResetEmail}
							onChange={(e) => setPasswordResetEmail(e.target.value)}
							placeholder={t("auth.signIn.enterEmailPlaceholder")}
							required
							className="h-11"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="reset-role">{t("auth.signIn.roleLabel")}</Label>
						<Select value={passwordResetRole} onValueChange={setPasswordResetRole} items={roleOptions}>
							<SelectTrigger id="reset-role" className="h-11">
								<SelectValue placeholder={t("auth.signIn.selectRole")} />
							</SelectTrigger>
							<SelectContent>
								{roleOptions.map((r) => (
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
						{t("auth.signIn.backToSignIn")}
					</Button>
					<Button type="button" className="flex-1" onClick={handleForgotPassword}>
						{t("auth.signIn.sendOtp")}
					</Button>
				</div>
			</>
		);

	const OTPVerification = () =>
		resetShell(
			t("auth.signIn.enterOtp"),
			<>
				<p className="text-sm text-muted-foreground">{t("auth.signIn.otpHelp")}</p>
				<Input
					type="text"
					name="otp"
					value={otp}
					onChange={(e) => setOtp(e.target.value)}
					placeholder={t("auth.signIn.otpPlaceholder")}
					className="h-11 text-center text-lg tracking-widest"
				/>
				<Button type="button" className="w-full" onClick={handleVerifyOtp}>
					{t("auth.signIn.verifyOtp")}
				</Button>
			</>
		);

	const NewPassword = () =>
		resetShell(
			t("auth.signIn.setNewPassword"),
			<>
				<div className="flex flex-col gap-3">
					<PasswordField name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("auth.signIn.newPasswordPlaceholder")} />
					<PasswordField name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("auth.signIn.confirmNewPasswordPlaceholder")} />
				</div>
				<Button type="button" className="w-full" onClick={handleChangePassword}>
					{t("auth.signIn.resetPasswordBtn")}
				</Button>
			</>
		);

	const ForceChangePassword = () =>
		resetShell(
			t("auth.signIn.setPermanentPassword"),
			<>
				<p className="text-sm text-muted-foreground">{t("auth.signIn.permanentPasswordDesc")}</p>
				<div className="flex flex-col gap-3">
					<PasswordField name="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("auth.signIn.newPasswordPlaceholder")} />
					<PasswordField name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("auth.signIn.confirmNewPasswordPlaceholder")} />
				</div>
				<Button type="button" className="w-full" onClick={handleForceChangePassword}>
					{t("auth.signIn.updatePasswordAndLogin")}
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
					<h1 className="whitespace-pre-line font-display text-4xl leading-tight text-(--jh-cream)">
						{t("auth.signIn.heroHeading")}
					</h1>
					<p className="max-w-sm text-(--jh-cream)/70">
						{t("auth.signIn.heroDesc")}
					</p>
				</div>

				<p className="relative text-sm text-(--jh-cream)/50">{t("auth.signIn.heroFooter")}</p>
			</div>

			<div className="flex items-center justify-center px-6 py-16 sm:px-10">
				<div className="w-full max-w-sm">
					{!showReset ? (
						<>
							<h1 className="font-display text-3xl text-foreground">{t("auth.signIn.title")}</h1>
							<p className="mt-1.5 text-sm text-muted-foreground">{t("auth.signIn.subtitle")}</p>

							<form className="mt-8 flex flex-col gap-4" onSubmit={handleSignIn}>
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="signin-email">{t("auth.signIn.email")}</Label>
									<Input
										id="signin-email"
										type="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										placeholder={t("auth.signIn.emailPlaceholder")}
										required
										className="h-11"
									/>
								</div>

								<div className="flex flex-col gap-1.5">
									<Label htmlFor="signin-password">{t("auth.signIn.password")}</Label>
									<PasswordField id="signin-password" name="password" value={formData.password} onChange={handleInputChange} placeholder={t("auth.signIn.password")} />
								</div>

								<div className="flex flex-col gap-1.5">
									<Label htmlFor="signin-role">{t("auth.signIn.roleLabel")}</Label>
									<Select value={formData.role} onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))} items={roleOptions}>
										<SelectTrigger id="signin-role" className="h-11">
											<SelectValue placeholder={t("auth.signIn.selectRole")} />
										</SelectTrigger>
										<SelectContent>
											{roleOptions.map((r) => (
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
									{t("auth.signIn.forgotPassword")}
								</button>

								<Button type="submit" size="lg" className="mt-2 w-full">
									{t("auth.signIn.loginBtn")}
								</Button>
							</form>

							<p className="mt-6 text-center text-sm text-muted-foreground">
								{t("auth.signIn.noAccount")}{" "}
								<button type="button" onClick={handleSignUp} className="font-semibold text-primary hover:underline">
									{t("auth.signIn.signUpLink")}
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
