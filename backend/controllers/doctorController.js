const Doctor = require("../models/Doctor");
const Feedback = require("../models/Feedback");
const DoctorData = require("../models/DoctorData");

// Get All Doctors (Public)
exports.getAllDoctors = async (req, res) => {
	try {
		const doctors = await Doctor.find().select('-password -resetPasswordOTP -resetPasswordOTPExpires -isOTPVerified -razorpayAccountId');

		const doctorsWithQrUrls = doctors.map((doc) => {
			return {
				...doc._doc,
				qrCode: doc.qrCode
					? `${process.env.BASE_URL || "http://localhost:5000"}/${doc.qrCode}`
					: null,
			};
		});

		res.status(200).json(doctorsWithQrUrls);
	} catch (error) {
		res.status(500).json({
			message: "Failed to fetch Doctors",
			error: error.message,
		});
	}
};

// Helper function to calculate age from DOB	
const calculateAge = (dob) => {
	if (!dob) return null;
	
    let birthDate;
    if (typeof dob === 'string' && dob.includes('/')) {
        const parts = dob.split('/');
        if (parts.length === 3) {
            birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
            birthDate = new Date(dob);
        }
    } else {
        birthDate = new Date(dob);
    }

    if (isNaN(birthDate.getTime())) return null;

	const today = new Date();
	let age = today.getFullYear() - birthDate.getFullYear();
	const m = today.getMonth() - birthDate.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}
	return age;
};

// Get All Doctors from unified collection (Admin & Public)
exports.getAllDoctorsData = async (req, res) => {
	try {
		if (req.user.role !== 'admin') {
			return res.status(403).json({ message: "Access denied. Admins only." });
		}
		const doctors = await Doctor.find().select('-password');
		
		// Fetch average ratings from Feedback collection
		const ratings = await Feedback.aggregate([
			{ $match: { toType: 'Doctor' } },
			{ $group: { _id: '$to', averageRating: { $avg: '$stars' } } }
		]);
		
		// Map ratings by doctor ID for quick lookup
		const ratingMap = {};
		ratings.forEach(r => {
			if (r._id) ratingMap[r._id.toString()] = r.averageRating;
		});

		const formattedDoctors = doctors.map((doc) => ({
			_id: doc._id,
			firstName: doc.firstName,
			lastName: doc.lastName,
			email: doc.email,
			phone: doc.phone,
			upiId: doc.upiId || "",
			age: doc.age,
			gender: doc.gender,
			zipCode: doc.zipCode || "Not specified",
			designation: doc.designation,
			specialization: Array.isArray(doc.specialization) && doc.specialization.length > 0
				? doc.specialization
				: doc.specialization
					? [doc.specialization]
					: ["Not specified"],
			experience: doc.experience,
			certificate: doc.certificate,
			price: doc.price,
			education: doc.education,
			dob: doc.dob,
			approvalStatus: doc.approvalStatus || 'Pending',
			qrCode: doc.qrCode
				? `${process.env.BASE_URL || "http://localhost:5000"}/${doc.qrCode}`
				: null,
			profileImage: doc.profileImage
				? `${process.env.BASE_URL || "http://localhost:5000"}/${doc.profileImage}`
				: null,
			lastLogin: doc.lastLogin,
			rating: ratingMap[doc._id.toString()] || null
		}));

		res.status(200).json(formattedDoctors);
	} catch (error) {
		res.status(500).json({
			message: "Failed to fetch Doctors",
			error: error.message,
		});
	}
};

