const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { getAllPatients,
    deletePatient,
    getPatientById,
    getPatientDietYoga,
    getOrdersByBuyerId,
    updatePatient,
    createTempOrder,
    addDietYoga,
    uploadProfileImage,
    uploadMedicalHistory,
    getMedicalHistory,
    deleteMedicalHistoryDoc } = require('../controllers/patientController');

const profileImageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
        folder: 'jeevanhub/patients/profile',
        resource_type: 'image',
        public_id: Date.now() + '-' + file.originalname.split('.')[0]
    }),
});
const profileImageUpload = multer({
    storage: profileImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (/^image\//.test(file.mimetype)) return cb(null, true);
        cb(new Error('Only image files are allowed'));
    }
});

const medicalHistoryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
        folder: 'jeevanhub/patients/medical-history',
        resource_type: 'auto', // handles pdf, jpg, png, etc.
        // Medical records are sensitive and Cloudinary blocks unsigned public
        // delivery of PDFs by default -- store them as "authenticated" so
        // access requires a freshly-signed URL (see buildSignedUrl below),
        // rather than a permanently-public, guessable link.
        type: 'authenticated',
        public_id: Date.now() + '-' + file.originalname.split('.')[0]
    }),
});
const medicalHistoryUpload = multer({
    storage: medicalHistoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|pdf/;
        if (allowed.test(file.mimetype)) return cb(null, true);
        cb(new Error('Only jpeg, jpg, png, and pdf files are allowed'));
    }
});

router.get('/getAllPatients', auth, getAllPatients);
router.put('/updatePatient/:id', auth, updatePatient);
router.delete('/deletePatient/:id', auth, deletePatient);
router.get('/getPatient/:id', auth, getPatientById);
router.get('/dietYoga/:patientId', auth, getPatientDietYoga);
router.get('/orders/:buyerId', auth, getOrdersByBuyerId);
router.post('/:id/profile-image', auth, profileImageUpload.single('image'), uploadProfileImage);
router.post('/:id/medical-history', auth, medicalHistoryUpload.array('documents', 10), uploadMedicalHistory);
router.get('/:id/medical-history', auth, getMedicalHistory);
router.delete('/:id/medical-history/:docId', auth, deleteMedicalHistoryDoc);
// router.post('/dietYoga', addDietYoga);
// router.post('/createTempOrder', createTempOrder);

module.exports = router;
