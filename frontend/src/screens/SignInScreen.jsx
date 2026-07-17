import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom
import "./SignInScreen.css";
import logo from "../media/logo.png"; // Import your logo
import { AuthContext } from "../context/AuthContext";
import { BACKEND_URL } from '../config';

const PasswordInput = ({ value, onChange, placeholder, name }) => {
	const [show, setShow] = useState(false);
	return (
		<div style={{ position: 'relative', width: '100%', marginBottom: '15px' }}>
			<input 
				type={show ? "text" : "password"} 
				name={name}
				value={value} 
				onChange={onChange} 
				placeholder={placeholder} 
				required 
				style={{ 
					width: '100%', 
					padding: '15px', 
					paddingRight: '45px', 
					borderRadius: '5px', 
					border: '1px solid #ccc', 
					fontSize: '16px',
					boxSizing: 'border-box',
					margin: 0,
					fontFamily: 'inherit',
					outline: 'none'
				}} 
			/>
			<button 
				type="button" 
				tabIndex="-1" 
				onClick={() => setShow(!show)} 
				style={{ 
					position: 'absolute', 
					right: '15px', 
					top: '50%', 
					transform: 'translateY(-50%)', 
					background: 'transparent', 
					border: 'none', 
					cursor: 'pointer', 
					color: '#666', 
					padding: 0, 
					display: 'flex', 
					alignItems: 'center',
					justifyContent: 'center',
					height: '100%'
				}}
			>
				{show ? (
					<svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
						<path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755l.192.195z"/>
						<path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
						<path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
					</svg>
				) : (
					<svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
						<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
						<path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
					</svg>
				)}
			</button>
		</div>
	);
};