// Get Public Doctors Data (Safe fields only)
exports.getPublicDoctorsData = async (req, res) => {
	try {
		const doctors = await Doctor.find({ approvalStatus: 'Approved' }).select('-password');
		
		// Fetch average ratings from Feedback collection
		const ratings = await Feedback.aggregate([
			{ $match: { toType: 'Doctor' } },
			{ $group: { _id: '$to', averageRating: { $avg: '$stars' } } }
		]);
		
		// Map ratings by doctor ID for quick lookup
		const ratingMap = {};
		ratings.forEach(r => {
			if (r._id) ratingMap[r._id.toString()] = r.averageRating;
		});

		const formattedDoctors = doctors.map((doc) => ({
			_id: doc._id,
			firstName: doc.firstName,
			lastName: doc.lastName,
			email: doc.email,
			gender: doc.gender,
			designation: doc.designation,
			specialization: Array.isArray(doc.specialization) && doc.specialization.length > 0
				? doc.specialization
				: doc.specialization
					? [doc.specialization]
					: ["Not specified"],
			experience: doc.experience,
			price: doc.price,
			education: doc.education,
			approvalStatus: doc.approvalStatus || 'Pending',
			profileImage: doc.profileImage
				? (doc.profileImage.startsWith('http') ? doc.profileImage : `${process.env.BASE_URL || "http://localhost:5000"}/${doc.profileImage}`)
				: null,
			rating: ratingMap[doc._id.toString()] || null
		}));

		res.status(200).json(formattedDoctors);
	} catch (error) {
		res.status(500).json({
			message: "Failed to fetch Public Doctors",
			error: error.message,
		});
	}
};

// Bulk Verify Doctors (Admin)
exports.bulkVerifyDoctors = async (req, res) => {
	try {
		const { doctorIds, approvalStatus } = req.body;
		
		if (!Array.isArray(doctorIds) || doctorIds.length === 0) {
			return res.status(400).json({ message: "No doctors selected for bulk update." });
		}
		
		if (!['Approved', 'Rejected', 'Pending'].includes(approvalStatus)) {
			return res.status(400).json({ message: "Invalid approval status." });
		}

		await Doctor.updateMany(
			{ _id: { $in: doctorIds } },
			{ $set: { approvalStatus } }
		);

		res.status(200).json({ message: `Successfully updated ${doctorIds.length} doctors to ${approvalStatus}.` });
	} catch (error) {
		res.status(500).json({ message: "Failed to perform bulk update", error: error.message });
	}
};

// Bulk Delete Doctors (Admin)
exports.bulkDeleteDoctors = async (req, res) => {
	try {
		const { doctorIds } = req.body;
		
		if (!Array.isArray(doctorIds) || doctorIds.length === 0) {
			return res.status(400).json({ message: "No doctors selected for bulk delete." });
		}

		await Doctor.deleteMany({ _id: { $in: doctorIds } });

		res.status(200).json({ message: `Successfully deleted ${doctorIds.length} doctors.` });
	} catch (error) {
		res.status(500).json({ message: "Failed to perform bulk delete", error: error.message });
	}
};

// Get Doctor by ID (Public)
exports.getDoctorById = async (req, res) => {
	const { id } = req.params;

	try {
		if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
			return res.status(403).json({ message: "Not authorized to view full doctor details." });
		}
		let doc = await Doctor.findById(id).select('-password');

		if (doc) {
			const formattedDoctor = {
				_id: doc._id,
				firstName: doc.firstName,
				lastName: doc.lastName,
				email: doc.email,
				phone: doc.phone,
				registrationNumber: doc.registrationNumber || "",
				upiId: doc.upiId || "",
				age: doc.age,
				gender: doc.gender,
				zipCode: doc.zipCode || "Not specified",
				address: doc.address || "Not specified",
				designation: doc.designation,
				specialization: Array.isArray(doc.specialization) && doc.specialization.length > 0
					? doc.specialization
					: doc.specialization
						? [doc.specialization]
						: ["Not specified"],
				experience: doc.experience,
				certificate: doc.certificate,
				price: doc.price,
				availableSlots: doc.availableSlots || {},
				scheduleOverrides: (doc.scheduleOverrides || []).filter(o => {
					const overrideDate = new Date(o.date);
					overrideDate.setHours(0,0,0,0);
					const today = new Date();
					today.setHours(0,0,0,0);
					return overrideDate >= today;
				}),
				education: doc.education,
				dob: doc.dob,
				approvalStatus: doc.approvalStatus || 'Pending',
				qrCode: doc.qrCode
					? `${process.env.BASE_URL || "http://localhost:5000"}/${doc.qrCode}`
					: null,
				profileImage: doc.profileImage
					? (doc.profileImage.startsWith('http') ? doc.profileImage : `${process.env.BASE_URL || "http://localhost:5000"}/${doc.profileImage}`)
					: null,
			};
			return res.status(200).json(formattedDoctor);
		}

		return res.status(404).json({ message: "Doctor not found" });

		return res.status(404).json({ message: "Doctor not found" });

	} catch (error) {
		res.status(500).json({
			message: "Failed to fetch doctor",
			error: error.message,
		});
	}
};

