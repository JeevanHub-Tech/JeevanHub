// utils/payoutHold.js
//
// Fairness/escrow: the retailer's payout for a paid order is held for a window
// after delivery so a "paid but never received it" order can be disputed and
// refunded instead of the retailer being paid regardless.
//
// Lives in its own module because delivery can now be declared from four
// places -- a manual status update, the on-demand tracking fetch, the Delhivery
// webhook, and the polling cron -- and all four must start the hold identically.

const getPayoutHoldGraceMs = () => {
    if (process.env.PAYOUT_HOLD_MINUTES) {
        return Math.max(1, parseInt(process.env.PAYOUT_HOLD_MINUTES, 10)) * 60 * 1000;
    }
    return 7 * 24 * 60 * 60 * 1000;
};

const PAYOUT_HOLD_GRACE_MS = getPayoutHoldGraceMs();

/**
 * Starts the payout hold the first time an order reaches 'delivered'.
 * Only online payments are held -- COD cash goes straight to the retailer at
 * the door, so there is nothing platform-side to hold.
 *
 * Mutates `order` in place; the caller is responsible for saving.
 *
 * @param {Object} order a mongoose Order document
 * @param {string} newOrderStatus the status just applied
 * @returns {boolean} true if the hold was started by this call
 */
const startPayoutHoldIfDelivered = (order, newOrderStatus) => {
    if (
        newOrderStatus === 'delivered' &&
        order.paymentMethod === 'onlinePayment' &&
        order.paymentStatus === 'paid' &&
        !order.deliveredAt
    ) {
        order.deliveredAt = new Date();
        order.payoutStatus = 'held';
        order.payoutHoldUntil = new Date(Date.now() + getPayoutHoldGraceMs());
        return true;
    }
    return false;
};

/**
 * Starts the payout hold on an individual retailer's shipment when marked delivered.
 * Enables fair, independent payouts in multi-retailer orders.
 * In sandbox/testing mode, PAYOUT_HOLD_MINUTES can shorten the lockin to a few minutes.
 */
const startShipmentPayoutHoldIfDelivered = (order, shipment, status) => {
    const isDelivered = status === 'delivered' || status === 'Delivered' || shipment.lastPolledStatusCode === 'DL';
    if (
        isDelivered &&
        order.paymentMethod === 'onlinePayment' &&
        order.paymentStatus === 'paid'
    ) {
        if (!shipment.payout) {
            shipment.payout = {};
        }
        if (!shipment.payout.deliveredAt) {
            shipment.payout.deliveredAt = new Date();
            shipment.payout.status = 'held';
            shipment.payout.holdUntil = new Date(Date.now() + getPayoutHoldGraceMs());

            // 2% platform commission rate (configurable via PLATFORM_COMMISSION_PERCENT)
            const commissionRate = process.env.PLATFORM_COMMISSION_PERCENT
                ? (parseFloat(process.env.PLATFORM_COMMISSION_PERCENT) / 100)
                : 0.02;

            const retailerId = shipment.retailerId ? String(shipment.retailerId) : null;
            const retailerItems = (order.items || []).filter(item => {
                const rId = item.medicineId?.retailerId?._id || item.medicineId?.retailerId || item.retailerId;
                return rId && String(rId) === retailerId;
            });
            const itemsSubtotal = retailerItems.reduce((acc, i) => acc + (i.subTotal || 0), 0);
            const commissionAmount = Math.round(itemsSubtotal * commissionRate * 100) / 100;
            const itemsAfterCommission = Math.max(0, itemsSubtotal - commissionAmount);

            // In multi-retailer orders, allocate shipping or take shipment.shippingCharge
            const totalRetailers = new Set((order.items || []).map(i => {
                const rId = i.medicineId?.retailerId?._id || i.medicineId?.retailerId || i.retailerId;
                return rId ? String(rId) : null;
            }).filter(Boolean)).size || 1;

            const shippingAmount = shipment.shippingCharge !== undefined && shipment.shippingCharge !== null && shipment.shippingCharge > 0
                ? shipment.shippingCharge
                : (order.shippingCharge ? Math.round((order.shippingCharge / totalRetailers) * 100) / 100 : 0);

            const netPayout = Math.round((itemsAfterCommission + shippingAmount) * 100) / 100;

            shipment.payout.itemsSubtotal = itemsSubtotal;
            shipment.payout.commissionAmount = commissionAmount;
            shipment.payout.shippingAmount = shippingAmount;
            shipment.payout.amount = netPayout;

            return true;
        }
    }
    return false;
};

module.exports = { PAYOUT_HOLD_GRACE_MS, getPayoutHoldGraceMs, startPayoutHoldIfDelivered, startShipmentPayoutHoldIfDelivered };
