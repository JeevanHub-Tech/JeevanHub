const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const {
    getOneBlog,
    getBlogsByAuthor,
    getallBlog,
    createBlog,
    updateBlog,
    deleteBlog
} = require("../controllers/blogController");

// Multer setup for Cloudinary image uploads from the blog editor
const cloudStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: "jeevanhub/blogs",
            resource_type: "auto"
        };
    },
});
const cloudUpload = multer({ storage: cloudStorage });

// Upload an image from the blog editor to Cloudinary
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
    res.status(200).json({ url: req.file.path, publicId: req.file.filename });
});

// Delete images from Cloudinary (called when a doctor removes an inline
// image from the editor, so orphaned uploads don't pile up in the account)
router.post('/delete-images', auth, async (req, res) => {
    try {
        const { publicIds } = req.body;
        if (!publicIds || !Array.isArray(publicIds)) {
            return res.status(400).json({ message: 'Invalid publicIds' });
        }
        await Promise.all(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
        res.status(200).json({ message: 'Images deleted successfully' });
    } catch (err) {
        console.error('Failed to delete blog images:', err);
        res.status(500).json({ message: 'Failed to delete images', error: err.message });
    }
});

// Create a new blog
router.post('/', auth, createBlog);

// Get all blogs (for public view)
router.get('/', getallBlog);

// Get blogs by author (doctor or admin)
router.get('/author/:authorType/:authorId', getBlogsByAuthor);

// Get blogs by doctor ID (for backward compatibility)
router.get('/doctor/:doctorId', (req, res, next) => {
    req.params.authorType = 'doctor';
    req.params.authorId = req.params.doctorId;
    getBlogsByAuthor(req, res).catch(next);
});

// Get a single blog by ID
router.get('/:id', getOneBlog);

// Update a blog
router.put('/:id', auth, updateBlog);

// Delete a blog
router.delete('/:id', auth, deleteBlog);

module.exports = router;