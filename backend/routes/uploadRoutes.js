const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadDoctorsFromGoogleSheet, getAllDoctors, deleteDoctor } = require('../controllers/uploadController');

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admins only.' });
    }
};

router.post('/', auth, isAdmin, async (req, res) => {
    try {
        await uploadDoctorsFromGoogleSheet();
        res.status(200).json({ message: 'Upload query called successfully - Please check if data upload was successfull' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload doctor data - ' + error.message });
    }
});

router.get('/getdoctors', auth, isAdmin, getAllDoctors);
router.delete('/deleteDoctor/:id', auth, isAdmin, deleteDoctor);

module.exports = router;
