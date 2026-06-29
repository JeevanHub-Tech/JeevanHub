const express = require('express');
const router = express.Router();
const { addMedicine, updateMedicine, getAllMedicines, getMyMedicines, deleteMedicine } = require('../controllers/medicineController');
const auth = require('../middleware/auth');
const multer = require('multer');
const { addMedicinesFromZip, addBulkMedicines } = require('../controllers/medicineController');

const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Multer setup for local ZIP file uploads
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const localUpload = multer({ storage: localStorage });

// Multer setup for Cloudinary Image uploads
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "jeevanhub/medicines",
      resource_type: "auto"
    };
  },
});
const cloudUpload = multer({ storage: cloudStorage });

// Public Routes
router.get('/', getAllMedicines); // Public route to view all medicines

// Generic Image Upload for Bulk Table
router.post('/upload-image', auth, (req, res, next) => {
    cloudUpload.single('image')(req, res, function (err) {
        if (err) {
            console.error("Multer Error:", err);
            return res.status(400).json({ message: 'Upload failed', error: err.message });
        }
        next();
    });
}, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
    }
    res.status(200).json({ url: req.file.path }); 
});

// Delete Images from Cloudinary (used when discarding drafts/rows)
router.post('/delete-images', auth, async (req, res) => {
    try {
        const { urls } = req.body;
        if (!urls || !Array.isArray(urls)) return res.status(400).json({ message: 'Invalid URLs' });
        
        for (const url of urls) {
            if (url.includes('cloudinary')) {
                // Extract public ID (everything after /upload/v<version>/ up to the extension)
                const split = url.split('/upload/');
                if (split.length === 2) {
                    const pathAfterUpload = split[1].split('/').slice(1).join('/'); // removes the v12345/
                    const publicId = pathAfterUpload.split('.')[0]; // removes extension
                    await cloudinary.uploader.destroy(publicId);
                }
            }
        }
        res.status(200).json({ message: 'Images deleted successfully' });
    } catch (err) {
        console.error("Failed to delete images:", err);
        res.status(500).json({ message: 'Failed to delete images', error: err.message });
    }
});

// Retailer Routes (Protected)
router.post('/add', auth, localUpload.single('file'), addMedicinesFromZip); // Add medicine (Retailer only)
router.post('/add-bulk', auth, addBulkMedicines); // Bulk Add medicines from tabular UI
router.put('/:id', auth, cloudUpload.single('image'), updateMedicine); // Update medicine (Retailer only)
router.get('/my', auth, getMyMedicines); // Get logged-in retailer's medicines
router.delete('/:id', auth, deleteMedicine); // Delete medicine (Retailer only)

module.exports = router;
