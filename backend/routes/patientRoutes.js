const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllPatients,
    deletePatient,
    getPatientById,
    getPatientDietYoga,
    getOrdersByBuyerId,
    updatePatient,
    createTempOrder,
    addDietYoga } = require('../controllers/patientController');

router.get('/getAllPatients', auth, getAllPatients);
router.put('/updatePatient/:id', auth, updatePatient);
router.delete('/deletePatient/:id', auth, deletePatient);
router.get('/getPatient/:id', auth, getPatientById);
router.get('/dietYoga/:patientId', auth, getPatientDietYoga);
router.get('/orders/:buyerId', auth, getOrdersByBuyerId);
// router.post('/dietYoga', addDietYoga);
// router.post('/createTempOrder', createTempOrder);

module.exports = router;
