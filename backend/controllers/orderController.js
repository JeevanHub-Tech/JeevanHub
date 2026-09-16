// controllers/orderController.js
const Order = require('../models/Order');
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const Cart = require('../models/Cart');
const Booking = require('../models/Booking');
const Retailer = require('../models/Retailer');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const getRazorpay = require('../services/razorpayService');
const notificationController = require('./notificationController');
const delhiveryService = require('../services/delhiveryService');
const { applyTrackingToOrder, recomputeOrderStatus } = require('../services/shipmentSync');
const { startPayoutHoldIfDelivered } = require('../utils/payoutHold');


exports.updateOrderReview = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { rating, comment, receivingDate } = req.body;

        const existingOrder = await Order.findById(orderId);
        if (!existingOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (existingOrder.buyer.buyerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to review this order" });
        }
        if (existingOrder.orderStatus !== "delivered") {
            return res.status(400).json({ message: "Reviews can only be submitted for delivered orders" });
        }

        // Validate required fields
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        // Build review object
        const reviewData = {
            rating,
            comment,
            createdAt: new Date(), // when review submitted
            deliveredAt: receivingDate ? new Date(receivingDate) : undefined,
        };

        // Update the order
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    review: reviewData
                },
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({
            message: "Feedback updated successfully",
            order: updatedOrder,
        });
    } catch (error) {
        console.error("Error updating feedback:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.createOrder = async (req, res) => {
    if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied. Only patients can create orders." });
    }
    try {
        const {
            items,
            buyer,
            shippingAddress,
            paymentMethod,
            shippingCharge,
            prescriptionUrl,
            prescriptionUrls,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        } = req.body;

        // Accept either the legacy single prescriptionUrl or the new prescriptionUrls
        // array (multi-file checkout upload), normalized to an array either way.
        const formattedPrescriptionUrls = Array.isArray(prescriptionUrls) && prescriptionUrls.length > 0
            ? prescriptionUrls.filter(Boolean)
            : (prescriptionUrl ? [prescriptionUrl] : []);

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }
        if (!['cashOnDelivery', 'onlinePayment'].includes(paymentMethod)) {
            return res.status(400).json({ message: "Invalid payment method" });
        }

        // Price, stock and prescription requirements are derived from the DB record,
        // never trusted from the client, so a tampered request body can't under-charge
        // or skip the Rx gate.
        const medicines = await Medicine.find({
            _id: { $in: items.map(item => item.medicineId) }
        }).populate('retailerId'); // populate retailerId to access razorpayAccountId
        const medicineById = new Map(medicines.map(med => [med._id.toString(), med]));

        const formattedItems = items.map(item => {
            const medicine = medicineById.get(String(item.medicineId));
            if (!medicine) {
                throw Object.assign(new Error(`Medicine ${item.medicineId} not found`), { status: 400 });
            }
            return {
                medicineId: medicine._id,
                quantity: item.quantity,
                subTotal: medicine.price * item.quantity,
                // temporarily hold retailerId for transfer logic
                _retailerId: medicine.retailerId._id,
                _razorpayAccountId: medicine.retailerId.razorpayAccountId
            };
        });

        const totalPrice = formattedItems.reduce((sum, item) => sum + item.subTotal, 0);

        const requiresPrescription = medicines.some(med => med.prescription === true);
        if (requiresPrescription && formattedPrescriptionUrls.length === 0) {
            return res.status(400).json({ message: "This order contains a prescription-required medicine. Please upload a valid prescription before checkout." });
        }

        // Map buyer to schema-required fields
        const formattedBuyer = {
            firstName: buyer.firstName,
            lastName: buyer.lastName,
            type: buyer.type === 'patient' ? 'Patient' : 'Doctor', // ensure enum matches
            buyerId: req.user._id // SECURE: Override with authenticated user ID
        };

        const newOrder = new Order({
            items: formattedItems.map(item => ({
                medicineId: item.medicineId,
                quantity: item.quantity,
                subTotal: item.subTotal
            })),
            totalPrice,
            shippingCharge: Number(shippingCharge) || 0,
            buyer: formattedBuyer,
            shippingAddress,
            paymentMethod,
            paymentStatus: 'pending',
            orderStatus: 'pending'
        });

        if (requiresPrescription) {
            newOrder.prescriptionUrls = formattedPrescriptionUrls;
            newOrder.prescriptionUrl = formattedPrescriptionUrls[0];
        }

        let pendingTransfers = []; // Store transfers to be executed after DB save

        if (paymentMethod === 'onlinePayment') {
            if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
                return res.status(400).json({ message: "Missing payment verification details" });
            }
            if (!process.env.RAZORPAY_KEY_SECRET) {
                return res.status(500).json({ message: "Payment gateway not configured" });
            }
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(razorpayOrderId + "|" + razorpayPaymentId)
                .digest('hex');
            if (expectedSignature !== razorpaySignature) {
                return res.status(400).json({ message: "Payment verification failed" });
            }
            // Signature only proves the payment/order pair is genuine, not that the
            // amount charged matches this cart -- confirm the Razorpay order amount
            // against the server-computed total before trusting the payment.
            const razorpayOrder = await getRazorpay().orders.fetch(razorpayOrderId);
            if (razorpayOrder.amount !== Math.round((totalPrice + (Number(shippingCharge) || 0)) * 100)) {
                return res.status(400).json({ message: "Paid amount does not match order total" });
            }
            newOrder.razorpayOrderId = razorpayOrderId;
            newOrder.paymentId = razorpayPaymentId;
            newOrder.paymentStatus = 'paid';

            // Calculate transfers
            const PLATFORM_COMMISSION_PERCENT = 10;
            const transfersByRetailer = new Map();

            formattedItems.forEach((item, index) => {
                if (item._razorpayAccountId) {
                    const payoutAmount = item.subTotal * (1 - (PLATFORM_COMMISSION_PERCENT / 100));
                    if (!transfersByRetailer.has(item._razorpayAccountId)) {
                        transfersByRetailer.set(item._razorpayAccountId, {
                            account: item._razorpayAccountId,
                            amount: 0,
                            currency: 'INR',
                            on_hold: true,
                            notes: { orderId: '' },
                            itemIndices: []
                        });
                    }
                    const transferData = transfersByRetailer.get(item._razorpayAccountId);
                    transferData.amount += Math.round(payoutAmount * 100);
                    transferData.itemIndices.push(index);
                }
            });

            pendingTransfers = Array.from(transfersByRetailer.values());
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Check stock and decrement medicine stock atomically
            for (const item of formattedItems) {
                const result = await Medicine.updateOne(
                    { _id: item.medicineId, quantity: { $gte: item.quantity } },
                    { $inc: { quantity: -item.quantity } },
                    { session }
                );

                if (result.modifiedCount === 0) {
                    // Race condition - stock was claimed by another order or insufficient
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(409).json({ message: 'Stock no longer available for one or more items' });
                }
            }

            await newOrder.save({ session });
            // Clear the cart
            await Cart.findOneAndDelete({ patientId: req.user._id }, { session });

            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

        // Execute Razorpay Transfers
        if (pendingTransfers.length > 0) {
            try {
                const razorpay = getRazorpay();
                pendingTransfers.forEach(t => t.notes.orderId = newOrder._id.toString());
                
                // Group item indices to update transferId later
                const transferRequests = pendingTransfers.map(t => ({
                    account: t.account,
                    amount: t.amount,
                    currency: t.currency,
                    on_hold: t.on_hold,
                    notes: t.notes
                }));

                const transferResponse = await razorpay.payments.transfer(razorpayPaymentId, {
                    transfers: transferRequests
                });

                // Link transfer ID to items (transferResponse.items contains the transfers)
                // Note: razorpay returns an array of transfers in `items` property of the response
                if (transferResponse && transferResponse.items) {
                    pendingTransfers.forEach((t, index) => {
                        const razorpayTransferId = transferResponse.items[index].id;
                        t.itemIndices.forEach(itemIndex => {
                            newOrder.items[itemIndex].razorpayTransferId = razorpayTransferId;
                        });
                    });
                    await newOrder.save(); // Save transfer IDs
                }
            } catch (transferError) {
                console.error("Razorpay Transfer Error:", transferError);
                // Do not throw error here, order is already saved. Log for manual intervention.
            }
        }

        // C4-8: Generate notification securely from the backend
        const notificationMessage = `Your order #${newOrder._id} has been placed successfully.`;
        await notificationController.createNotification(
            req.user._id,
            req.user.role,
            newOrder._id,
            notificationMessage,
            'order'
        );

        // Notify if multiple retailers
        const retailerIds = [...new Set(formattedItems.map(item => item.retailerId))].filter(Boolean);
        if (retailerIds.length > 1) {
            const multiRetailerMsg = `Your order #${newOrder._id} contains items from ${retailerIds.length} different retailers.`;
            await notificationController.createNotification(
                req.user._id,
                req.user.role,
                newOrder._id,
                multiRetailerMsg,
                'order'
            );
        }

        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(error.status || 500).json({ message: error.message });
    }
};

