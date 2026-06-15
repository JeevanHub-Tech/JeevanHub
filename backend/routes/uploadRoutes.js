const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadDoctorsFromGoogleSheet, getAllDoctors, deleteDoctor } = require('../controllers/uploadController');

router.post('/', auth, async (req, res) => {
    try {
        await uploadDoctorsFromGoogleSheet();
        res.status(200).json({ message: 'Upload query called successfully - Please check if data upload was successfull' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload doctor data - ' + error.message });
    }
});

router.get('/getdoctors', auth, getAllDoctors);
router.delete('/deleteDoctor/:id', auth, deleteDoctor);

module.exports = router;
