// services/shipmentSync.js
//
// Turns a Delhivery tracking result into order state. Delivery can be reported
// from three different directions -- the patient/retailer opening the tracking
// dialog, a Delhivery webhook push, and the polling cron -- and all three must
// agree on what "delivered" does to the order, so the rule lives here once.

const { startPayoutHoldIfDelivered } = require('../utils/payoutHold');

/**
 * Recomputes the order-wide status from its item statuses.
 *
 * Mirrors the precedence in orderController.updateOrderStatus: 'accepted' and
 * 'rejected' are the retailer's initial response to a pending order and must be
 * checked before the generic "something moved past pending -> processing"
 * fallback, otherwise Accept/Reject both collapse into 'processing' and the
 * order vanishes from the retailer's Accepted/Rejected tabs.
 */
function recomputeOrderStatus(order) {
    const statuses = order.items.map((item) => item.itemStatus);
    if (statuses.length === 0) return order.orderStatus;

    if (statuses.every((s) => s === 'delivered')) return 'delivered';
    if (statuses.every((s) => s === 'cancelled')) return 'cancelled';
    if (statuses.every((s) => s === 'shipped' || s === 'delivered')) return 'shipped';
    if (statuses.every((s) => s === 'rejected')) return 'rejected';
    if (statuses.every((s) => s === 'accepted' || s === 'rejected')) return 'accepted';
    if (statuses.some((s) => s === 'processing' || s === 'shipped' || s === 'delivered')) return 'processing';
    if (statuses.some((s) => s !== 'pending')) return 'accepted';
    return 'pending';
}

/**
 * The indices of the items covered by this shipment.
 *
 * An order can span retailers, so a single AWB only speaks for the items sold
 * by `order.shipping.retailerId`. Requires `items.medicineId` to be populated.
 * Falls back to every item when attribution isn't possible (medicine deleted)
 * *and* the shipment is the only one on the order, so a legacy single-retailer
 * order still gets marked delivered rather than being stuck in 'shipped'.
 */
function itemsCoveredByShipment(order, shipment) {
    const shipmentRetailerId = shipment?.retailerId ? String(shipment.retailerId) : null;
    if (!shipmentRetailerId) return order.items;

    const owned = order.items.filter((item) => {
        const retailerId = item.medicineId?.retailerId;
        if (!retailerId) return false;
        // medicineId.retailerId may itself be populated to a Retailer doc.
        const id = retailerId._id ? retailerId._id : retailerId;
        return String(id) === shipmentRetailerId;
    });

    if (owned.length > 0) return owned;

    const attributable = order.items.some((item) => item.medicineId?.retailerId);
    return attributable ? [] : order.items;
}

/**
 * Applies a normalized tracking result to an order document.
 *
 * Mutates `order` in place and does NOT save -- the caller decides when to
 * persist (and whether to skip saving when nothing changed).
 *
 * @param {Object} order mongoose Order doc with items.medicineId populated
 * @param {Object} tracking { currentStatus, currentStatusCode, currentLocation,
 *                            mappedOrderStatus, timeline?, event? }
 * @returns {{statusChanged: boolean, becameDelivered: boolean, becameCancelled: boolean, payoutHeld: boolean, previousStatus: string}}
 */
function applyTrackingToOrder(order, shipment, tracking) {
    const previousStatus = order.orderStatus;

    shipment.lastPolledStatus = tracking.currentStatus || shipment.lastPolledStatus;
    shipment.lastPolledStatusCode = tracking.currentStatusCode || shipment.lastPolledStatusCode;
    if (tracking.currentLocation) shipment.lastPolledLocation = tracking.currentLocation;
    shipment.lastPolledAt = new Date();
    shipment.lastPollError = null;

    if (Array.isArray(tracking.timeline)) {
        // A full poll returns the entire scan history -- treat it as the truth.
        shipment.trackingTimeline = tracking.timeline;
    } else if (tracking.event) {
        // A webhook delivers one scan at a time. Delhivery can retry a push, so
        // skip an event we already recorded (same code at the same instant).
        const existing = shipment.trackingTimeline || [];
        const eventTime = tracking.event.timestamp ? new Date(tracking.event.timestamp).getTime() : null;
        const isDuplicate = existing.some((e) => {
            const sameCode = (e.statusCode || null) === (tracking.event.statusCode || null);
            const sameTime = eventTime !== null && e.timestamp && new Date(e.timestamp).getTime() === eventTime;
            return sameCode && sameTime;
        });
        if (!isDuplicate) {
            shipment.trackingTimeline = [tracking.event, ...existing];
        }
    }

    let becameDelivered = false;
    let becameCancelled = false;
    let payoutHeld = false;

    const covered = itemsCoveredByShipment(order, shipment);

    if (tracking.mappedOrderStatus === 'delivered') {
        covered.forEach((item) => { item.itemStatus = 'delivered'; });
        order.orderStatus = recomputeOrderStatus(order);
        becameDelivered = previousStatus !== 'delivered' && order.orderStatus === 'delivered';
        payoutHeld = startPayoutHoldIfDelivered(order, order.orderStatus);
    } else if (tracking.mappedOrderStatus === 'cancelled') {
        // RTO -- the parcel is going back to the seller, so the patient isn't
        // getting it. Never walk back an order that already delivered.
        if (previousStatus !== 'delivered') {
            covered.forEach((item) => { item.itemStatus = 'cancelled'; });
            order.orderStatus = recomputeOrderStatus(order);
            becameCancelled = previousStatus !== 'cancelled' && order.orderStatus === 'cancelled';
        }
    } else if (previousStatus !== 'delivered' && previousStatus !== 'cancelled') {
        // Still in transit: make sure the order at least reads as shipped, since
        // the carrier has the parcel.
        covered.forEach((item) => {
            if (item.itemStatus === 'accepted' || item.itemStatus === 'processing' || item.itemStatus === 'pending') {
                item.itemStatus = 'shipped';
            }
        });
        order.orderStatus = recomputeOrderStatus(order);
    }

    return {
        statusChanged: order.orderStatus !== previousStatus,
        becameDelivered,
        becameCancelled,
        payoutHeld,
        previousStatus
    };
}

module.exports = { applyTrackingToOrder, recomputeOrderStatus, itemsCoveredByShipment };
