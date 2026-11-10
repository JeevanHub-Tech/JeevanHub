const cashfreeService = require("../services/cashfreeService");
const Order = require("../models/Order");
const Booking = require("../models/Booking");

/**
 * Create a payment order via Cashfree PG
 * POST /api/payment/create-order
 */
exports.createOrder = async (req, res) => {
    try {
        const { amount, orderId, customerName, customerEmail, customerPhone } = req.body;
        if (amount === undefined || amount === null || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ error: "Valid positive amount is required" });
        }

        const uniqueOrderId = orderId || `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        const customer = {
            customerId: req.user?._id?.toString() || `cust_${Date.now()}`,
            name: customerName || (req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() : 'Patient'),
            email: customerEmail || req.user?.email || 'patient@jeevanhub.com',
            phone: customerPhone || req.user?.phone || '9999999999'
        };

        const cfOrder = await cashfreeService.createPgOrder({
            orderId: uniqueOrderId,
            orderAmount: Number(amount),
            customer
        });

        res.status(200).json({
            id: cfOrder.order_id,
            order_id: cfOrder.order_id,
            cf_order_id: cfOrder.cf_order_id,
            payment_session_id: cfOrder.payment_session_id,
            amount: cfOrder.order_amount,
            currency: cfOrder.order_currency,
            order_status: cfOrder.order_status
        });
    } catch (err) {
        console.error("Cashfree createOrder controller error:", err.message);
        res.status(500).json({ error: err.message || "Failed to create payment session" });
    }
};

/**
 * Verify payment status directly with Cashfree
 * POST /api/payment/verify-payment
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { orderId, cashfreeOrderId } = req.body;
        const targetId = cashfreeOrderId || orderId;

        if (!targetId) {
            return res.status(400).json({ verified: false, message: "Missing order ID" });
        }

        const cfOrder = await cashfreeService.getOrderStatus(targetId);

        if (cfOrder.order_status === "PAID") {
            return res.status(200).json({
                verified: true,
                orderId: cfOrder.order_id,
                cfOrderId: cfOrder.cf_order_id,
                amount: cfOrder.order_amount,
                status: cfOrder.order_status
            });
        }

        return res.status(400).json({
            verified: false,
            status: cfOrder.order_status,
            message: `Order status is ${cfOrder.order_status}, not PAID`
        });
    } catch (error) {
        console.error("Cashfree verifyPayment error:", error.message);
        res.status(500).json({ verified: false, message: error.message || "Verification failed" });
    }
};

/**
 * Cashfree Webhook Handler
 * POST /api/payment/cashfree-webhook
 */
exports.handleCashfreeWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-webhook-signature"];
        const timestamp = req.headers["x-webhook-timestamp"];
        const rawBody = req.rawBody || JSON.stringify(req.body);

        const isValid = cashfreeService.verifyWebhookSignature(rawBody, signature, timestamp);
        if (!isValid) {
            console.warn("⚠️ Untrusted Cashfree webhook signature received");
            return res.status(400).json({ error: "Invalid webhook signature" });
        }

        const payload = req.body;
        const eventType = payload?.type;
        const orderData = payload?.data?.order;
        const orderId = orderData?.order_id;

        console.log(`[Cashfree Webhook] Event: ${eventType}, Order: ${orderId}`);

        if (eventType === "PAYMENT_SUCCESS_WEBHOOK" || eventType === "ORDER_PAID_WEBHOOK") {
            if (orderId) {
                // Check if it's a medicine order
                const existingOrder = await Order.findOne({ 
                    $or: [{ cashfreeOrderId: orderId }, { _id: orderId }] 
                });
                if (existingOrder && existingOrder.paymentStatus !== "paid") {
                    existingOrder.paymentStatus = "paid";
                    existingOrder.cashfreePaymentId = payload.data?.payment?.cf_payment_id || orderData?.cf_order_id;
                    await existingOrder.save();
                    console.log(`[Cashfree Webhook] Marked Order ${existingOrder._id} as paid`);
                }

                // Check if it's a consultation booking
                const existingBooking = await Booking.findOne({
                    $or: [{ "paymentDetails.cashfreeOrderId": orderId }, { _id: orderId }]
                });
                if (existingBooking && existingBooking.paymentStatus !== "Completed") {
                    existingBooking.paymentStatus = "Completed";
                    existingBooking.paymentConfirmedAt = new Date();
                    existingBooking.requestAccept = "accepted";
                    await existingBooking.save();
                    console.log(`[Cashfree Webhook] Marked Booking ${existingBooking._id} as Completed`);
                }
            }
        }

        return res.status(200).json({ status: "ok" });
    } catch (err) {
        console.error("Cashfree webhook processing error:", err);
        return res.status(500).json({ error: "Webhook error" });
    }
};
