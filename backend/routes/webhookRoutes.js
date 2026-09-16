const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { handleDelhiveryWebhook } = require('../controllers/webhookController');

// Public endpoint, so bound how hard it can be hammered. Generous enough for a
// busy retailer's scan volume (Delhivery pushes a handful of events per parcel).
const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 240,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many webhook calls, slow down' }
});

// No `auth` middleware -- Delhivery's servers call this, not a logged-in user.
// Authenticity is established by the X-Secret header (see webhookController).
router.post('/delhivery', webhookLimiter, handleDelhiveryWebhook);
router.post('/delhivery/:retailerId', webhookLimiter, handleDelhiveryWebhook);

module.exports = router;
