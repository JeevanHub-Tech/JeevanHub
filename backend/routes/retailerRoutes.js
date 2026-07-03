const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllRetailers,
    getSingleRetailer,
    updateRetailer
 } = require('../controllers/retailerController');

router.get('/getAllRetailers', auth, getAllRetailers);
router.get('/getSingleRetailer/:id', auth, getSingleRetailer);
router.put('/updateRetailer/:id', auth, updateRetailer);

module.exports = router;
