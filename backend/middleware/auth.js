const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Retailer = require('../models/Retailer');
const Patient = require('../models/Patient');
const Admin = require('../models/Admin');

const modelMap = {
	admin: Admin,
	doctor: Doctor,
	retailer: Retailer,
	patient: Patient
};

const auth = async (req, res, next) => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
		if (!token) {
			return res.status(401).json({ message: 'Authentication token is missing.' });
		}

		if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
			console.error('CRITICAL: JWT_SECRET is missing or too weak (must be at least 32 chars).');
		}

		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET);
		} catch (err) {
			return res.status(401).json({ message: 'Invalid or expired token.' });
		}

		const { id, role } = decoded;
		const Model = modelMap[role];

		if (!Model) return res.status(400).json({ message: 'Invalid user role in token.' });

		const user = await Model.findById(id);

		if (!user) return res.status(401).json({ message: 'User not found.' });

		// Check if user changed password after the token was issued
		if (user.passwordChangedAt) {
			const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
			if (decoded.iat < changedTimestamp) {
				return res.status(401).json({ message: 'User recently changed password! Please log in again.' });
			}
		}

		req.user = { ...user.toObject(), role };
		next();
	} catch (error) {
		console.error('Auth Middleware Error:', error);
		res.status(500).json({ message: 'Internal server error during authentication.' });
	}
};

module.exports = auth;
