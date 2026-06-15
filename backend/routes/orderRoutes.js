const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs'); // Added missing fs import
const mongoose = require('mongoose'); // Added missing mongoose import for validation

// Configure storage for payment proof screenshots
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const dir = 'uploads/payment-proofs';
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		cb(null, dir);
	},
	filename: function (req, file, cb) {
		cb(null, `payment-${Date.now()}-${file.originalname}`);
	}
});

const upload = multer({ storage });

// Routes with authentication middleware
router.post('/', auth, orderController.createOrder);
router.get('/', auth, orderController.getOrders);

// ✅ Specific routes should be defined before generic ones.
router.get('/getAllTransactions', auth, orderController.getAllTransactions);
router.get('/getOrdersByBuyerId/:buyerId', auth, orderController.getOrdersByBuyerId);
router.get('/getOrdersByRetailerId/:retailerId', auth, orderController.getOrdersByRetailerId);
router.get('/getFeedbackByRetailerId/:retailerId', auth, orderController.getFeedbackByRetailerId);
router.get('/reviews/:buyerId', auth, orderController.getReviewedOrdersByBuyerId);

// ✅ This generic route should be last to avoid conflicts.
router.get('/:id', auth, orderController.getOrderById);

router.put("/updateOrderReview/:orderId", auth, orderController.updateOrderReview);
router.put('/status', auth, orderController.updateOrderStatus);
router.put('/retailer-status', auth, orderController.updateRetailerStatus);
router.post('/:orderId/payment-proof', auth, upload.single('paymentProof'), orderController.uploadPaymentProof);


module.exports = router;
