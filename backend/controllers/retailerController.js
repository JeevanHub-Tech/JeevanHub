const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Retailer = require("../models/Retailer");
const Order = require("../models/Order");
const Medicine = require("../models/Medicine");

exports.getAllRetailers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const retailers = await Retailer.find().select('-password');

        if (!retailers || retailers.length === 0) {
            return res.status(404).json({
                message: "No retailers found in the database",
            });
        }

        res.status(200).json(retailers);
    } catch (error) {
        console.error("Error fetching retailers:", error);
        res.status(500).json({
            message: "Failed to fetch retailers",
            error: error.message,
        });
    }
};

exports.getSingleRetailer = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: "Not authorized to view this retailer's details" });
        }

        const retailer = await Retailer.findById(id).select('-password');

        if (!retailer) {
            return res.status(404).json({
                message: "Retailer not found with the given ID",
            });
        }

        res.status(200).json(retailer);
    } catch (error) {
        console.error("Error fetching single retailer:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid Retailer ID format" });
        }
        res.status(500).json({
            message: "Failed to fetch retailer",
            error: error.message,
        });
    }
};