exports.updateDoctor = async (req, res) => {
    const { id } = req.params;
    const updates = req.body; 

    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ success: false, message: "Not authorized to update this doctor" });
        }

        // --- ATTEMPT 1: Check if ID belongs to Doctor (Schema 1) ---
        let doctor = await Doctor.findById(id);

        if (doctor) {
            if (updates.firstName !== undefined) doctor.firstName = updates.firstName;
            if (updates.lastName !== undefined) doctor.lastName = updates.lastName;
            if (updates.email !== undefined) doctor.email = updates.email;
            if (updates.phone !== undefined) doctor.phone = updates.phone;
            if (updates.registrationNumber !== undefined) doctor.registrationNumber = updates.registrationNumber;
            if (updates.experience !== undefined) doctor.experience = updates.experience;
            if (updates.specialization !== undefined) doctor.specialization = updates.specialization; 
            if (updates.gender !== undefined) doctor.gender = updates.gender;
            if (updates.zipCode !== undefined) doctor.zipCode = updates.zipCode; 
            if (updates.address !== undefined) doctor.address = updates.address;
            if (updates.price !== undefined) doctor.price = updates.price;
            if (updates.education !== undefined) doctor.education = updates.education;
            if (updates.designation !== undefined) doctor.designation = updates.designation;
            if (updates.profileImage !== undefined) doctor.profileImage = updates.profileImage;
            if (updates.availableSlots !== undefined) doctor.availableSlots = updates.availableSlots;
            if (updates.upiId !== undefined) {
                if (updates.upiId && !/^[a-zA-Z0-9.\-_]{1,256}@[a-zA-Z0-9.\-_]{1,64}$/.test(updates.upiId)) {
                    return res.status(400).json({ success: false, message: "Invalid UPI ID format" });
                }
                doctor.upiId = updates.upiId;
            }

			await doctor.save();
			console.log("Updated Doctor details successfully");
			
			const safeData = doctor.toObject();
			delete safeData.password;
			delete safeData.resetPasswordOTP;
			delete safeData.resetPasswordOTPExpires;
			delete safeData.isOTPVerified;
			delete safeData.forcePasswordReset;
			delete safeData.razorpayAccountId;
			
            return res.status(200).json({ success: true, message: "Doctor profile updated", data: safeData });
        }

        // --- If ID is not found ---
        return res.status(404).json({ success: false, message: "Doctor not found" });

    } catch (error) {
        console.error("Update Error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: "Invalid Doctor ID format" });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};

// Verify Doctor (Admin)
exports.verifyDoctor = async (req, res) => {
	try {
		// Strict RBAC check
		if (req.user.role !== 'admin') {
			return res.status(403).json({ message: "Access denied. Admins only." });
		}
		
		if (!req.user.permissions || !req.user.permissions.manageDoctors) {
			return res.status(403).json({ message: "Access denied. Missing manageDoctors permission." });
		}

		const { id } = req.params;
		const { approvalStatus } = req.body;

		if (!['Approved', 'Rejected', 'Pending'].includes(approvalStatus)) {
			return res.status(400).json({ message: "Invalid approval status." });
		}

		const updatedDoctor = await Doctor.findByIdAndUpdate(
			id,
			{ $set: { approvalStatus } },
			{ new: true }
		).select('-password -resetPasswordOTP -resetPasswordOTPExpires -isOTPVerified');

		if (!updatedDoctor) {
			return res.status(404).json({ message: "Doctor not found." });
		}

		res.status(200).json({ message: `Doctor successfully updated to ${approvalStatus}.`, doctor: updatedDoctor });
	} catch (error) {
		res.status(500).json({ message: "Failed to verify doctor", error: error.message });
	}
};
