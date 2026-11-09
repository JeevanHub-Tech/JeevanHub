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
    saveBankDetails,
    getPayoutMethods,
    addPayoutMethod,
    updatePayoutMethod,
    deletePayoutMethod,
    setPrimaryPayoutMethod,
    toggleRetailerVerification,
    getRetailerEligibility
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

// Payout Methods (Multi-Bank & UPI CRUD)
router.get('/:id/payout-methods', auth, getPayoutMethods);
router.post('/:id/payout-methods', auth, addPayoutMethod);
router.put('/:id/payout-methods/:methodId', auth, updatePayoutMethod);
router.delete('/:id/payout-methods/:methodId', auth, deletePayoutMethod);
router.patch('/:id/payout-methods/:methodId/primary', auth, setPrimaryPayoutMethod);

// Legacy bank details endpoints
router.get('/:id/bank-details', auth, getBankDetails);
router.put('/:id/bank-details', auth, saveBankDetails);

// Retailer onboarding verification & status
router.put('/:id/verify', auth, toggleRetailerVerification);
router.get('/:id/eligibility', auth, getRetailerEligibility);

module.exports = router;
