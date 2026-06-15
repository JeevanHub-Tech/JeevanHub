const getRazorpay = require("../services/razorpayService");
const crypto = require("crypto");

exports.createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (amount === undefined || amount === null || isNaN(amount)) {
            return res.status(400).json({ error: "Valid amount is required" });
        }
        
        const razorpay = getRazorpay();
        const order = await razorpay.orders.create({
            amount: amount * 100, // rupees → paise
            currency: "INR",
            receipt: "receipt_" + Date.now(),
        });

        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Order creation failed" });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ verified: false, message: "Missing required fields" });
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({ verified: false, message: "Server configuration error" });
        }

        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature === razorpaySignature) {
            res.status(200).json({ verified: true });
        } else {
            res.status(400).json({ verified: false, message: "Payment verification failed" });
        }
    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({ verified: false, message: "Internal Server Error" });
    }
};