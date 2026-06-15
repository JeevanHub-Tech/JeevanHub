const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    generateBlogs,
    getAllBlogs,
    deleteBlog,
    updateBlog
} = require('../controllers/generateBlogsController');

// Create a new blog
router.post('/generateBlogs', auth, generateBlogs);
router.get('/getAllBlogs', getAllBlogs); // Kept public for listing
router.delete('/deleteBlog/:id', auth, deleteBlog);
router.put('/updateBlog/:id', auth, updateBlog);

module.exports = router;