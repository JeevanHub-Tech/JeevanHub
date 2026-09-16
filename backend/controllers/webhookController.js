// controllers/webhookController.js
//
// Inbound push notifications from couriers. Delhivery POSTs here on every scan
// event for retailers who set up the webhook method, which is the only method
// that gives us real-time delivery detection without polling.
//
// There is no `auth` middleware on this route -- the caller is Delhivery's
// server, not a logged-in user -- so authenticity rests entirely on the shared
// secret the retailer pasted into their Delhivery dashboard.

const crypto = require('crypto');
const Order = require('../models/Order');
const delhiveryService = require('../services/delhiveryService');
const { applyTrackingToOrder } = require('../services/shipmentSync');
const { createNotification } = require('./notificationController');

// Constant-time comparison so a wrong secret can't be recovered by timing the
// response. Length is compared first because timingSafeEqual throws on a
// mismatch (that length leak is unavoidable and harmless).
const secretMatches = (received, expected) => {
    if (typeof received !== 'string' || typeof expected !== 'string') return false;
    const a = Buffer.from(received);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};

/**
 * POST /api/webhooks/delhivery
 *
 * Status-code choices matter here, because they drive Delhivery's retries:
 *   200 -- processed, or unprocessable in a way a retry can't fix (unknown AWB)
 *   401 -- bad/missing secret; never silently accepted, since a forged
 *          "Delivered" would mark the order delivered and start the payout hold
 *   500 -- transient failure on our side; we want Delhivery to try again
 */
exports.handleDelhiveryWebhook = async (req, res) => {
    const { retailerId: paramRetailerId } = req.params;

    let parsed = null;
    let isPing = false;

    try {
        parsed = delhiveryService.parseWebhookPayload(req.body);
    } catch (error) {
        // If it can't parse but we have a retailerId, it might be a ping from Delhivery dashboard.
        if (paramRetailerId) {
            isPing = true;
        } else {
            console.warn('Delhivery webhook: unparseable payload:', error.message);
            return res.status(200).json({ message: 'Ignored: unrecognised payload' });
        }
    }

    if (!isPing && !parsed?.awb) {
        return res.status(200).json({ message: 'Ignored: no AWB in payload' });
    }

    try {
        let order = null;
        let retailer = null;

        if (paramRetailerId) {
            const Retailer = require('../models/Retailer');
            retailer = await Retailer.findById(paramRetailerId);
        }

        let shipment = null;
        if (!isPing && parsed?.awb) {
            order = await Order.findOne({ 'shipments.trackingId': parsed.awb }).populate('items.medicineId');
            if (order) {
                shipment = order.shipments.find(s => s.trackingId === parsed.awb);
                if (!retailer) {
                    retailer = await delhiveryService.findRetailerWithCredentials(shipment?.retailerId);
                }
            }
        }

        if (!isPing && !order) {
            console.warn(`Delhivery webhook: no order for AWB ${parsed?.awb}`);
            return res.status(200).json({ message: 'Ignored: no matching order' });
        }

        if (!retailer) {
            return res.status(200).json({ message: 'Ignored: no matching retailer' });
        }

        const expectedSecret = retailer?.shippingIntegrations?.delhivery?.webhookSecret
            || process.env.DELHIVERY_WEBHOOK_SECRET
            || null;

        if (!expectedSecret) {
            console.error(`Delhivery webhook: no secret configured -- rejecting.`);
            return res.status(401).json({ message: 'Webhook secret not configured for this shipment' });
        }
        if (!secretMatches(req.header('X-Secret') || '', expectedSecret)) {
            console.warn(`Delhivery webhook: bad X-Secret`);
            return res.status(401).json({ message: 'Invalid X-Secret header' });
        }

        // Mark that a webhook was received
        if (retailer.shippingIntegrations?.delhivery) {
            retailer.shippingIntegrations.delhivery.lastWebhookReceivedAt = new Date();
            
            // If they are verifying their webhook connection for the first time, lock it in as the active method
            if (retailer.shippingIntegrations.delhivery.method !== 'webhook' || !retailer.shippingIntegrations.delhivery.isConfigured) {
                retailer.shippingIntegrations.delhivery.method = 'webhook';
                retailer.shippingIntegrations.delhivery.isConfigured = true;
                retailer.shippingIntegrations.delhivery.configuredAt = new Date();
            }
            await retailer.save();
        }

        if (isPing) {
            return res.status(200).json({ message: 'Ping processed successfully' });
        }

        const result = applyTrackingToOrder(order, shipment, {
            currentStatus: parsed.currentStatus,
            currentStatusCode: parsed.currentStatusCode,
            currentLocation: parsed.currentLocation,
            mappedOrderStatus: parsed.mappedOrderStatus,
            // One scan at a time, so hand it over as an event to prepend rather
            // than a full timeline replacement.
            event: {
                status: parsed.currentStatus,
                statusCode: parsed.currentStatusCode,
                location: parsed.currentLocation,
                timestamp: parsed.timestamp,
                remarks: parsed.remarks
            }
        });

        await order.save();

        if (result.becameDelivered || result.becameCancelled) {
            const message = result.becameDelivered
                ? `Your order #${order._id.toString().slice(-6)} has been delivered.`
                : `Your order #${order._id.toString().slice(-6)} is being returned to the seller by the courier.`;
            try {
                await createNotification(
                    order.buyer.buyerId,
                    order.buyer.type.toLowerCase(),
                    order._id,
                    message,
                    'order'
                );
            } catch (notifyError) {
                // The order state is already saved; a failed notification must
                // not cause Delhivery to re-send and re-apply the event.
                console.error('Webhook notification failed:', notifyError.message);
            }
        }

        return res.status(200).json({
            message: 'Processed',
            awb: parsed.awb,
            orderStatus: order.orderStatus
        });
    } catch (error) {
        console.error('Delhivery webhook error:', error);
        return res.status(500).json({ message: 'Temporary failure, please retry' });
    }
};