exports.uploadPrescription = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'At least one prescription image is required' });
        }
        const urls = req.files.map(file => file.path);
        // Kept for older clients that only read a single `url`.
        res.status(200).json({ url: urls[0], urls });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadPaymentProof = async (req, res) => {
    try {
        const { orderId } = req.params;

        const existingOrder = await Order.findById(orderId);
        if (!existingOrder) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (existingOrder.buyer.buyerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'Payment proof image is required' });
        }

        // Update order with payment proof
        const order = await Order.findByIdAndUpdate(
            orderId,
            {
                paymentProof: req.file.path,
                paymentStatus: 'paid',
                orderStatus: 'processing'
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (req.user.role !== 'admin' && req.user.role !== 'retailer' && order.buyer.buyerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateRetailerStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'retailer') {
            return res.status(403).json({ message: "Access denied" });
        }
        const { orderId, status } = req.body;
        const order = await Order.findByIdAndUpdate(
            orderId,
            { retailerStatus: status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ===========================================================================
// Courier shipment: ship with an AWB, then read tracking back
// ===========================================================================

// How long a cached carrier response is served before we re-poll Delhivery.
// Delhivery allows 750 requests / 5 min / IP, and scans only land every few
// hours, so there is nothing to gain from polling on every page load.
const TRACKING_CACHE_MS = 5 * 60 * 1000;

const ownsAnyItem = (order, retailerId) => order.items.some((item) => {
    const owner = item.medicineId?.retailerId;
    if (!owner) return false;
    return String(owner._id || owner) === String(retailerId);
});

// Shape the tracking response the frontend renders, so the cached and live
// paths can't drift apart.
const serializeTracking = (order, { source, currentStatus, currentStatusCode, currentLocation, timeline }) => ({
    trackingId: order.shipping?.trackingId || null,
    platform: order.shipping?.platform || null,
    shippedAt: order.shipping?.shippedAt || null,
    orderStatus: order.orderStatus,
    currentStatus: currentStatus || null,
    currentStatusCode: currentStatusCode || null,
    currentLocation: currentLocation || null,
    lastUpdated: order.shipping?.lastPolledAt || null,
    timeline: timeline || [],
    source
});

/**
 * PUT /api/orders/:id/ship
 *
 * The retailer's "Ship Order" action. Replaces the old blind status toggle: an
 * AWB is required, and for retailers whose credentials let us call Delhivery we
 * verify the AWB actually exists before accepting it, so a typo fails here
 * instead of silently producing an order nobody can track.
 */
exports.shipOrder = async (req, res) => {
    try {
        if (req.user.role !== 'retailer') {
            return res.status(403).json({ message: "Only retailers can ship orders" });
        }

        const { id } = req.params;
        const { platform, trackingId } = req.body || {};

        if (platform !== 'delhivery') {
            return res.status(400).json({ message: "Only 'delhivery' is supported as a shipping platform right now" });
        }
        const awb = typeof trackingId === 'string' ? trackingId.trim() : '';
        if (awb.length < 5) {
            return res.status(400).json({ message: "Enter the AWB / waybill number from your Delhivery shipment" });
        }

        const order = await Order.findById(id).populate('items.medicineId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (!ownsAnyItem(order, req.user._id)) {
            return res.status(403).json({ message: 'You do not own any items in this order' });
        }
        if (!['accepted', 'processing'].includes(order.orderStatus)) {
            return res.status(400).json({
                message: `Cannot ship an order that is '${order.orderStatus}'. Accept the order first.`
            });
        }

        // Refuse to reuse an AWB that is already attached to a different order --
        // otherwise the webhook lookup by AWB becomes ambiguous.
        const awbInUse = await Order.findOne({ 'shipments.trackingId': awb, _id: { $ne: order._id } }).select('_id');
        if (awbInUse) {
            return res.status(409).json({ message: `AWB ${awb} is already attached to another order.` });
        }

        const retailer = await delhiveryService.findRetailerWithCredentials(req.user._id);
        if (!retailer?.shippingIntegrations?.delhivery?.isConfigured) {
            return res.status(400).json({
                message: "Link your Delhivery account before shipping. Choose a credential method in the Ship Order dialog."
            });
        }

        const existingIdx = order.shipments.findIndex(s => s.retailerId?.toString() === req.user._id.toString());
        const shipmentData = {
            platform: 'delhivery',
            trackingId: awb,
            retailerId: req.user._id,
            shippedAt: new Date(),
            creationMethod: 'manual',
            lastPolledStatus: null,
            lastPolledStatusCode: null,
            lastPolledLocation: null,
            lastPolledAt: null,
            lastPollError: null,
            trackingTimeline: []
        };

        if (existingIdx !== -1) {
            order.shipments[existingIdx] = shipmentData;
        } else {
            order.shipments.push(shipmentData);
        }

        const currentShipment = existingIdx !== -1 ? order.shipments[existingIdx] : order.shipments[order.shipments.length - 1];

        // apiToken / oauth2 let us verify the waybill up front. Webhook-only
        // retailers can't be checked -- we have no outbound credentials, so the
        // first push from Delhivery is what confirms the AWB.
        if (delhiveryService.canPoll(retailer)) {
            const validation = await delhiveryService.validateAwb(retailer, awb);
            if (!validation.valid) {
                return res.status(400).json({
                    message: `Delhivery could not confirm AWB ${awb}. ${validation.error}`
                });
            }
            const { result } = validation;
            currentShipment.lastPolledStatus = result.currentStatus;
            currentShipment.lastPolledStatusCode = result.currentStatusCode;
            currentShipment.lastPolledLocation = result.currentLocation;
            currentShipment.lastPolledAt = new Date();
            currentShipment.trackingTimeline = result.timeline;
        }

        // Mark this retailer's items shipped and recompute the order-wide status.
        order.items.forEach((item) => {
            const owner = item.medicineId?.retailerId;
            if (owner && String(owner._id || owner) === String(req.user._id)) {
                item.itemStatus = 'shipped';
            }
        });
        order.orderStatus = recomputeOrderStatus(order);
        order.retailerStatus = 'shipped';

        // A label created on an already-delivered AWB (rare, but possible when a
        // retailer ships first and records it later) should settle immediately.
        if (currentShipment.lastPolledStatusCode) {
            const mapped = delhiveryService.mapDelhiveryStatusToOrderStatus(
                currentShipment.lastPolledStatusCode,
                currentShipment.lastPolledStatus
            );
            if (mapped === 'delivered') {
                order.items.forEach((item) => {
                    const owner = item.medicineId?.retailerId;
                    if (owner && String(owner._id || owner) === String(req.user._id)) {
                        item.itemStatus = 'delivered';
                    }
                });
                order.orderStatus = recomputeOrderStatus(order);
                startPayoutHoldIfDelivered(order, order.orderStatus);
            }
        }

        await order.save();

        try {
            await notificationController.createNotification(
                order.buyer.buyerId,
                order.buyer.type.toLowerCase(),
                order._id,
                `Your order #${order._id.toString().slice(-6)} has shipped with Delhivery. AWB: ${awb}`,
                'order'
            );
        } catch (notifyError) {
            // The shipment is already saved -- a failed notification must not
            // make the retailer think shipping failed.
            console.error('Ship notification failed:', notifyError.message);
        }

        return res.status(200).json({
            message: 'Order marked as shipped',
            order: {
                _id: order._id,
                orderStatus: order.orderStatus,
                shipments: order.shipments
            }
        });
    } catch (error) {
        console.error('Error shipping order:', error);
        return res.status(500).json({ message: error.message || 'Server error' });
    }
};

/**
 * GET /api/orders/:id/tracking
 *
 * Returns the shipment timeline for the buyer, the selling retailer, or an
 * admin. Serves the cached copy inside the cache window; otherwise re-polls
 * Delhivery and, if the carrier now says delivered, settles the order (which
 * starts the payout hold) as a side effect.
 */
exports.getOrderTracking = async (req, res) => {
    try {
        const { id } = req.params;
        const { retailerId } = req.query;

        const order = await Order.findById(id).populate('items.medicineId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const isBuyer = order.buyer.buyerId.toString() === req.user._id.toString();
        const isRetailer = req.user.role === 'retailer' && ownsAnyItem(order, req.user._id);
        const isAdmin = req.user.role === 'admin';
        if (!isBuyer && !isRetailer && !isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!order.shipments || order.shipments.length === 0) {
            return res.status(404).json({ message: 'This order has no shipment tracking yet.' });
        }

        if (!retailerId) {
            // Return ALL shipments' tracking data
            return res.status(200).json({
                orderStatus: order.orderStatus,
                shipments: order.shipments
            });
        }

        const shipment = order.shipments.find(s => s.retailerId?.toString() === retailerId);
        if (!shipment) {
            return res.status(404).json({ message: 'No shipment found for this retailer' });
        }

        const cached = () => ({
            orderStatus: order.orderStatus,
            shipment,
            source: 'cached'
        });

        const retailer = await delhiveryService.findRetailerWithCredentials(shipment.retailerId);

        // Webhook-only (or since-disconnected) retailers: the cache is all there is.
        if (!delhiveryService.canPoll(retailer)) {
            return res.status(200).json(cached());
        }

        const freshEnough = shipment.lastPolledAt
            && (Date.now() - new Date(shipment.lastPolledAt).getTime()) < TRACKING_CACHE_MS;
        if (freshEnough) {
            return res.status(200).json(cached());
        }

        let tracking;
        try {
            tracking = await delhiveryService.trackShipment(retailer, shipment.trackingId);
        } catch (error) {
            // Delhivery being down shouldn't blank out the timeline we already
            // have -- record why and serve the cache.
            console.error(`Tracking fetch failed for AWB ${shipment.trackingId}:`, error.message);
            shipment.lastPollError = error.message;
            await order.save();
            return res.status(200).json({ ...cached(), error: error.message });
        }

        const result = applyTrackingToOrder(order, shipment, tracking);
        await order.save();

        if (result.becameDelivered) {
            try {
                await notificationController.createNotification(
                    order.buyer.buyerId,
                    order.buyer.type.toLowerCase(),
                    order._id,
                    `Your order #${order._id.toString().slice(-6)} has been delivered.`,
                    'order'
                );
            } catch (notifyError) {
                console.error('Delivery notification failed:', notifyError.message);
            }
        }

        return res.status(200).json({
            orderStatus: order.orderStatus,
            shipment,
            source: 'live'
        });
    } catch (error) {
        console.error('Error fetching tracking:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid order ID' });
        }
        return res.status(500).json({ message: error.message || 'Failed to fetch tracking data' });
    }
};

// How long after delivery a paid order's payout to the retailer stays "held"
// before the settlement cron auto-releases it -- the patient's dispute window.
// Both PAYOUT_HOLD_GRACE_MS and startPayoutHoldIfDelivered now live in
// utils/payoutHold.js, because delivery can also be declared by the Delhivery
// webhook and the polling cron, and all paths must start the hold identically.

exports.updateOrderStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'retailer') {
            return res.status(403).json({ message: "Access denied" });
        }
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> update order status called");
        const { orderId, status } = req.body;

        const order = await Order.findById(orderId).populate('items.medicineId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If admin, they can update the global status directly
        if (req.user.role === 'admin') {
            order.orderStatus = status;
            // Also update all items to match
            order.items.forEach(item => item.itemStatus = status);
            startPayoutHoldIfDelivered(order, status);
            await order.save();
            return res.status(200).json(order);
        }

        // If retailer, only update their specific items
        let updatedAnyItem = false;
        order.items.forEach(item => {
            if (item.medicineId && item.medicineId.retailerId && item.medicineId.retailerId.toString() === req.user._id.toString()) {
                item.itemStatus = status;
                updatedAnyItem = true;
            }
        });

        if (!updatedAnyItem) {
            return res.status(403).json({ message: 'You do not own any items in this order' });
        }

        // Calculate global orderStatus based on item statuses.
        // 'accepted'/'rejected' are the retailer's initial response to a
        // pending order and must be checked before the generic "some item
        // moved past pending -> processing" fallback, otherwise Accept/Reject
        // both collapse into 'processing' and the order disappears from the
        // Accepted/Rejected tabs in the retailer's MyOrders screen.
        const allStatuses = order.items.map(item => item.itemStatus);

        if (allStatuses.every(s => s === 'delivered')) {
            order.orderStatus = 'delivered';
        } else if (allStatuses.every(s => s === 'shipped' || s === 'delivered')) {
            order.orderStatus = 'shipped';
        } else if (allStatuses.every(s => s === 'rejected')) {
            order.orderStatus = 'rejected';
        } else if (allStatuses.every(s => s === 'accepted' || s === 'rejected')) {
            order.orderStatus = 'accepted';
        } else if (allStatuses.some(s => s === 'processing' || s === 'shipped' || s === 'delivered')) {
            order.orderStatus = 'processing';
        } else if (allStatuses.some(s => s !== 'pending')) {
            order.orderStatus = 'accepted';
        } else {
            order.orderStatus = 'pending';
        }

        startPayoutHoldIfDelivered(order, order.orderStatus);
        await order.save();

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Patient-raised dispute over a held payout (e.g. "paid but never received the
// order") -- freezes the settlement cron's auto-release so an admin has to look at it.
exports.raiseOrderDispute = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: "Only patients can raise a dispute" });
        }
        if (!reason || !reason.trim()) {
            return res.status(400).json({ message: "A reason is required" });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.buyer.buyerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }
        if (order.payoutStatus !== 'held') {
            return res.status(400).json({ message: `Cannot dispute this order -- its payout is already ${order.payoutStatus}.` });
        }

        order.payoutStatus = 'disputed';
        order.dispute = { reason: reason.trim(), raisedAt: new Date() };
        await order.save();

        return res.status(200).json({ message: "Dispute raised. Our team will review this before any payout goes out.", order });
    } catch (error) {
        console.error("Error raising order dispute:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Admin resolves a disputed payout -- either releases it (dispute rejected) or
// refunds the patient (dispute upheld). Actual money movement (payout to the
// retailer's bank account, or refund via Razorpay) is a manual step for now;
// this just records the decision and unblocks/settles the state.
exports.resolveOrderDispute = async (req, res) => {
    const { id } = req.params;
    const { resolution } = req.body; // 'released' | 'refunded'

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Admins only" });
        }
        if (!['released', 'refunded'].includes(resolution)) {
            return res.status(400).json({ message: "resolution must be 'released' or 'refunded'" });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.payoutStatus !== 'disputed') {
            return res.status(400).json({ message: "This order has no open dispute." });
        }

        order.payoutStatus = resolution;
        order.dispute.resolvedAt = new Date();
        order.dispute.resolution = resolution;
        order.dispute.resolvedBy = req.user._id;
        await order.save();

        const getRazorpay = require('../services/razorpayService');
        const razorpay = getRazorpay();

        if (resolution === 'released') {
            const transferIds = [...new Set(order.items.map(i => i.razorpayTransferId).filter(Boolean))];
            for (const tId of transferIds) {
                try {
                    await razorpay.transfers.edit(tId, { on_hold: false });
                } catch (e) {
                    console.error("Error releasing Razorpay transfer hold for:", tId, e);
                }
            }
        } else if (resolution === 'refunded' && order.paymentId) {
            try {
                await razorpay.payments.refund(order.paymentId, { amount: Math.round(order.totalPrice * 100) });
            } catch (e) {
                console.error("Error refunding Razorpay payment:", order.paymentId, e);
            }
        }

        return res.status(200).json({ message: `Dispute resolved as ${resolution}.`, order });
    } catch (error) {
        console.error("Error resolving order dispute:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Lists all orders an admin currently needs to act on: open disputes.
exports.getOrderPayoutQueue = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Admins only" });
        }

        const disputed = await Order.find({ payoutStatus: 'disputed' }).sort({ 'dispute.raisedAt': -1 });
        return res.status(200).json({ disputed });
    } catch (error) {
        console.error("Error fetching order payout queue:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getOrders = async (req, res) => {
    try {
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> get all orders by a given retailer id called");
        const { retailerId } = req.query;

        if (!retailerId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        if (retailerId && req.user.role !== 'admin' && req.user._id.toString() !== retailerId) {
            return res.status(403).json({ message: "Access denied" });
        }

        let orders;

        if (retailerId) {
            orders = await Order.find()
                .populate({
                    path: 'items.medicineId',
                    model: 'Medicine',
                    select: 'name retailerId price',
                    populate: {
                        path: 'retailerId',
                        model: 'Retailer',
                        select: 'firstName lastName BusinessName'
                    }
                })
                .sort({ createdAt: -1 });

            // Filter orders to include only those that contain at least one medicine with this retailerId
            orders = orders.filter(order =>
                order.items.some(item =>
                    item.medicineId?.retailerId?._id?.toString() === retailerId
                )
            );
        } else {
            orders = await Order.find()
                .populate({
                    path: 'items.medicineId',
                    model: 'Medicine',
                    select: 'name retailerId price',
                    populate: {
                        path: 'retailerId',
                        model: 'Retailer',
                        select: 'firstName lastName BusinessName'
                    }
                })
                .sort({ createdAt: -1 });
        }

        // 🔥 Add retailer + review in response (without removing anything else)
        const formattedOrders = orders.map(order => {
            const retailer =
                order.items.length > 0 && order.items[0].medicineId?.retailerId
                    ? order.items[0].medicineId.retailerId
                    : null;

            return {
                ...order.toObject(),
                retailer: retailer
                    ? {
                          firstName: retailer.firstName,
                          lastName: retailer.lastName,
                          BusinessName: retailer.BusinessName
                      }
                    : null,
                review: order.review // full review (rating, comment, createdAt, deliveredAt)
            };
        });

        res.status(200).json(formattedOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ✅ Get reviewed orders by buyerId (with retailer BusinessNames)
exports.getReviewedOrdersByBuyerId = async (req, res) => {
    const { buyerId } = req.params;

    if (!buyerId) {
        return res.status(400).json({ error: "Buyer ID is required" });
    }

    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== buyerId) {
            return res.status(403).json({ message: "Access denied. Not your orders." });
        }

        const orders = await Order.find({
            "buyer.buyerId": buyerId,
            "review.comment": { $exists: true, $nin: [null, ""] }
        })
            .sort({ createdAt: -1 })
            .populate({
                path: "items.medicineId",
                populate: {
                    path: "retailerId",
                    select: "BusinessName",
                },
            })
            .populate({ path: "buyer.buyerId", select: "-password -resetPasswordOTP -resetPasswordOTPExpires -isOTPVerified" });

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                message: "No reviewed orders found for this buyer",
            });
        }

        // 🔥 Add retailer BusinessNames just like getOrdersByBuyerId
        const enrichedOrders = orders.map(order => ({
            ...order.toObject(),
            retailers: [
                ...new Set(
                    order.items
                        .map(item => item.medicineId?.retailerId?.BusinessName)
                        .filter(Boolean) // strip null/undefined
                ),
            ],
        }));

        return res.status(200).json({
            message: "Reviewed orders retrieved successfully for buyer",
            orders: enrichedOrders,
        });

    } catch (error) {
        console.error("❌ Error fetching reviewed orders by buyer ID:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

// ✅ Get orders by buyerId (with retailer BusinessNames)
exports.getOrdersByBuyerId = async (req, res) => {
    const { buyerId } = req.params;

    if (!buyerId) {
        return res.status(400).json({ error: "Buyer ID is required" });
    }

    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== buyerId) {
            return res.status(403).json({ message: "Access denied. Not your orders." });
        }

        const orders = await Order.find({
            "buyer.buyerId": buyerId
        })
            .sort({ createdAt: -1 })
            .populate({
                path: "items.medicineId",
                populate: {
                    path: "retailerId",
                    select: "BusinessName",
                },
            })
            .populate({ path: "buyer.buyerId", select: "-password -resetPasswordOTP -resetPasswordOTPExpires -isOTPVerified" });

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                message: "No orders found for this buyer",
            });
        }

        // 🔥 Add retailer BusinessNames just like getOrdersByBuyerId
        const enrichedOrders = orders.map(order => ({
            ...order.toObject(),
            retailers: [
                ...new Set(
                    order.items
                        .map(item => item.medicineId?.retailerId?.BusinessName)
                        .filter(Boolean) // strip null/undefined
                ),
            ],
        }));

        return res.status(200).json({
            message: "Orders retrieved successfully for buyer",
            orders: enrichedOrders,
        });

    } catch (error) {
        console.error("❌ Error fetching orders by buyer ID:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

// get orders by retailerID
exports.getOrdersByRetailerId = async (req, res) => {
    const { retailerId } = req.params;

    if (!retailerId || !mongoose.Types.ObjectId.isValid(retailerId)) {
        return res.status(400).json({ error: "Invalid or missing retailer ID" });
    }

    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== retailerId) {
            return res.status(403).json({ message: "Access denied. Not your orders." });
        }

        // get all medicine ids for this retailer
        const medicines = await Medicine.find({ retailerId }).select('_id').lean();
        const medicineIds = medicines.map(m => m._id);

        if (medicineIds.length === 0) {
            return res.status(200).json({ orders: [] });
        }

        const orders = await Order.find({
            'items.medicineId': { $in: medicineIds },
        })
            .sort({ createdAt: -1 })
            .populate({
                path: 'items.medicineId',
                model: 'Medicine',
                select: 'name price retailerId',
            })
            .populate({
                path: 'buyer.buyerId',
                select: 'firstName lastName email',
            })
            .lean();

        if (!orders || orders.length === 0) {
            return res.status(404).json({
                message: "No orders found for this retailer.",
            });
        }

        const ordersForRetailer = orders.reduce((acc, order) => {
            const retailerItems = (order.items || []).filter(item =>
                item.medicineId &&
                item.medicineId.retailerId &&
                item.medicineId.retailerId.toString() === retailerId
            );

            if (retailerItems.length === 0) return acc;

            const items = retailerItems.map(item => ({
                medicineId: item.medicineId._id,
                medicineName: item.medicineId.name,
                unitPrice: item.medicineId.price,
                quantity: item.quantity,
                subTotal: item.subTotal
            }));

            const retailerTotal = items.reduce((sum, it) => sum + (it.subTotal || 0), 0);

            const customerName = order.buyer?.firstName
                ? `${order.buyer.firstName} ${order.buyer.lastName || ''}`.trim()
                : (order.buyer?.buyerId?.firstName
                    ? `${order.buyer.buyerId.firstName} ${order.buyer.buyerId.lastName || ''}`.trim()
                    : 'Unknown Customer');

            acc.push({
                _id: order._id,
                customerName,
                items,
                retailerTotal,
                orderTotal: order.totalPrice,
                date: new Date(order.createdAt).toISOString(),
                status: order.orderStatus,
                shippingAddress: order.shippingAddress || null,
                // Courier summary so the orders list can show the AWB and the
                // last known scan without a per-order tracking request. Null
                // until the retailer attaches a waybill.
                shipping: order.shipping?.trackingId
                    ? {
                        platform: order.shipping.platform,
                        trackingId: order.shipping.trackingId,
                        shippedAt: order.shipping.shippedAt,
                        lastPolledStatus: order.shipping.lastPolledStatus,
                        lastPolledStatusCode: order.shipping.lastPolledStatusCode,
                        lastPolledLocation: order.shipping.lastPolledLocation,
                        lastPolledAt: order.shipping.lastPolledAt
                    }
                    : null
            });

            return acc;
        }, []);

        if (ordersForRetailer.length === 0) {
            return res.status(404).json({
                message: "No orders found for this retailer.",
            });
        }

        return res.status(200).json({
            message: "Orders retrieved successfully for retailer",
            orders: ordersForRetailer,
        });
    } catch (error) {
        console.error("❌ Error fetching orders by retailer ID:", error);
        return res.status(500).json({ error: "Server error" });
    }
};



