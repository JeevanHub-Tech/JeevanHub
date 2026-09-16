const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllRetailers,
    getSingleRetailer,
    updateRetailer,
    saveDelhiveryIntegration,
    getShippingIntegrationStatus,
    disconnectShippingIntegration,
    getWarehouse,
    saveWarehouse,
    getBankDetails,
    saveBankDetails
 } = require('../controllers/retailerController');

router.get('/getAllRetailers', auth, getAllRetailers);
router.get('/getSingleRetailer/:id', auth, getSingleRetailer);
router.put('/updateRetailer/:id', auth, updateRetailer);

router.get('/:id/warehouse', auth, getWarehouse);
router.put('/:id/warehouse', auth, saveWarehouse);

// Courier credentials the retailer links so we can pull real tracking data.
router.get('/:id/shipping-integration/status', auth, getShippingIntegrationStatus);
router.put('/:id/shipping-integration', auth, saveDelhiveryIntegration);
router.delete('/:id/shipping-integration', auth, disconnectShippingIntegration);

router.get('/:id/bank-details', auth, getBankDetails);
router.put('/:id/bank-details', auth, saveBankDetails);

module.exports = router;
