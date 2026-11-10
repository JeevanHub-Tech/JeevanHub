const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createOrder, verifyPayment, handleCashfreeWebhook } = require("../controllers/paymentController");

router.post("/create-order", auth, createOrder);
router.post("/verify-payment", auth, verifyPayment);
router.post("/cashfree-webhook", handleCashfreeWebhook);

module.exports = router;
