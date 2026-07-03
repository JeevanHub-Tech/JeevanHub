const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const Admin = require("../models/Admin");
const AuditLog = require("../models/AuditLog");
const { registerDoctor, registerRetailer, registerPatient, loginUser, handleForgotPassword, verifyOTP, resetPassword, forceChangePassword, changePassword } = require("../controllers/authController");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Patient = require("../models/Patient"); // Import the Patient model
const Retailer = require("../models/Retailer");
const Doctor = require("../models/Doctor");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // limit each IP to 5 login requests per windowMs
  message: { message: "Too many login attempts from this IP, please try again after 15 minutes." }
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 OTP attempts
  message: { message: "Too many OTP verification attempts from this IP, please try again after 15 minutes." }
});

const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const localUpload = multer({ storage: multer.memoryStorage() });

// Cloudinary storage setup for doctor files (certificates and QR codes)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Generate a unique folder path, perhaps under jeevanhub/doctors
    return {
      folder: "jeevanhub/doctors",
      // auto handles pdf, jpg, png, etc.
      resource_type: "auto", 
      public_id: Date.now() + "-" + file.originalname.split('.')[0]
    };
  },
});

const fileFilter = (req, file, cb) => {
  // Allow only image files or specific types based on your requirements
  const filetypes = /jpeg|jpg|png|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only jpeg, jpg, png, and pdf files are allowed"));
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

const cpUpload = upload.fields([
  { name: "certificate", maxCount: 1 },
  { name: "qrCode", maxCount: 1 },
]);


// Doctor, Retailer, Patient registration
router.post("/register/doctor", (req, res, next) => {
  cpUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, registerDoctor);
router.post("/register/retailer", registerRetailer);
router.post("/register/patient", registerPatient);
router.post("/login", loginLimiter, loginUser);

// Force change password route
router.put("/force-change-password", auth, forceChangePassword);
router.put("/change-password", auth, changePassword);

// Helper function to log admin actions
const logAdminAction = async (adminId, action, details, targetId = null) => {
  try {
    await AuditLog.create({ adminId, action, details, targetId });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
};

//  Admin Login Route
// Check if email exists for role promotion
router.get("/admin/check-email/:email", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  const email = req.params.email;
  try {
    const admin = await Admin.findOne({ email }).select('-password');
    if (admin) return res.json({ exists: true, role: "admin" });

    const patient = await Patient.findOne({ email }).select('-password -resetPasswordOTP -resetPasswordOTPExpires -isOTPVerified');
    if (patient) return res.json({ exists: true, role: "patient", user: patient });

    const doctor = await Doctor.findOne({ email }).select('-password -resetPasswordOTP -resetPasswordOTPExpires -isOTPVerified -razorpayAccountId');
    if (doctor) return res.json({ exists: true, role: "doctor", user: doctor });

    const retailer = await Retailer.findOne({ email }).select('-password -resetPasswordOTP -resetPasswordOTPExpires -isOTPVerified -razorpayAccountId');
    if (retailer) return res.json({ exists: true, role: "retailer", user: retailer });

    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create Admin
router.post("/admin/register", auth, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  try {
    // Verify permission
    const requestingAdmin = await Admin.findById(req.user._id || req.user.id);
    if (!requestingAdmin || !requestingAdmin.permissions?.manageAdmins) {
      return res.status(403).json({ message: "Access denied. You do not have permission to register new admins." });
    }

    const { firstName, lastName, email, phone, password, permissions } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    let hashedPassword = null;

    // Check if email exists in other collections for role promotion
    const existingPatient = await Patient.findOne({ email });
    const existingDoctor = await Doctor.findOne({ email });
    const existingRetailer = await Retailer.findOne({ email });

    const existingUser = existingPatient || existingDoctor || existingRetailer;

    if (existingUser) {
      // Role Promotion: Re-use their existing password hash
      hashedPassword = existingUser.password;
    } else {
      // Brand new user: Hash the provided password
      if (!password) {
        return res.status(400).json({ message: "Password is required for new users." });
      }
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const newAdmin = new Admin({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      permissions: permissions || { manageAdmins: false, manageUsers: false, manageDoctors: false, manageRetailers: false, manageTransactions: false, manageBlogs: false }
    });

    await newAdmin.save();
    
    // Log the creation
    await logAdminAction(
      requestingAdmin._id, 
      "REGISTER_ADMIN", 
      `Registered a new admin: ${firstName} ${lastName} (${email})`, 
      newAdmin._id
    );

    res.status(201).json({
      message: "Admin created successfully",
      admin: { _id: newAdmin._id, firstName: newAdmin.firstName, lastName: newAdmin.lastName, email: newAdmin.email, role: newAdmin.role },
      promoted: !!existingUser
    });

  } catch (error) {
    console.error("Admin Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!admin.isActive) {
      return res.status(403).json({ message: "Your admin account has been deactivated. Contact a super admin." });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, admin: { _id: admin._id, firstName: admin.firstName, lastName: admin.lastName, email: admin.email, role: admin.role, permissions: admin.permissions }, forcePasswordReset: admin.forcePasswordReset });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin Change Password
router.put("/admin/change-password", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied." });
  const { currentPassword, newPassword } = req.body;
  try {
    const admin = await Admin.findById(req.user._id || req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.forcePasswordReset = false; // clear the flag if they change password
    admin.passwordChangedAt = new Date();
    await admin.save();

    await logAdminAction(admin._id, "CHANGE_PASSWORD", "Admin changed their password.");

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin Update Profile
router.put("/admin/update-profile", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied." });
  const { firstName, lastName, phone } = req.body;
  try {
    const admin = await Admin.findById(req.user._id || req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (phone) admin.phone = phone;

    await admin.save();
    
    await logAdminAction(admin._id, "UPDATE_PROFILE", "Admin updated their profile details.");

    const updatedUser = {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions
    };

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= ADMIN MANAGEMENT ROUTES =================

// Get all admins
router.get("/admin/all", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied." });
  
  try {
    const requestingAdmin = await Admin.findById(req.user._id || req.user.id);
    if (!requestingAdmin || !requestingAdmin.permissions?.manageAdmins) {
      return res.status(403).json({ message: "Access denied. Missing manageAdmins permission." });
    }

    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update specific admin status/permissions
router.put("/admin/update-status/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied." });

  try {
    const requestingAdmin = await Admin.findById(req.user._id || req.user.id);
    if (!requestingAdmin || !requestingAdmin.permissions?.manageAdmins) {
      return res.status(403).json({ message: "Access denied. Missing manageAdmins permission." });
    }

    const targetAdminId = req.params.id;
    const { isActive, permissions, forcePasswordReset } = req.body;

    // Prevent modifying oneself
    if (targetAdminId === requestingAdmin._id.toString()) {
       return res.status(400).json({ message: "You cannot modify your own admin privileges." });
    }

    const adminToUpdate = await Admin.findById(targetAdminId);
    if (!adminToUpdate) return res.status(404).json({ message: "Admin not found." });

    if (isActive !== undefined) adminToUpdate.isActive = isActive;
    if (permissions !== undefined) adminToUpdate.permissions = permissions;
    if (forcePasswordReset !== undefined) adminToUpdate.forcePasswordReset = forcePasswordReset;

    await adminToUpdate.save();

    await logAdminAction(
      requestingAdmin._id, 
      "UPDATE_ADMIN_STATUS", 
      `Updated privileges/status for admin ${adminToUpdate.email}`, 
      adminToUpdate._id
    );

    res.json({ message: "Admin updated successfully", admin: { _id: adminToUpdate._id, firstName: adminToUpdate.firstName, lastName: adminToUpdate.lastName, email: adminToUpdate.email, role: adminToUpdate.role, permissions: adminToUpdate.permissions, isActive: adminToUpdate.isActive } });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete admin
router.delete("/admin/:id", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied." });

  try {
    const requestingAdmin = await Admin.findById(req.user._id || req.user.id);
    if (!requestingAdmin || !requestingAdmin.permissions?.manageAdmins) {
      return res.status(403).json({ message: "Access denied. Missing manageAdmins permission." });
    }

    const targetAdminId = req.params.id;

    // Prevent deleting oneself
    if (targetAdminId === requestingAdmin._id.toString()) {
       return res.status(400).json({ message: "You cannot delete your own admin account." });
    }

    const deletedAdmin = await Admin.findByIdAndDelete(targetAdminId);
    if (!deletedAdmin) return res.status(404).json({ message: "Admin not found." });

    await logAdminAction(
      requestingAdmin._id, 
      "DELETE_ADMIN", 
      `Deleted admin account for ${deletedAdmin.email}`
    );

    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Audit Logs
router.get("/admin/audit-logs", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Access denied." });

  try {
    const requestingAdmin = await Admin.findById(req.user._id || req.user.id);
    if (!requestingAdmin || !requestingAdmin.permissions?.manageAdmins) {
      return res.status(403).json({ message: "Access denied. Missing manageAdmins permission." });
    }

    const logs = await AuditLog.find().populate('adminId', 'firstName lastName email').sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ===========================================================

//  Get Current Logged-in User (Admin or Regular User)
router.get("/user", auth, async (req, res) => {
  try {
    console.log("loggging in user , auth middleware - after :")
    const user = req.user;
    console.log(user, ">>>>>>>>>>", user.role)

    const responseUser = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
    };

    if (user.role === 'admin' && user.permissions) {
        responseUser.permissions = user.permissions;
    }

    res.status(200).json({ user: responseUser });
  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch all patients (Admin only)
router.get("/users", auth, async (req, res) => {
  try {
    // Ensure only admins can access this
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const patients = await Patient.find({}).select('-password -resetPasswordOTP -resetPasswordOTPExpires -isOTPVerified');
    res.status(200).json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/users/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const user = await Patient.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
});

// Fetch all retailers
router.get("/retailers", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const retailers = await Retailer.find({}).select('-password -resetPasswordOTP -resetPasswordOTPExpires -isOTPVerified -razorpayAccountId');
    res.status(200).json(retailers);
  } catch (error) {
    console.error("Error fetching retailers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch all doctors
router.get("/doctors", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const doctors = await Doctor.find({}).select('-password');
    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// API route to upload Excel file and save retailers
// C6-4: Use localUpload (memory storage) instead of Cloudinary upload
router.post("/upload-retailers", auth, localUpload.single("file"), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    
    console.log("File received:", req.file);

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // C6-4: Read from buffer since it's stored in memory
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

    console.log("Workbook loaded:", workbook.SheetNames);

    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log("Extracted Data:", sheetData);

    if (sheetData.length === 0) {
      return res.status(400).json({ message: "Empty Excel file" });
    }

    // Process data
    for (const row of sheetData) {
      const { firstName, lastName, email, phone, dob, licenseNumber, age, gender, zipCode, password } = row;
      console.log("Processing:", row);

      const existingRetailer = await Retailer.findOne({ email });
      if (!existingRetailer) {
        const hashedPassword = await bcrypt.hash(password.toString(), 10);
        const newRetailer = new Retailer({ firstName, lastName, email, phone, dob, licenseNumber, age, gender, zipCode, password: hashedPassword });
        await newRetailer.save();
      }
    }



    res.status(201).json({ message: "Retailers uploaded successfully!" });
  } catch (error) {
    console.error("Error processing Excel file:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/retailers/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const deletedRetailer = await Retailer.findByIdAndDelete(req.params.id);
    if (!deletedRetailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }
    res.json({ message: "Retailer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

const findUserAndUpdatePassword = async (email, newPassword) => {
  const models = { Patient, Retailer, Doctor };

  for (let modelName in models) {
    const Model = models[modelName];
    const user = await Model.findOne({ email });

    if (user) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      return `${modelName} password updated successfully!`;
    }
  }

  return null;
};

// forgot password - email verification
router.post("/forgot-password", handleForgotPassword);

// verify OTP
router.post("/verify-otp", otpLimiter, verifyOTP);

// reset password
router.post("/reset-password", resetPassword);

module.exports = router;
