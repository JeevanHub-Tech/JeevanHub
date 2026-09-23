// routes/shippingRoutes.js
//
// Platform-agnostic shipping endpoints for serviceability checks, freight
// estimation, automated shipment creation, label downloads, pickup requests,
// and shipment cancellation. All routes require JWT authentication.

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const shippingController = require('../controllers/shippingController');

// Rate limiter for external API bridging routes to prevent courier rate-limit bans
const freightRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 estimation requests per windowMs
    message: { message: 'Too many freight estimations. Please wait a moment and try again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Pincode serviceability (used during checkout)
router.get('/serviceability', auth, freightRateLimiter, shippingController.checkServiceability);

// Freight estimation (used in cart & checkout)
router.post('/estimate-freight', auth, freightRateLimiter, shippingController.estimateFreight);

// Auto-create shipment (retailer ships an order via the delivery partner API)
router.post('/orders/:orderId/create-shipment', auth, shippingController.createShipment);

// Download shipping label PDF
router.get('/orders/:orderId/label', auth, shippingController.getShippingLabel);

// Request pickup from the delivery partner
router.post('/orders/:orderId/request-pickup', auth, shippingController.requestPickup);

// Cancel a shipment before pickup
router.post('/orders/:orderId/cancel-shipment', auth, shippingController.cancelShipment);

module.exports = router;