// ✅ Get feedback for a specific retailer (by retailerId)
exports.getFeedbackByRetailerId = async (req, res) => {
    const { retailerId } = req.params;

    if (!retailerId || !mongoose.Types.ObjectId.isValid(retailerId)) {
        return res.status(400).json({ error: "Invalid or missing retailer ID" });
    }

    try {
        if (req.user.role !== 'admin' && req.user._id.toString() !== retailerId) {
            return res.status(403).json({ message: "Access denied. Not your feedback." });
        }

        // Find all medicine IDs associated with the given retailer
        const medicines = await Medicine.find({ retailerId }).select('_id');
        const medicineIds = medicines.map(med => med._id);

        if (medicineIds.length === 0) {
            return res.status(200).json({ feedback: [] });
        }

        const ordersWithFeedback = await Order.find({
            'items.medicineId': { $in: medicineIds },
            'review.comment': { $exists: true, $nin: [null, ''] }
        })
            .sort({ 'review.createdAt': -1 })
            .populate({
                path: 'buyer.buyerId',
                select: 'firstName lastName',
            });

        if (!ordersWithFeedback || ordersWithFeedback.length === 0) {
            return res.status(200).json({ feedback: [] });
        }

        const flattenedFeedback = ordersWithFeedback.map(order => ({
            id: order._id,
            customerName: `${order.buyer.firstName} ${order.buyer.lastName}`,
            rating: order.review.rating,
            comment: order.review.comment,
            date: order.review.createdAt,
        }));

        return res.status(200).json({
            message: "Feedback retrieved successfully for retailer",
            feedback: flattenedFeedback,
        });
    } catch (error) {
        console.error("❌ Error fetching feedback by retailer ID:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

// ✅ Get all transactions
exports.getAllTransactions = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        // Fetch all orders from the database
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .populate({
                path: 'buyer.buyerId',
                select: 'firstName lastName',
            })
            .populate({
                path: 'items.medicineId',
                select: 'retailerId',
                populate: {
                    path: 'retailerId',
                    model: 'Retailer',
                    select: 'BusinessName',
                },
            });

        // Fetch all patient-doctor bookings
        const bookings = await Booking.find({})
            .sort({ createdAt: -1 })
            .populate('patientId', 'firstName lastName')
            .populate('doctorId', 'firstName lastName');

        // Process and flatten the orders to match the frontend table structure
        const orderTransactions = orders.map((order) => {
            const fromName = `${order.buyer.firstName} ${order.buyer.lastName} (${order.buyer.type})`;
            const toName = order.items[0]?.medicineId?.retailerId?.BusinessName
                ? `${order.items[0].medicineId.retailerId.BusinessName} (Retailer)`
                : 'Unknown Retailer';

            let transactionType = 'General';
            if (order.buyer.type === 'Patient') {
                transactionType = 'Patient-Retailer';
            } else if (order.buyer.type === 'Doctor') {
                transactionType = 'Doctor-Retailer';
            }

            return {
                id: order._id,
                type: transactionType,
                date: new Date(order.createdAt).toLocaleDateString(),
                amount: order.totalPrice,
                from: fromName,
                to: toName,
            };
        });

        // Process and flatten the bookings to match the frontend table structure
        const bookingTransactions = bookings.map((booking) => {
            const fromName = `${booking.patientId?.firstName} ${booking.patientId?.lastName} (Patient)`;
            const toName = `${booking.doctorId?.firstName} ${booking.doctorId?.lastName} (Doctor)`;

            return {
                id: booking._id,
                type: 'Patient-Doctor',
                date: new Date(booking.createdAt).toLocaleDateString(),
                amount: booking.amountPaid,
                from: fromName,
                to: toName,
            };
        });

        // Combine both sets of transactions
        const allTransactions = [...orderTransactions, ...bookingTransactions];

        // Sort the combined list by date
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (allTransactions.length === 0) {
            return res.status(404).json({
                message: "No transactions found in the database.",
            });
        }

        res.status(200).json({ transactions: allTransactions });

    } catch (error) {
        console.error("❌ Error fetching transactions:", error);
        res.status(500).json({ error: "Server error" });
    }
};
