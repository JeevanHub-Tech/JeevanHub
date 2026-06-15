const Doctor = require("../models/Doctor");
const DoctorData = require("../models/DoctorData");

// Get All Doctors (Public)
exports.getAllDoctors = async (req, res) => {
	try {
		const doctors = await Doctor.find().select('-password');

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

// Get All Doctors from both collections (Public)
exports.getAllDoctorsData = async (req, res) => {
	try {
		const doctors = await Doctor.find().select('-password');
		const doctorData = await DoctorData.find().select('-password');

		const formattedDoctors = doctors.map((doc) => ({
			_id: doc._id,
			source: "Doctor",
			firstName: doc.firstName,
			lastName: doc.lastName,
			email: doc.email,
			phone: doc.phone,
			age: doc.age,
			gender: doc.gender,
			zipCode: doc.zipCode || doc.location?.pincode || "Not specified",
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
			qrCode: doc.qrCode
				? `${process.env.BASE_URL || "http://localhost:5000"}/${doc.qrCode}`
				: null,
		}));

		const formattedDoctorData = doctorData.map((doc) => ({
			_id: doc._id,
			source: "DoctorData",
			firstName: doc.firstname,
			lastName: doc.lastname,
			email: doc.email,
			phone: doc.whatsapp,
			age: calculateAge(doc.dob),
			gender: doc.gender,
			zipCode: doc.location?.pincode || doc.zipCode || "Not specified",
			designation: doc.education?.degree,
			specialization: Array.isArray(doc.specialization) && doc.specialization.length > 0
				? doc.specialization
				: doc.specialization
					? [doc.specialization]
					: ["Not specified"],
			experience: doc.experience,
			certificate: doc.certificateLink,
			price: doc.fee,
			education: doc.education?.college,
			dob: doc.dob,
			qrCode: doc.imageLink
				? `${process.env.BASE_URL || "http://localhost:5000"}/${doc.imageLink}`
				: null,
		}));

		const allDoctors = [...formattedDoctors, ...formattedDoctorData];

		res.status(200).json(allDoctors);
	} catch (error) {
		res.status(500).json({
			message: "Failed to fetch Doctors",
			error: error.message,
		});
	}
};

// Get Doctor by ID (Public)
exports.getDoctorById = async (req, res) => {
	const { id } = req.params;

	try {
		let doc = await Doctor.findById(id).select('-password');

		if (doc) {
			const formattedDoctor = {
				_id: doc._id,
				source: "Doctor",
				firstName: doc.firstName,
				lastName: doc.lastName,
				email: doc.email,
				phone: doc.phone,
				age: doc.age,
				gender: doc.gender,
				zipCode: doc.zipCode || doc.location?.pincode || "Not specified",
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
				qrCode: doc.qrCode
					? `${process.env.BASE_URL || "http://localhost:5000"}/${doc.qrCode}`
					: null,
			};
			return res.status(200).json(formattedDoctor);
		}

		doc = await DoctorData.findById(id).select('-password');

		if (doc) {
			const formattedDoctorData = {
				_id: doc._id,
				source: "DoctorData",
				firstName: doc.firstname,
				lastName: doc.lastname,
				email: doc.email,
				phone: doc.whatsapp,
				age: calculateAge(doc.dob),
				gender: doc.gender,
				zipCode: doc.location?.pincode || doc.zipCode || "Not specified",
				designation: null,
				specialization: Array.isArray(doc.specialization) && doc.specialization.length > 0
					? doc.specialization
					: doc.specialization
						? [doc.specialization]
						: ["Not specified"],
				experience: doc.experience,
				certificate: doc.certificateLink,
				price: doc.fee,
				education: doc.education?.degree,
				dob: doc.dob,
				qrCode: doc.imageLink
					? `${process.env.BASE_URL || "http://localhost:5000"}/${doc.imageLink}`
					: null,
			};
			return res.status(200).json(formattedDoctorData);
		}

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
            if (updates.firstName) doctor.firstName = updates.firstName;
            if (updates.lastName) doctor.lastName = updates.lastName;
            if (updates.email) doctor.email = updates.email;
            if (updates.yearsOfExperience) doctor.experience = updates.yearsOfExperience;
            if (updates.specialization) doctor.specialization = updates.specialization; 
            if (updates.gender) doctor.gender = updates.gender;
            if (updates.pincode) doctor.zipCode = updates.pincode; 
            if (updates.address) doctor.address = updates.address;
            // if (updates.profileImage) doctor.profileImage = updates.profileImage;

            await doctor.save();
			console.log("Updated Doctor:", doctor);
            return res.status(200).json({ success: true, message: "Updated in Doctor Schema", data: doctor });
        }

        // --- ATTEMPT 2: Check if ID belongs to DoctorData (Schema 2) ---
        doctor = await DoctorData.findById(id);

        if (doctor) {
            if (updates.firstName) doctor.firstname = updates.firstName;
            if (updates.lastName) doctor.lastname = updates.lastName;
            if (updates.email) doctor.email = updates.email;
            if (updates.yearsOfExperience) doctor.experience = updates.yearsOfExperience;
            if (updates.specialization) doctor.specialization = updates.specialization;
            if (updates.gender) doctor.gender = updates.gender;
            if (updates.profileImage) doctor.imageLink = updates.profileImage;
            if (updates.pincode || updates.address) {
                if (!doctor.location) doctor.location = {};
                if (updates.pincode) doctor.location.pincode = updates.pincode;
                if (updates.address) doctor.location.specific = updates.address;
            }

            await doctor.save();
			console.log("Updated DoctorData:", doctor);
            return res.status(200).json({ success: true, message: "Updated in DoctorData Schema", data: doctor });
        }

        // --- If ID is not found in either ---
        return res.status(404).json({ success: false, message: "Doctor not found in either database" });

    } catch (error) {
        console.error("Update Error:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: "Invalid Doctor ID format" });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};
