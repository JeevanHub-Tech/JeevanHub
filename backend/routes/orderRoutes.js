const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs'); // Added missing fs import
const mongoose = require('mongoose'); // Added missing mongoose import for validation

const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: "jeevanhub/prescriptions",
      resource_type: "auto",
      public_id: Date.now() + "-" + file.originalname.split('.')[0]
    };
  },
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
router.post('/:orderId/payment-proof', auth, upload.single('paymentProof'), orderController.uploadPaymentProof);


module.exports = router;
