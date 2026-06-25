const mongoose = require('mongoose');

const Patient = require('../models/Patient');
const PatientRecord = require('../models/PatientRecord');

exports.getAllRecords = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const allRecords = await PatientRecord.find({})
            .populate({ path: 'patient', select: '-password -resetPasswordOTP -resetPasswordOTPExpires -isOTPVerified' })
            .exec();

        res.status(200).json({
            status: 'success',
            results: allRecords.length,
            data: {
                records: allRecords
            }
        });
    } catch (error) {
        console.error("Error fetching patient records:", error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching records.',
            error: error.message
        });
    }
};
