const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createCallbackRequest, getAllCallbackRequests } = require('../controllers/callbackRequestController');

router.post('/', createCallbackRequest);

router.get('/', auth, (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied.' });
    }
    next();
}, getAllCallbackRequests);

module.exports = router;
