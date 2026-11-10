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

/**
 * Register or sync a beneficiary with Cashfree Payouts
 * @param {Object} params
 * @param {string} params.entityType 'retailer' | 'doctor'
 * @param {string} params.entityId Mongo ObjectId
 * @param {string} params.name Beneficiary full name
 * @param {string} params.email Contact email
 * @param {string} params.phone Contact 10-digit phone
 * @param {string} [params.bankAccount] Bank account number
 * @param {string} [params.ifsc] Bank IFSC code
 * @param {string} [params.upiId] UPI VPA
 * @returns {Promise<{ beneficiaryId: string, status: string, simulated?: boolean }>}
 */
exports.syncBeneficiary = async ({ entityType = 'provider', entityId, name, email, phone, bankAccount, ifsc, upiId }) => {
    const config = getPayoutConfig();
    const isSimulate = process.env.CASHFREE_PAYOUT_SIMULATE === 'true' || !config.clientId || !config.clientSecret;

    // Deterministic beneficiary ID based on instrument details so changing accounts generates a fresh beneficiary
    const instrumentKey = upiId ? `upi_${upiId.trim().toLowerCase()}` : `bank_${String(bankAccount).trim()}_${String(ifsc).trim().toUpperCase()}`;
    const hash = crypto.createHash('md5').update(instrumentKey).digest('hex').slice(0, 8);
    const safeType = String(entityType).slice(0, 3).toLowerCase();
    const safeId = String(entityId || 'gen').slice(-8);
    const beneficiaryId = `jh_${safeType}_${safeId}_${hash}`;

    if (isSimulate) {
        console.log(`[Cashfree Payout Simulated] Beneficiary synced: ${beneficiaryId} for ${name}`);
        return { beneficiaryId, status: 'VERIFIED', simulated: true };
    }

    const cleanPhone = (phone ? String(phone).replace(/[^0-9]/g, '') : '').slice(-10);
    const validPhone = cleanPhone.length === 10 ? cleanPhone : '9999999999';
    const cleanEmail = email || 'provider@jeevanhub.com';
    const cleanName = (name || 'JeevanHub Provider').replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'Provider';

    const payload = {
        beneficiary_id: beneficiaryId,
        beneficiary_name: cleanName,
        beneficiary_contact_details: {
            beneficiary_email: cleanEmail,
            beneficiary_phone: validPhone
        }
    };

    if (upiId) {
        payload.beneficiary_instrument_details = {
            vpa: upiId.trim()
        };
    } else {
        payload.beneficiary_instrument_details = {
            bank_account_number: String(bankAccount).trim(),
            bank_ifsc: String(ifsc).trim().toUpperCase()
        };
    }

    try {
        const response = await axios.post(`${config.baseUrl}/beneficiary`, payload, {
            headers: {
                'x-client-id': config.clientId,
                'x-client-secret': config.clientSecret,
                'x-api-version': config.apiVersion,
                'Content-Type': 'application/json'
            }
        });
        return {
            beneficiaryId,
            status: response.data?.beneficiary_status || 'VERIFIED',
            simulated: false
        };
    } catch (err) {
        // If 409 conflict, beneficiary already exists with this ID - valid to proceed
        if (err.response?.status === 409 || err.response?.data?.code === 'conflict_with_existing_beneficiary') {
            return {
                beneficiaryId,
                status: 'VERIFIED',
                simulated: false,
                existing: true
            };
        }
        console.error('Cashfree syncBeneficiary error:', err.response?.data || err.message);
        throw new Error(err.response?.data?.message || err.message || 'Failed to sync beneficiary with Cashfree');
    }
};

/**
 * Initiate a transfer via Cashfree Payouts
 * @param {Object} params
 * @param {string} params.transferId Unique reference
 * @param {string} params.beneficiaryId
 * @param {number} params.amount Amount in INR
 * @param {string} [params.mode='banktransfer'] 'banktransfer' | 'upi'
 * @param {string} [params.remarks]
 * @returns {Promise<{ success: boolean, transferId: string, cfTransferId: string, status: string, mode: string, transferredAt: Date }>}
 */
