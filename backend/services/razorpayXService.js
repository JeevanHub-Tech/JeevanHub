// backend/services/razorpayXService.js
const axios = require('axios');

/**
 * Service to process vendor payouts via RazorpayX (IMPS / NEFT / UPI)
 * Supports live payouts when RAZORPAYX_ACCOUNT_NUMBER is set,
 * or realistic simulation for testing and sandbox environments.
 */

const getAuthHeader = () => {
    const keyId = process.env.RAZORPAYX_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAYX_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return null;
    return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
};

/**
 * Process a payout to a retailer's primary payout method
 * @param {Object} params
 * @param {Object} params.retailer Retailer document
 * @param {Object} params.payoutMethod The specific payout method (bank_account or upi)
 * @param {Number} params.amountInRupees Payout amount in INR
 * @param {String} params.orderId Order Mongo ID or reference
 * @returns {Promise<{ success: boolean, payoutId: string, mode: string, simulated: boolean }>}
 */
exports.processPayout = async ({ retailer, payoutMethod, amountInRupees, orderId }) => {
    const isSandbox = process.env.RAZORPAYX_SIMULATE === 'true' || !process.env.RAZORPAYX_ACCOUNT_NUMBER;
    const authHeader = getAuthHeader();
    const sourceAccountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;

    // Simulation / Sandbox Mode
    if (isSandbox || !authHeader || !sourceAccountNumber) {
        const mode = payoutMethod.type === 'upi' ? 'UPI' : 'IMPS';
        const simId = `pout_sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        console.log(`[RazorpayX Payout Simulated] Disbursed ₹${amountInRupees.toFixed(2)} to ${retailer.firstName} ${retailer.lastName} via ${mode} (${payoutMethod.type === 'upi' ? payoutMethod.upiId : payoutMethod.accountNumber?.slice(-4)}) for Order ${orderId}`);
        
        return {
            success: true,
            simulated: true,
            payoutId: simId,
            mode,
            transferredAt: new Date(),
            notes: `Simulated ${mode} payout to ${retailer.email}`
        };
    }

    // Live RazorpayX Mode
    try {
        const amountInPaise = Math.round(amountInRupees * 100);

        // 1. Create or retrieve Contact
        const contactPayload = {
            name: `${retailer.firstName} ${retailer.lastName}`.trim() || retailer.BusinessName || 'Pharmacy Vendor',
            email: retailer.email,
            contact: retailer.phone || '9999999999',
            type: 'vendor',
            reference_id: retailer._id.toString(),
            notes: { businessName: retailer.BusinessName || '' }
        };

        const contactRes = await axios.post('https://api.razorpay.com/v1/contacts', contactPayload, {
            headers: { Authorization: authHeader, 'Content-Type': 'application/json' }
        });
        const contactId = contactRes.data.id;

        // 2. Create Fund Account
        let fundAccountPayload;
        let payoutMode = 'IMPS';

        if (payoutMethod.type === 'upi') {
            payoutMode = 'UPI';
            fundAccountPayload = {
                contact_id: contactId,
                account_type: 'vpa',
                vpa: { address: payoutMethod.upiId }
            };
        } else {
            payoutMode = 'IMPS';
            fundAccountPayload = {
                contact_id: contactId,
                account_type: 'bank_account',
                bank_account: {
                    name: payoutMethod.accountHolderName,
                    ifsc: payoutMethod.ifscCode,
                    account_number: payoutMethod.accountNumber
                }
            };
        }

        const fundAccountRes = await axios.post('https://api.razorpay.com/v1/fund_accounts', fundAccountPayload, {
            headers: { Authorization: authHeader, 'Content-Type': 'application/json' }
        });
        const fundAccountId = fundAccountRes.data.id;

        // 3. Initiate Payout
        const payoutPayload = {
            account_number: sourceAccountNumber,
            fund_account_id: fundAccountId,
            amount: amountInPaise,
            currency: 'INR',
            mode: payoutMode,
            purpose: 'vendor_payment',
            queue_if_low_balance: true,
            reference_id: `jh_${orderId.toString().slice(-8)}_${Date.now().toString().slice(-4)}`,
            narration: `JH Payout ${orderId.toString().slice(-6)}`
        };

        const payoutRes = await axios.post('https://api.razorpay.com/v1/payouts', payoutPayload, {
            headers: { Authorization: authHeader, 'Content-Type': 'application/json' }
        });

        return {
            success: true,
            simulated: false,
            payoutId: payoutRes.data.id,
            mode: payoutMode,
            status: payoutRes.data.status,
            transferredAt: new Date()
        };
    } catch (apiError) {
        console.error('RazorpayX Payout API error:', apiError.response?.data || apiError.message);
        throw new Error(apiError.response?.data?.error?.description || apiError.message);
    }
};