function SignInScreen() {
	const { auth, setAuth } = useContext(AuthContext);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		role: "patient",
	});
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

	// Redirect if user is already authenticated
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
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleResetPasswordChange = (e) => {
		setPasswordResetEmail(e.target.value);
	}

	const handleSignUp = () => {
		navigate("/signup"); // Navigate to the SignUpScreen
	};

	const handleButton = () => {
		navigate("/signin");
	};

	const handleSignIn = async (e) => {
		e.preventDefault();

		try {
			const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			console.log(formData);

			const result = await response.json();
			if (response.ok) {
				// Redirect based on role
				switch (formData.role) {
					case "doctor":
						if (result.forcePasswordReset) {
							setTempAuth(result);
							setShowReset(true);
							setShowPage("ForceChangePassword");
						} else {
							localStorage.setItem("token", result.token);
							localStorage.setItem("email", formData.email);
							localStorage.setItem("role", formData.role);
							setAuth({
								token: result.token,
								user: result.user,
								role: formData.role,
							});
							navigate("/doctor-home");
						}
						break;
					case "retailer":
						localStorage.setItem("token", result.token);
						localStorage.setItem("email", formData.email);
						localStorage.setItem("role", formData.role);
						setAuth({
							token: result.token,
							user: result.user,
							role: formData.role,
						});
						navigate("/retailer-home");
						break;
					case "patient":
						localStorage.setItem("token", result.token);
						localStorage.setItem("email", formData.email);
						localStorage.setItem("role", formData.role);
						setAuth({
							token: result.token,
							user: result.user,
							role: formData.role,
						});
						navigate("/patient-home");
						break;
					case "admin":
						localStorage.setItem("token", result.token);
						localStorage.setItem("email", formData.email);
						localStorage.setItem("role", formData.role);
						setAuth({
							token: result.token,
							user: result.user,
							role: formData.role,
						});
						if (result.forcePasswordReset) {
							alert("Your account requires a password reset. Redirecting to profile...");
							navigate("/admin/profile");
						} else {
							navigate("/admin-home");
						}
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
	/////////////////////////////////////////////////////
	const handleForgotPassword = async () => {
		if (!passwordResetEmail || !passwordResetRole) {
			alert("Please provide both email and role.");
			return;
		}

		try {
			const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: passwordResetEmail,
					role: passwordResetRole
				}),
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
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: passwordResetEmail,
					role: passwordResetRole,
					otp: otp
				}),
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
	}

	const handleChangePassword = async () => {
		if (!newPassword || !confirmPassword) {
			alert("Please fill in both password fields.");
			return;
		}

		if (newPassword !== confirmPassword) {
			alert("Passwords do not match. Please try again.");
			return;
		}

		// if (newPassword.length < 6) {
		// 	alert("Password must be at least 6 characters long.");
		// 	return;
		// }

		try {
			const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: passwordResetEmail,
					role: passwordResetRole,
					newPassword: newPassword,
					resetToken: resetToken
				}),
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
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${tempAuth.token}`
				},
				body: JSON.stringify({ newPassword }),
			});

			const data = await response.json();

			if (response.ok) {
				alert("Password successfully updated! Logging you in...");
				
				// Finalize login
				localStorage.setItem("token", tempAuth.token);
				localStorage.setItem("email", formData.email);
				localStorage.setItem("role", formData.role);
				setAuth({
					token: tempAuth.token,
					user: tempAuth.user,
					role: formData.role,
				});

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

	////////////////////////////////////////////////////////
	const enterEmail = () => {
		return (
			<div className='reset-password-form'>
				<h2>Please Enter your Registered Email</h2>

				<div style={{ display: "flex", flexDirection: "column", padding: "15px" }}>
					<input type="email" name="email" value={passwordResetEmail} onChange={handleResetPasswordChange} placeholder="Enter Email" required />
					<label htmlFor="role">Select Role:</label>
					<select name="role" value={passwordResetRole} onChange={(e) => setPasswordResetRole(e.target.value)} required>
						<option value="doctor">Doctor</option>
						<option value="retailer">Retailer</option>
						<option value="patient">Patient</option>
					</select>
				</div>

				<button onClick={() => { setShowReset(false); setShowPage("enterEmail") }} className="reset-btn">Back to Sign In</button>
				<button onClick={handleForgotPassword} className="reset-btn">Reset Password</button>
			</div>
		)
	}

	const OTPVerification = () => {
		return (
			<div className='reset-password-form'>
				<h2>Enter OTP sent to your registered WhatsApp number</h2>

				<div style={{ display: "flex", flexDirection: "column", padding: "15px" }}>
					<input
						type="text"
						name="otp"
						value={otp}
						onChange={(e) => setOtp(e.target.value)}
						placeholder="Enter OTP"
						style={{ border: "none", padding: "10px", borderRadius: "5px", marginBottom: "15px", fontSize: "16px", textAlign: "center", width: "100%", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}
						required
					/>
				</div>

				<button onClick={handleVerifyOtp} className="reset-btn">
					Verify OTP
				</button>
			</div>
		);
	};

	const NewPassword = () => {
		return (
			<div className='reset-password-form'>
				<h2>Set Your New Password</h2>

				<div style={{ display: "flex", flexDirection: "column", padding: "15px", gap: "0px" }}>
					<PasswordInput
						name="newPassword"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						placeholder="Enter New Password"
					/>
					<PasswordInput
						name="confirmPassword"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="Confirm New Password"
					/>
				</div>

				<button onClick={handleChangePassword} className="reset-btn">
					Reset Password
				</button>
			</div>
		);
	};

	const ForceChangePassword = () => {
		return (
			<div className='reset-password-form'>
				<h2>Welcome! Set Your Permanent Password</h2>
				<p style={{ color: "#666", marginBottom: "15px", textAlign: "center" }}>
					For security reasons, you must change your temporary password before accessing your dashboard.
				</p>

				<div style={{ display: "flex", flexDirection: "column", padding: "15px", gap: "0px" }}>
					<input 
						type="password" 
						value="••••••••" 
						disabled 
						style={{ 
							width: '100%', padding: '15px', borderRadius: '5px', border: '1px solid #ccc', 
							fontSize: '16px', boxSizing: 'border-box', marginBottom: '15px', 
							backgroundColor: '#f8f9fa', color: '#6c757d', cursor: 'not-allowed' 
						}} 
					/>
					<PasswordInput
						name="newPassword"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						placeholder="Enter New Password"
					/>
					<PasswordInput
						name="confirmPassword"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="Confirm New Password"
					/>
				</div>

				<button onClick={handleForceChangePassword} className="reset-btn" style={{ background: "#28a745" }}>
					Update Password & Login
				</button>
			</div>
		);
	};

	//////////////////////////////////////////////////////////
	return (
		<div className="signin-container">
			<style>{`
				input[type="password"]::-ms-reveal,
				input[type="password"]::-ms-clear {
					display: none;
				}
			`}</style>
			<div className="signin-left">
				<img src={logo} alt="Ayurvedic Logo" className="ayurvedic-logo" />
				<h1>AYURVEDIC</h1>
				<h2>Consultations</h2>
				<div className='outbox'>
					<button className="sconsult-btn consult-btn" onClick={handleButton}>
						Consult an Ayurvedic Doctor <br /> Book a Session
					</button>
				</div>
			</div>
			<div className="signin-right">
				{!showReset ? (
					<>
						<div className='signin-heading'>Login to your account</div>
						<p className='welcome'>Welcome Back! We're happy to see you again</p>

						{/* Form for sign-in, with onSubmit triggering handleSignIn */}
						<form className='signin-form' onSubmit={handleSignIn}>
							<input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Mail ID" required />
							
							<PasswordInput
								name="password"
								value={formData.password}
								onChange={handleInputChange}
								placeholder="Password"
							/>

							{/* Role Selection Dropdown */}
							<label htmlFor="role">Select Role:</label>
							<select name="role" value={formData.role} onChange={handleInputChange} required>
								<option value="doctor">Doctor</option>
								<option value="retailer">Retailer</option>
								<option value="patient">Patient</option>
								<option value="admin">Admin</option>
							</select>

							<a href="#" className="forgot-password" onClick={() => setShowReset(true)}>Forgot Password?</a>
							<button type="submit" className="signin-btn">Login</button>
						</form>
						<p>
							Don’t have an account?
							<a href="#" onClick={handleSignUp}> Sign Up</a>
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
	);
}

export default SignInScreen;
