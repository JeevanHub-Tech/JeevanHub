const axios = require('axios');
const crypto = require('crypto');

/**
 * Cashfree Unified Service
 * Supports Payment Gateway (PG) for patient checkouts and Payouts for provider settlements.
 */

const getPgConfig = () => {
    const appId = process.env.CASHFREE_APP_ID || process.env.CASHFREE_PG_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_PG_SECRET_KEY;
    const env = (process.env.CASHFREE_ENV || process.env.CASHFREE_PG_ENV || 'PROD').toUpperCase();
    const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';

    const baseUrl = env === 'PROD' || env === 'PRODUCTION'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg';

    return { appId, secretKey, env, apiVersion, baseUrl };
};

const getPayoutConfig = () => {
    const clientId = process.env.CASHFREE_PAYOUT_CLIENT_ID || process.env.CASHFREE_APP_ID;
    const clientSecret = process.env.CASHFREE_PAYOUT_CLIENT_SECRET || process.env.CASHFREE_SECRET_KEY;
    const env = (process.env.CASHFREE_PAYOUT_ENV || 'TEST').toUpperCase();
    const apiVersion = process.env.CASHFREE_PAYOUT_API_VERSION || '2024-01-01';

    const baseUrl = env === 'PROD' || env === 'PRODUCTION'
        ? 'https://api.cashfree.com/payout'
        : 'https://sandbox.cashfree.com/payout';

    return { clientId, clientSecret, env, apiVersion, baseUrl };
};

/**
 * Create a Cashfree Payment Gateway Order
 * @param {Object} params
 * @param {string} params.orderId Unique Order / Reference ID
 * @param {number} params.orderAmount Amount in INR
 * @param {string} [params.orderCurrency='INR']
 * @param {Object} params.customer { customerId, name, email, phone }
 * @param {string} [params.returnUrl] Browser redirect return URL
 * @param {Object} [params.orderMeta] Extra metadata
 */
exports.createPgOrder = async ({ orderId, orderAmount, orderCurrency = 'INR', customer, returnUrl, orderMeta = {} }) => {
    const config = getPgConfig();
    if (!config.appId || !config.secretKey) {
        throw new Error('Cashfree Payment Gateway credentials are not configured');
    }

    const cleanPhone = (customer?.phone ? String(customer.phone).replace(/[^0-9]/g, '') : '').slice(-10);
    const validPhone = cleanPhone.length === 10 ? cleanPhone : '9999999999';

    const payload = {
        order_id: String(orderId),
        order_amount: Math.round(Number(orderAmount) * 100) / 100,
        order_currency: orderCurrency,
        customer_details: {
            customer_id: String(customer?.customerId || customer?._id || 'cust_' + Date.now()),
            customer_name: customer?.name || 'JeevanHub Customer',
            customer_email: customer?.email || 'patient@jeevanhub.com',
            customer_phone: validPhone
        },
        order_meta: {
            return_url: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success?order_id={order_id}`,
            ...orderMeta
        }
    };

    try {
        const response = await axios.post(`${config.baseUrl}/orders`, payload, {
            headers: {
                'x-client-id': config.appId,
                'x-client-secret': config.secretKey,
                'x-api-version': config.apiVersion,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (err) {
        console.error('Cashfree createPgOrder error:', err.response?.data || err.message);
        const errMsg = err.response?.data?.message || err.message || 'Failed to create payment order with Cashfree';
        throw new Error(errMsg);
    }
};

/**
 * Fetch Order details from Cashfree PG
 * @param {string} orderId
 */
exports.getOrderStatus = async (orderId) => {
    const config = getPgConfig();
    try {
        const response = await axios.get(`${config.baseUrl}/orders/${orderId}`, {
            headers: {
                'x-client-id': config.appId,
                'x-client-secret': config.secretKey,
                'x-api-version': config.apiVersion
            }
        });
        return response.data;
    } catch (err) {
        console.error('Cashfree getOrderStatus error:', err.response?.data || err.message);
        throw new Error(err.response?.data?.message || err.message || 'Failed to fetch order status');
    }
};

/**
 * Verify Cashfree Webhook Signature (HMAC-SHA256)
 * @param {string|Buffer} rawBody
 * @param {string} signature x-webhook-signature header
 * @param {string} timestamp x-webhook-timestamp header
 * @returns {boolean}
 */
exports.verifyWebhookSignature = (rawBody, signature, timestamp) => {
    const config = getPgConfig();
    if (!config.secretKey || !signature || !timestamp) return false;

    try {
        const signedPayload = timestamp + (typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8'));
        const expectedSignature = crypto
            .createHmac('sha256', config.secretKey)
            .update(signedPayload)
            .digest('base64');

        return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    } catch (err) {
        console.error('Cashfree webhook signature verification error:', err);
        return false;
    }
};

/**
 * Export config getter for diagnostic health checks
 */
exports.getPgConfig = getPgConfig;
exports.getPayoutConfig = getPayoutConfig;
