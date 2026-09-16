// utils/payoutHold.js
//
// Fairness/escrow: the retailer's payout for a paid order is held for a window
// after delivery so a "paid but never received it" order can be disputed and
// refunded instead of the retailer being paid regardless.
//
// Lives in its own module because delivery can now be declared from four
// places -- a manual status update, the on-demand tracking fetch, the Delhivery
// webhook, and the polling cron -- and all four must start the hold identically.

const PAYOUT_HOLD_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

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
        order.payoutHoldUntil = new Date(Date.now() + PAYOUT_HOLD_GRACE_MS);
        return true;
    }
    return false;
};

module.exports = { PAYOUT_HOLD_GRACE_MS, startPayoutHoldIfDelivered };
