const Admin = require('../models/Admin'); // Import Admin model
const Doctor = require('../models/Doctor');
const Retailer = require('../models/Retailer');
const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOTPWhatsApp } = require('../scheduler');

// Helper function to generate a short-lived access token
const generateToken = (user) => {
	console.log("generating token : user : ", user.role);
	return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

// Helper function to generate a long-lived refresh token (kept out of the JS-visible
// response body; delivered only via an httpOnly cookie, see setRefreshCookie)
const generateRefreshToken = (user) => {
	return jwt.sign({ id: user._id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
};

// Frontend and backend live on different registrable domains in production
// (e.g. onrender.com subdomains are each their own site per the public
// suffix list), which makes every API call cross-site there. A `sameSite:
// 'lax'` cookie is never sent on cross-site fetch/XHR requests -- only on
// top-level navigations -- so the refresh endpoint always saw no cookie,
// refresh always failed, and users got silently logged out ~15 minutes
// (the access-token lifetime) after login. `sameSite: 'none'` is required
// for cross-site requests, which in turn requires `secure: true`. Locally
// frontend/backend share `localhost` so `lax` + non-secure keeps working
// over plain http.
const isProdEnv = process.env.NODE_ENV === 'production';
const REFRESH_COOKIE_OPTIONS = {
	httpOnly: true,
	secure: isProdEnv,
	sameSite: isProdEnv ? 'none' : 'lax',
	path: '/api/auth',
};

const setRefreshCookie = (res, token) => {
	res.cookie('refreshToken', token, { ...REFRESH_COOKIE_OPTIONS, maxAge: 30 * 24 * 60 * 60 * 1000 });
};

// Register Admin (Manually done by an existing admin)
exports.registerAdmin = async (req, res) => {
	const { firstName, lastName, email, phone, password } = req.body;

	try {
		if (!password) return res.status(400).json({ error: 'Password is required' });
		const existingAdmin = await Admin.findOne({ email });
		if (existingAdmin) {
			return res.status(400).json({ error: 'Admin already exists' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const admin = new Admin({ firstName, lastName, email, phone, password: hashedPassword, role: 'admin' });

		await admin.save();
		const token = generateToken(admin);
		setRefreshCookie(res, generateRefreshToken(admin));

		res.status(201).json({
			message: 'Admin registered successfully', token, user: {
				id: admin._id,
				firstName: admin.firstName,
				lastName: admin.lastName,
				role: 'admin',
			}
		});
	} catch (error) {
		if (error.code === 11000) {
			const duplicateField = Object.keys(error.keyValue)[0];
			return res.status(400).json({ error: `${duplicateField} already exists` });
		}
		if (error.name === 'ValidationError') {
			const messages = Object.values(error.errors).map(val => val.message);
			return res.status(400).json({ error: messages.join(', ') });
		}
		res.status(500).json({ error: 'Registration failed' });
	}
};

// Login User (Including Admin)
exports.loginUser = async (req, res) => {
	const { email, password, role } = req.body;
	let user;

	try {
		if (!email || !password || !role) {
			return res.status(400).json({ message: 'Email, password, and role are required' });
		}

		if (role === 'doctor') {
			user = await Doctor.findOne({ email });
		} else if (role === 'retailer') {
			user = await Retailer.findOne({ email });
		} else if (role === 'patient') {
			user = await Patient.findOne({ email });
		} else if (role === 'admin') {
			user = await Admin.findOne({ email });
		}

		if (!user) {
			return res.status(400).json({ message: 'User not found' });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: 'Invalid credentials' });
		}


		if (role === 'admin' && user) {
			if (!user.isActive) {
				return res.status(403).json({ message: 'Your admin account has been deactivated. Contact a super admin.' });
			}
			user.lastLogin = new Date();
			await user.save();
		}

		if (role === 'doctor' && user) {
			user.lastLogin = new Date();
			await user.save();
		}

		console.log("before token : user - ", user);
		const token = generateToken(user);
		setRefreshCookie(res, generateRefreshToken(user));

		const responsePayload = {
			message: 'Login successful', token, user: {
				id: user._id,
				firstName: user.firstName,
				lastName: user.lastName,
				role,
			}
		};

		if (role === 'admin') {
			responsePayload.forcePasswordReset = user.forcePasswordReset;
			responsePayload.user.permissions = user.permissions;
		} else if (role === 'doctor') {
			responsePayload.forcePasswordReset = user.forcePasswordReset || false;
		}

		res.status(200).json(responsePayload);
	} catch (error) {
		res.status(500).json({ error: 'Login failed' });
	}
};

// Register a new doctor
exports.registerDoctor = async (req, res) => {
	const {
		firstName,
		lastName,
		registrationNumber,
		email,
		phone,
		dob,
		age,
		experience,
		specialization,
		gender,
		zipCode,
		education,
		designation,
		price,
		password
	} = req.body;
	const certificate = req.files?.certificate ? req.files.certificate[0].path : null;
	const qrCode = req.files?.qrCode ? req.files.qrCode[0].path : null;

	// Check if files are uploaded
	// if (!certificate || !qrCode) {
	// 	return res.status(400).json({ error: 'Both certificate and qrCode files are required.' });
	// }

	try {
		if (!password) return res.status(400).json({ error: 'Password is required' });
		const hashedPassword = await bcrypt.hash(password, 10);
		let specializationArray = [];
		if (specialization) {
			specializationArray = Array.isArray(specialization)
				? specialization
				: specialization.split(",").map(item => item.trim());
		} else {
			specializationArray = [];
		}
		const doctor = new Doctor({
			firstName,
			lastName,
			registrationNumber,
			email,
			phone,
			dob,
			age,
			experience,
			gender,
			specialization: specializationArray,
			zipCode,
			education,
			designation,
			price,
			password: hashedPassword,
			certificate,
			qrCode,
			role: 'doctor'
		});
		await doctor.save();
		const token = generateToken(doctor);
		setRefreshCookie(res, generateRefreshToken(doctor));
		res.status(201).json({
			message: 'Doctor registered successfully', token, user: {
				id: doctor._id,
				firstName: doctor.firstName,
				lastName: doctor.lastName,
				role: 'doctor',
			},
		});
	} catch (error) {
		console.error("Doctor registration error:", error);
		if (error.code === 11000) {
			const duplicateField = Object.keys(error.keyValue)[0];
			return res.status(400).json({ error: `${duplicateField} already exists` });
		}
		if (error.name === 'ValidationError') {
			const messages = Object.values(error.errors).map(val => val.message);
			return res.status(400).json({ error: messages.join(', ') });
		}
		res.status(500).json({ error: 'Registration failed' });
	}
};

// Register a new retailer
exports.registerRetailer = async (req, res) => {
	console.log("Registering retailer with data:", req.body);
	const { firstName, lastName, BusinessName, email, phone, dob, licenseNumber, age, gender, zipCode, password } = req.body;

	try {
		console.log("Creating retailer:", firstName, lastName, BusinessName, email);
		if (!password) return res.status(400).json({ error: 'Password is required' });
		const hashedPassword = await bcrypt.hash(password, 10);
		const retailer = new Retailer({ firstName, lastName, BusinessName, role: 'retailer', email, phone, dob, licenseNumber, age, gender, zipCode, password: hashedPassword, status: "active" });
		await retailer.save();
		const token = generateToken(retailer);
		setRefreshCookie(res, generateRefreshToken(retailer));
		res.status(201).json({
			message: 'Retailer registered successfully', token, user: {
				id: retailer._id,
				firstName: retailer.firstName,
				lastName: retailer.lastName,
				role: 'retailer',
			},
		});
	} catch (error) {
		console.error("Retailer registration error:", error);
		if (error.code === 11000) {
			const duplicateField = Object.keys(error.keyValue)[0];
			return res.status(400).json({ error: `${duplicateField} already exists` });
		}
		if (error.name === 'ValidationError') {
			const messages = Object.values(error.errors).map(val => val.message);
			return res.status(400).json({ error: messages.join(', ') });
		}
		res.status(500).json({ error: 'Registration failed' });
	}
};

// Register a new patient
exports.registerPatient = async (req, res) => {
	const { firstName, lastName, email, phone, dob, age, gender, zipCode, password } = req.body;

	try {
		console.log("Registering patient:", firstName, lastName, email);
		if (!password) return res.status(400).json({ error: 'Password is required' });
		const hashedPassword = await bcrypt.hash(password, 10);
		const patient = new Patient({ firstName, lastName, email, phone, dob, role: 'patient', age, gender, zipCode, password: hashedPassword });
		await patient.save();
		const token = generateToken(patient);
		setRefreshCookie(res, generateRefreshToken(patient));
		console.log("Patient registered successfully:", patient);
		res.status(201).json({
			message: 'Patient registered successfully', token, user: {
				id: patient._id,
				firstName: patient.firstName,
				lastName: patient.lastName,
				role: 'patient',
			},
		});
	} catch (error) {
		console.error("Error registering patient:", error);
		if (error.code === 11000) {
			const duplicateField = Object.keys(error.keyValue)[0];
			return res.status(400).json({ error: `${duplicateField} already exists` });
		}
		if (error.name === 'ValidationError') {
			const messages = Object.values(error.errors).map(val => val.message);
			return res.status(400).json({ error: messages.join(', ') });
		}
		res.status(500).json({ error: 'Registration failed' });
	}
};


// Password reset email verification and OTP generation
const modelMap = {
	patient: Patient,
	doctor: Doctor,
	retailer: Retailer,
	admin: Admin
};
exports.handleForgotPassword = async (req, res) => {
	try {
		const { email, role } = req.body;

		// 1. Select the correct model based on role
		const Model = modelMap[role];
		if (!Model) {
			return res.status(400).json({ message: "Invalid role selected." });
		}

		// 2. Check if email exists
		const user = await Model.findOne({ email });
		if (!user) {
			return res.status(404).json({ message: "No account found with that email address." });
		}

		// 3. Generate 5-digit Numeric OTP securely
		const otp = crypto.randomInt(10000, 99999).toString();

		// 4. Save to Database with 15-minute expiry
		user.resetPasswordOTP = otp;
		user.resetPasswordOTPExpires = Date.now() + 15 * 60 * 1000; // 15 mins
		user.isOTPVerified = false;
		await user.save();

		// 5. Trigger WhatsApp Message
		if (!user.phone) {
			return res.status(400).json({ message: "No phone number associated with this account." });
		}
		const userPhone = user.phone.toString();

		// await sendOTPWhatsApp(userPhone, user.firstName, otp);

		return res.status(200).json({
			message: "Success! OTP generated (WhatsApp disabled in sandbox)."
		});

	} catch (error) {
		console.error("Forgot Password Controller Error:", error);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

// OTP verification for password reset
exports.verifyOTP = async (req, res) => {
	try {
		const { email, role, otp } = req.body;

		// 1. Identify the correct collection
		const Model = modelMap[role];
		if (!Model) {
			return res.status(400).json({ message: "Invalid role provided." });
		}

		// 2. Find the user
		const user = await Model.findOne({ email });
		if (!user) {
			return res.status(404).json({ message: "User not found." });
		}

		// 3. Check if OTP exists and matches
		if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
			return res.status(400).json({ message: "Invalid OTP. Please check your WhatsApp." });
		}

		// 4. Check if OTP has expired (Current time > Expiry time)
		if (new Date() > user.resetPasswordOTPExpires) {
			return res.status(400).json({ message: "OTP has expired. Please request a new one." });
		}

		// 5. Success! "Unlock" the password change permission with a token
		const resetToken = crypto.randomBytes(32).toString('hex');
		user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
		user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
		// user.isOTPVerified = true; // No longer relying on a boolean flag
		await user.save();

		return res.status(200).json({
			message: "OTP verified successfully. You can now reset your password.",
			resetToken
		});

	} catch (error) {
		console.error("Verify OTP Error:", error);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};

// Final password reset after OTP verification
exports.resetPassword = async (req, res) => {
	try {
		const { email, role, newPassword, resetToken } = req.body;

		const Model = modelMap[role];
		if (!Model) return res.status(400).json({ message: "Invalid role." });

		if (!resetToken) {
			return res.status(400).json({ message: "Reset token is required." });
		}
		
		const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

		// 1. Find user and check the verification flag
		const user = await Model.findOne({ 
			email,
			resetPasswordToken: hashedToken,
			resetPasswordExpires: { $gt: Date.now() }
		});

		if (!user) {
			return res.status(403).json({ message: "Security violation: Invalid or expired reset token." });
		}

		// 2. Hash the new password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);

		// 3. Update the user and CLEAR ALL RESET FIELDS
		user.password = hashedPassword;
		user.resetPasswordOTP = undefined;
		user.resetPasswordOTPExpires = undefined;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		user.isOTPVerified = false;
		user.passwordChangedAt = new Date();
		await user.save();

		res.status(200).json({ message: "Password has been successfully reset." });
	} catch (error) {
		console.error("Reset Password Error:", error);
		res.status(500).json({ message: "Server error. Please try again later." });
	}
};

// Force change password (for admin-registered doctors)
exports.forceChangePassword = async (req, res) => {
	try {
		const { newPassword } = req.body;
		if (!newPassword) {
			return res.status(400).json({ message: "New password is required" });
		}

		// Since route is protected by `auth` middleware, req.user exists
		const Model = modelMap[req.user.role];
		if (!Model) {
			return res.status(400).json({ message: "Invalid role" });
		}

		// auth middleware attaches the user object as req.user (which uses _id)
		const user = await Model.findById(req.user._id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (!user.forcePasswordReset) {
			return res.status(400).json({ message: "Password reset not forced for this account" });
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		user.password = hashedPassword;
		user.forcePasswordReset = false;
		user.passwordChangedAt = new Date();
		await user.save();

		res.status(200).json({ message: "Password successfully updated" });
	} catch (error) {
		console.error("Force Change Password Error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Change password for logged-in user
exports.changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;
		if (!currentPassword || !newPassword) {
			return res.status(400).json({ message: "Current and new passwords are required" });
		}

		const Model = modelMap[req.user.role];
		if (!Model) {
			return res.status(400).json({ message: "Invalid role" });
		}

		const user = await Model.findById(req.user._id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const isMatch = await bcrypt.compare(currentPassword, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: "Incorrect current password" });
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		user.password = hashedPassword;
		user.passwordChangedAt = new Date();
		await user.save();

		// passwordChangedAt invalidates tokens issued before now (see auth middleware),
		// so hand back fresh ones or the caller's current session breaks immediately.
		const token = generateToken(user);
		setRefreshCookie(res, generateRefreshToken(user));
		res.status(200).json({ message: "Password successfully updated", token });
	} catch (error) {
		console.error("Change Password Error:", error);
		res.status(500).json({ message: "Server error" });
	}
};

// Exchange the httpOnly refresh-token cookie for a new short-lived access token.
// Called silently by the frontend whenever a request 401s, so a session survives
// past the 15-minute access-token lifetime without forcing a re-login.
exports.refreshToken = async (req, res) => {
	try {
		const token = req.cookies?.refreshToken;
		if (!token) {
			return res.status(401).json({ message: "No refresh token provided." });
		}

		let decoded;
		try {
			decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
		} catch (err) {
			res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
			return res.status(401).json({ message: "Invalid or expired refresh token." });
		}

		const Model = modelMap[decoded.role];
		if (!Model) {
			return res.status(400).json({ message: "Invalid role in refresh token." });
		}

		const user = await Model.findById(decoded.id);
		if (!user) {
			res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
			return res.status(401).json({ message: "User not found." });
		}

		// Same guard as the access-token check in auth middleware: a password
		// change invalidates refresh tokens issued before it too.
		if (user.passwordChangedAt) {
			const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
			if (decoded.iat < changedTimestamp) {
				res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
				return res.status(401).json({ message: "Session expired, please log in again." });
			}
		}

		const newAccessToken = generateToken(user);
		// Rotate the refresh token too, so a leaked one only has a short useful window.
		setRefreshCookie(res, generateRefreshToken(user));

		res.status(200).json({ token: newAccessToken });
	} catch (error) {
		console.error("Refresh Token Error:", error);
		res.status(500).json({ message: "Internal server error during token refresh." });
	}
};

// Clear the refresh-token cookie on sign-out
exports.logoutUser = async (req, res) => {
	res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
	res.status(200).json({ message: "Logged out successfully." });
};