exports.initiateTransfer = async ({ transferId, beneficiaryId, amount, mode = 'banktransfer', remarks }) => {
    const config = getPayoutConfig();
    const isSimulate = process.env.CASHFREE_PAYOUT_SIMULATE === 'true' || !config.clientId || !config.clientSecret;

    const cleanTransferId = String(transferId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    const transferAmount = Math.round(Number(amount) * 100) / 100;

    if (transferAmount <= 0) {
        throw new Error('Transfer amount must be greater than zero');
    }

    const transferMode = mode === 'upi' ? 'upi' : 'banktransfer';

    if (isSimulate) {
        const simId = `cf_sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        console.log(`[Cashfree Payout Simulated] Disbursed ₹${transferAmount.toFixed(2)} to ${beneficiaryId} via ${transferMode} (Ref: ${simId})`);
        return {
            success: true,
            simulated: true,
            transferId: cleanTransferId,
            cfTransferId: simId,
            status: 'RECEIVED',
            mode: transferMode,
            transferredAt: new Date()
        };
    }

    const cleanRemarks = String(remarks || 'JeevanHub Payout').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 50);

    const payload = {
        transfer_id: cleanTransferId,
        transfer_amount: transferAmount,
        transfer_currency: 'INR',
        transfer_mode: transferMode,
        beneficiary_details: {
            beneficiary_id: beneficiaryId
        },
        transfer_remarks: cleanRemarks || 'JeevanHub Payout'
    };

    try {
        const response = await axios.post(`${config.baseUrl}/transfers`, payload, {
            headers: {
                'x-client-id': config.clientId,
                'x-client-secret': config.clientSecret,
                'x-api-version': config.apiVersion,
                'Content-Type': 'application/json'
            }
        });

        return {
            success: true,
            simulated: false,
            transferId: response.data.transfer_id || cleanTransferId,
            cfTransferId: String(response.data.cf_transfer_id || ''),
            status: response.data.status || 'RECEIVED',
            statusCode: response.data.status_code,
            mode: transferMode,
            transferredAt: new Date()
        };
    } catch (err) {
        console.error('Cashfree initiateTransfer error:', err.response?.data || err.message);
        const errMsg = err.response?.data?.message || err.message || 'Failed to initiate payout transfer';
        throw new Error(errMsg);
    }
};

/**
 * Fetch Transfer Status from Cashfree Payouts
 * @param {string} transferId
 */
exports.getTransferStatus = async (transferId) => {
    const config = getPayoutConfig();
    try {
        const response = await axios.get(`${config.baseUrl}/transfers?transfer_id=${encodeURIComponent(transferId)}`, {
            headers: {
                'x-client-id': config.clientId,
                'x-client-secret': config.clientSecret,
                'x-api-version': config.apiVersion
            }
        });
        return response.data;
    } catch (err) {
        console.error('Cashfree getTransferStatus error:', err.response?.data || err.message);
        throw new Error(err.response?.data?.message || err.message || 'Failed to fetch transfer status');
    }
};

/**
 * High-level helper: Syncs beneficiary and executes payout transfer for a provider (Retailer or Doctor)
 * @param {Object} params
 * @param {string} params.entityType 'retailer' | 'doctor'
 * @param {Object} params.entity Retailer or Doctor document
 * @param {Object} params.payoutMethod { type: 'upi'|'bank_account', accountHolderName, accountNumber, ifscCode, upiId }
 * @param {number} params.amount Payout amount in INR
 * @param {string} params.referenceId Short identifier (orderId or bookingId)
 * @param {string} [params.remarks]
 * @returns {Promise<Object>}
 */
exports.processEntityPayout = async ({ entityType, entity, payoutMethod, amount, referenceId, remarks }) => {
    if (!entity) throw new Error('Entity is required for payout');
    if (!payoutMethod) throw new Error('Payout method is required');
    if (!amount || amount <= 0) throw new Error('Valid payout amount is required');

    const isUpi = payoutMethod.type === 'upi' || Boolean(payoutMethod.upiId && !payoutMethod.accountNumber);
    const name = payoutMethod.accountHolderName || `${entity.firstName || ''} ${entity.lastName || ''}`.trim() || entity.BusinessName || 'Provider';
    const email = entity.email || 'provider@jeevanhub.com';
    const phone = entity.phone || '9999999999';

    // 1. Sync Beneficiary
    const beneRes = await exports.syncBeneficiary({
        entityType,
        entityId: entity._id,
        name,
        email,
        phone,
        bankAccount: payoutMethod.accountNumber,
        ifsc: payoutMethod.ifscCode,
        upiId: isUpi ? payoutMethod.upiId : null
    });

    // 2. Initiate Transfer
    const transferId = `tr_${referenceId || Date.now().toString(36)}_${Date.now().toString().slice(-4)}`;
    const transferRes = await exports.initiateTransfer({
        transferId,
        beneficiaryId: beneRes.beneficiaryId,
        amount,
        mode: isUpi ? 'upi' : 'banktransfer',
        remarks: remarks || `JH ${entityType} payout`
    });

    return {
        ...transferRes,
        beneficiaryId: beneRes.beneficiaryId,
        payoutMethodType: isUpi ? 'upi' : 'bank_account'
    };
};
