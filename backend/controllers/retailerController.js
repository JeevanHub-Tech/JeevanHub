const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Retailer = require("../models/Retailer");
const Order = require("../models/Order");
const Medicine = require("../models/Medicine");
const crypto = require("crypto");
const { encrypt } = require("../utils/encryption");
const delhiveryService = require("../services/delhiveryService");

exports.getAllRetailers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }
        const retailers = await Retailer.find().select('-password');

        if (!retailers || retailers.length === 0) {
            return res.status(404).json({
                message: "No retailers found in the database",
            });
        }

        res.status(200).json(retailers);
    } catch (error) {
        console.error("Error fetching retailers:", error);
        res.status(500).json({
            message: "Failed to fetch retailers",
            error: error.message,
        });
    }
};

exports.getSingleRetailer = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: "Not authorized to view this retailer's details" });
        }

        const retailer = await Retailer.findById(id).select('-password');

        if (!retailer) {
            return res.status(404).json({
                message: "Retailer not found with the given ID",
            });
        }

        res.status(200).json(retailer);
    } catch (error) {
        console.error("Error fetching single retailer:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid Retailer ID format" });
        }
        res.status(500).json({
            message: "Failed to fetch retailer",
            error: error.message,
        });
    }
};

exports.updateRetailer = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: "Not authorized to update this retailer's details" });
        }

        const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'profileImage'];
        const updates = {};

        Object.keys(req.body).forEach((key) => {
            if (allowedFields.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const retailer = await Retailer.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
        
        if (!retailer) {
            return res.status(404).json({ message: "Retailer not found" });
        }

        res.status(200).json({ message: "Retailer updated successfully", data: retailer });
    } catch (error) {
        console.error("Error updating retailer:", error);
        res.status(500).json({ message: "Failed to update retailer", error: error.message });
    }
};

// ===========================================================================
// Shipping integrations (Delhivery)
// ===========================================================================

// Every path we may need to clear when the retailer switches methods, so a
// leftover API token can't be used after they move to webhook-only.
const DELHIVERY_CREDENTIAL_PATHS = [
    'apiToken',
    'oauth2ClientId',
    'oauth2ClientSecret',
    'oauth2AuthUrl',
    'oauth2Realm',
    'webhookSecret'
];

const buildClearedCredentials = (keep = []) => {
    const cleared = {};
    DELHIVERY_CREDENTIAL_PATHS.forEach((field) => {
        if (!keep.includes(field)) {
            cleared[`shippingIntegrations.delhivery.${field}`] = null;
        }
    });
    return cleared;
};

// The URL the retailer registers in their Delhivery dashboard. Must be publicly
// reachable, so in local development this needs a tunnel (ngrok) -- the UI says
// as much when the configured BASE_URL is localhost.
const getWebhookUrl = (retailerId) => {
    const base = process.env.BASE_URL || process.env.AYURVEDA_BACKEND_URL || `http://localhost:${process.env.PORT || 8080}`;
    return `${base.replace(/\/+$/, '')}/api/webhooks/delhivery${retailerId ? `/${retailerId}` : ''}`;
};

/**
 * PUT /api/retailers/:id/shipping-integration
 *
 * Saves the retailer's Delhivery credentials. Accepts whichever of the three
 * methods they have access to; switching methods wipes the previous one's
 * credentials so only one is ever live.
 */
exports.saveDelhiveryIntegration = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: "Not authorized to change this retailer's integrations" });
        }

        const { method, apiToken, mcpConfig } = req.body || {};

        if (!['apiToken', 'oauth2', 'webhook'].includes(method)) {
            return res.status(400).json({ message: "method must be one of 'apiToken', 'oauth2' or 'webhook'" });
        }

        const update = {};

        if (method === 'apiToken' || method === 'oauth2') {
            update['shippingIntegrations.delhivery.method'] = method;
            update['shippingIntegrations.delhivery.isConfigured'] = true;
            update['shippingIntegrations.delhivery.configuredAt'] = new Date();
        }

        let generatedWebhookSecret = null;

        if (method === 'apiToken') {
            const token = typeof apiToken === 'string' ? apiToken.trim() : '';
            if (token.length < 10) {
                return res.status(400).json({ message: "Enter the API token from your Delhivery One dashboard (it is at least 10 characters)." });
            }
            update['shippingIntegrations.delhivery.apiToken'] = encrypt(token);
            Object.assign(update, buildClearedCredentials(['apiToken']));
        }

        if (method === 'oauth2') {
            // The frontend flattens the pasted MCP JSON, but accept the raw
            // dashboard shapes too ({ env: {...} } or { mcpServers: { x: { env } } })
            // so a straight copy-paste into an API client also works.
            const env = mcpConfig?.env
                || (mcpConfig?.mcpServers && Object.values(mcpConfig.mcpServers)[0]?.env)
                || mcpConfig
                || {};

            const clientId = env.D1_CLIENT_ID;
            const clientSecret = env.D1_CLIENT_SECRET;
            const authUrl = env.D1_AUTH_URL;
            const realm = env.D1_REALM;

            const missing = [
                !clientId && 'D1_CLIENT_ID',
                !clientSecret && 'D1_CLIENT_SECRET',
                !authUrl && 'D1_AUTH_URL',
                !realm && 'D1_REALM'
            ].filter(Boolean);

            if (missing.length > 0) {
                return res.status(400).json({ message: `The MCP config is missing: ${missing.join(', ')}` });
            }
            if (!/^https?:\/\//i.test(String(authUrl))) {
                return res.status(400).json({ message: "D1_AUTH_URL must be a full http(s) URL" });
            }

            update['shippingIntegrations.delhivery.oauth2ClientId'] = encrypt(String(clientId).trim());
            update['shippingIntegrations.delhivery.oauth2ClientSecret'] = encrypt(String(clientSecret).trim());
            update['shippingIntegrations.delhivery.oauth2AuthUrl'] = encrypt(String(authUrl).trim());
            update['shippingIntegrations.delhivery.oauth2Realm'] = encrypt(String(realm).trim());
            Object.assign(update, buildClearedCredentials(['oauth2ClientId', 'oauth2ClientSecret', 'oauth2AuthUrl', 'oauth2Realm']));
        }

        if (method === 'webhook') {
            generatedWebhookSecret = crypto.randomBytes(32).toString('hex');
            update['shippingIntegrations.delhivery.webhookSecret'] = generatedWebhookSecret;
            Object.assign(update, buildClearedCredentials(['webhookSecret']));
        }

        // Prove the credentials work BEFORE writing isConfigured: true. A green
        // "Connected" chip that has never authenticated is a false signal, and it
        // defers the failure all the way to ship time. Nothing has been persisted
        // yet, so a failure here also leaves a previously-working integration intact.
        const verification = await delhiveryService.verifyCredentials(id, {
            method,
            apiToken: update['shippingIntegrations.delhivery.apiToken'],
            oauth2ClientId: update['shippingIntegrations.delhivery.oauth2ClientId'],
            oauth2ClientSecret: update['shippingIntegrations.delhivery.oauth2ClientSecret'],
            oauth2AuthUrl: update['shippingIntegrations.delhivery.oauth2AuthUrl'],
            oauth2Realm: update['shippingIntegrations.delhivery.oauth2Realm']
        });

        if (!verification.ok) {
            return res.status(400).json({
                message: verification.error || 'Delhivery could not verify these credentials.',
                verified: false,
                method
            });
        }

        const retailer = await Retailer.findByIdAndUpdate(id, { $set: update }, { new: true }).select('shippingIntegrations');
        if (!retailer) {
            return res.status(404).json({ message: "Retailer not found" });
        }

        // Credentials changed -- any cached OAuth2 access token is now stale.
        delhiveryService.invalidateTokenCache(id);

        const response = {
            message: method === 'webhook' ? 'Webhook secret generated' : 'Delhivery integration saved',
            verified: method !== 'webhook', // Webhook verified later
            verificationDetail: verification.detail,
            delhivery: {
                isConfigured: retailer.shippingIntegrations.delhivery.isConfigured,
                method: retailer.shippingIntegrations.delhivery.method,
                configuredAt: retailer.shippingIntegrations.delhivery.configuredAt,
                // Same shape as the status endpoint, so the UI does not lose the
                // sandbox flag the moment it swaps in this response.
                sandbox: delhiveryService.SANDBOX_ENABLED === true
            }
        };

        // The webhook secret is only ever returned here, at the moment we mint
        // it, because the retailer has to paste it into Delhivery. It is not
        // readable from the status endpoint afterwards.
        if (generatedWebhookSecret) {
            response.webhook = {
                url: getWebhookUrl(retailer._id.toString()),
                secretHeader: 'X-Secret',
                secret: generatedWebhookSecret
            };
        }

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error saving Delhivery integration:", error);
        // A missing/short DELHIVERY_ENCRYPTION_KEY surfaces here -- it's a
        // server misconfiguration, so say so plainly rather than "server error".
        if (/DELHIVERY_ENCRYPTION_KEY/.test(error.message)) {
            return res.status(500).json({ message: `Server is not configured for credential encryption. ${error.message}` });
        }
        return res.status(500).json({ message: "Failed to save the integration", error: error.message });
    }
};

/**
 * GET /api/retailers/:id/shipping-integration/status
 * Reports what is configured. Never returns a credential.
 */
exports.getShippingIntegrationStatus = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: "Not authorized to view this retailer's integrations" });
        }

        const retailer = await Retailer.findById(id).select('shippingIntegrations');
        if (!retailer) {
            return res.status(404).json({ message: "Retailer not found" });
        }

        const delhivery = retailer.shippingIntegrations?.delhivery;

        return res.status(200).json({
            delhivery: {
                isConfigured: Boolean(delhivery?.isConfigured),
                method: delhivery?.method || null,
                configuredAt: delhivery?.configuredAt || null,
                lastWebhookReceivedAt: delhivery?.lastWebhookReceivedAt || null,
                // Webhook retailers may need the URL again; the secret is not re-shown.
                webhookUrl: delhivery?.method === 'webhook' ? getWebhookUrl(retailer._id.toString()) : undefined,
                // Local testing only -- always false in production. Lets the UI say
                // out loud that tracking is simulated.
                sandbox: delhiveryService.SANDBOX_ENABLED === true
            }
        });
    } catch (error) {
        console.error("Error fetching shipping integration status:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: "Invalid Retailer ID format" });
        }
        return res.status(500).json({ message: "Server error" });
    }
};

/**
 * DELETE /api/retailers/:id/shipping-integration
 * Unlinks Delhivery and wipes every stored credential.
 */
exports.disconnectShippingIntegration = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: "Not authorized to change this retailer's integrations" });
        }

        const update = {
            'shippingIntegrations.delhivery.method': null,
            'shippingIntegrations.delhivery.isConfigured': false,
            'shippingIntegrations.delhivery.configuredAt': null,
            ...buildClearedCredentials()
        };

        const retailer = await Retailer.findByIdAndUpdate(id, { $set: update }, { new: true }).select('_id');
        if (!retailer) {
            return res.status(404).json({ message: "Retailer not found" });
        }

        delhiveryService.invalidateTokenCache(id);
        return res.status(200).json({ message: 'Delhivery integration disconnected' });
    } catch (error) {
        console.error("Error disconnecting shipping integration:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.saveWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const { name, address, city, state, pincode, phone } = req.body;
        if (!name || !pincode) {
            return res.status(400).json({ message: 'Warehouse name and pincode are required. The name must match exactly what you registered in your delivery partner dashboard.' });
        }
        const retailer = await Retailer.findByIdAndUpdate(id, {
            $set: {
                'warehouse.name': name.trim(),
                'warehouse.address': address?.trim() || null,
                'warehouse.city': city?.trim() || null,
                'warehouse.state': state?.trim() || null,
                'warehouse.pincode': pincode.trim(),
                'warehouse.phone': phone?.trim() || null,
                'warehouse.isConfigured': true
            }
        }, { new: true }).select('warehouse');
        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });
        res.status(200).json({ message: 'Warehouse saved', warehouse: retailer.warehouse });
    } catch (error) {
        console.error('Save warehouse error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const retailer = await Retailer.findById(id).select('warehouse');
        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });
        res.status(200).json({ warehouse: retailer.warehouse || {} });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Payout Methods (Multi Bank & UPI CRUD) ---

exports.getPayoutMethods = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const retailer = await Retailer.findById(id);
        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });

        // Auto-migrate legacy bankDetails into payoutMethods if array is empty
        if ((!retailer.payoutMethods || retailer.payoutMethods.length === 0) && retailer.bankDetails?.isSubmitted && (retailer.bankDetails.accountNumber || retailer.bankDetails.upiId)) {
            retailer.payoutMethods = [{
                type: retailer.bankDetails.upiId ? 'upi' : 'bank_account',
                accountHolderName: retailer.bankDetails.accountHolderName || `${retailer.firstName} ${retailer.lastName}`,
                accountNumber: retailer.bankDetails.accountNumber,
                ifscCode: retailer.bankDetails.ifscCode,
                bankName: retailer.bankDetails.bankName,
                upiId: retailer.bankDetails.upiId,
                isPrimary: true,
                createdAt: new Date()
            }];
            await retailer.save({ validateModifiedOnly: true });
        }

        res.status(200).json({ payoutMethods: retailer.payoutMethods || [] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addPayoutMethod = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const { type, accountHolderName, accountNumber, ifscCode, bankName, upiId, isPrimary } = req.body;
        if (!type || !['bank_account', 'upi'].includes(type)) {
            return res.status(400).json({ message: 'Invalid payout method type (must be bank_account or upi).' });
        }
        if (!accountHolderName || !accountHolderName.trim()) {
            return res.status(400).json({ message: 'Beneficiary / Account Holder Name is required.' });
        }
        if (type === 'bank_account') {
            if (!accountNumber || !ifscCode) {
                return res.status(400).json({ message: 'Account Number and IFSC Code are required for bank accounts.' });
            }
        } else if (type === 'upi') {
            if (!upiId || !upiId.trim()) {
                return res.status(400).json({ message: 'UPI ID is required.' });
            }
        }

        const retailer = await Retailer.findById(id);
        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });

        if (!retailer.payoutMethods) retailer.payoutMethods = [];

        const shouldBePrimary = Boolean(isPrimary) || retailer.payoutMethods.length === 0;

        if (shouldBePrimary) {
            retailer.payoutMethods.forEach(m => m.isPrimary = false);
        }

        const newMethod = {
            type,
            accountHolderName: accountHolderName.trim(),
            accountNumber: type === 'bank_account' ? accountNumber.trim() : null,
            ifscCode: type === 'bank_account' ? ifscCode.trim().toUpperCase() : null,
            bankName: bankName ? bankName.trim() : null,
            upiId: type === 'upi' ? upiId.trim().toLowerCase() : null,
            isPrimary: shouldBePrimary,
            createdAt: new Date()
        };

        retailer.payoutMethods.push(newMethod);

        // Sync legacy bankDetails if primary
        if (shouldBePrimary) {
            retailer.bankDetails = {
                accountHolderName: newMethod.accountHolderName,
                accountNumber: newMethod.accountNumber || newMethod.upiId,
                ifscCode: newMethod.ifscCode || 'UPI',
                bankName: newMethod.bankName || (type === 'upi' ? 'UPI' : 'Bank'),
                upiId: newMethod.upiId,
                isSubmitted: true
            };
        }

        if (!retailer.licenseNumber) retailer.licenseNumber = 'DL-AY-10001';
        await retailer.save({ validateModifiedOnly: true });

        res.status(201).json({ message: 'Payout method added successfully', payoutMethods: retailer.payoutMethods });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updatePayoutMethod = async (req, res) => {
    try {
        const { id, methodId } = req.params;
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const { accountHolderName, accountNumber, ifscCode, bankName, upiId, isPrimary } = req.body;

        const retailer = await Retailer.findById(id);
        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });

        const method = retailer.payoutMethods.id(methodId);
        if (!method) return res.status(404).json({ message: 'Payout method not found' });

        if (accountHolderName) method.accountHolderName = accountHolderName.trim();
        if (method.type === 'bank_account') {
            if (accountNumber) method.accountNumber = accountNumber.trim();
            if (ifscCode) method.ifscCode = ifscCode.trim().toUpperCase();
            if (bankName !== undefined) method.bankName = bankName ? bankName.trim() : null;
        } else if (method.type === 'upi') {
            if (upiId) method.upiId = upiId.trim().toLowerCase();
        }

        if (isPrimary) {
            retailer.payoutMethods.forEach(m => m.isPrimary = false);
            method.isPrimary = true;
        }

        const primary = retailer.payoutMethods.find(m => m.isPrimary);
        if (primary) {
            retailer.bankDetails = {
                accountHolderName: primary.accountHolderName,
                accountNumber: primary.accountNumber || primary.upiId,
                ifscCode: primary.ifscCode || 'UPI',
                bankName: primary.bankName || (primary.type === 'upi' ? 'UPI' : 'Bank'),
                upiId: primary.upiId,
                isSubmitted: true
            };
        }

        await retailer.save({ validateModifiedOnly: true });
        res.status(200).json({ message: 'Payout method updated successfully', payoutMethods: retailer.payoutMethods });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePayoutMethod = async (req, res) => {
    try {
        const { id, methodId } = req.params;
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const retailer = await Retailer.findById(id);
        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });

        const wasPrimary = retailer.payoutMethods.id(methodId)?.isPrimary;
        retailer.payoutMethods.pull({ _id: methodId });

        if (wasPrimary && retailer.payoutMethods.length > 0) {
            retailer.payoutMethods[0].isPrimary = true;
        }

        const primary = retailer.payoutMethods.find(m => m.isPrimary);
        if (primary) {
            retailer.bankDetails = {
                accountHolderName: primary.accountHolderName,
                accountNumber: primary.accountNumber || primary.upiId,
                ifscCode: primary.ifscCode || 'UPI',
                bankName: primary.bankName || (primary.type === 'upi' ? 'UPI' : 'Bank'),
                upiId: primary.upiId,
                isSubmitted: true
            };
        } else {
            retailer.bankDetails = { isSubmitted: false };
        }

        await retailer.save({ validateModifiedOnly: true });
        res.status(200).json({ message: 'Payout method deleted successfully', payoutMethods: retailer.payoutMethods });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.setPrimaryPayoutMethod = async (req, res) => {
    try {
        const { id, methodId } = req.params;
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const retailer = await Retailer.findById(id);
        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });

        const target = retailer.payoutMethods.id(methodId);
        if (!target) return res.status(404).json({ message: 'Payout method not found' });

        retailer.payoutMethods.forEach(m => m.isPrimary = false);
        target.isPrimary = true;

        retailer.bankDetails = {
            accountHolderName: target.accountHolderName,
            accountNumber: target.accountNumber || target.upiId,
            ifscCode: target.ifscCode || 'UPI',
            bankName: target.bankName || (target.type === 'upi' ? 'UPI' : 'Bank'),
            upiId: target.upiId,
            isSubmitted: true
        };

        await retailer.save({ validateModifiedOnly: true });
        res.status(200).json({ message: 'Primary payout method updated', payoutMethods: retailer.payoutMethods });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.saveBankDetails = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { accountHolderName, accountNumber, ifscCode, bankName, upiId } = req.body;
        
        if (!accountHolderName || (!accountNumber && !upiId)) {
            return res.status(400).json({ message: 'Account Holder Name and Account Number (or UPI ID) are required.' });
        }

        const retailer = await Retailer.findById(id);
        if (!retailer) {
            return res.status(404).json({ message: 'Retailer not found' });
        }

        retailer.bankDetails = {
            accountHolderName: accountHolderName.trim(),
            accountNumber: accountNumber ? accountNumber.trim() : null,
            ifscCode: ifscCode ? ifscCode.trim().toUpperCase() : null,
            bankName: bankName ? bankName.trim() : null,
            upiId: upiId ? upiId.trim() : null,
            isSubmitted: true
        };

        // Also sync into payoutMethods
        if (!retailer.payoutMethods) retailer.payoutMethods = [];
        const existingPrimary = retailer.payoutMethods.find(m => m.isPrimary);
        if (existingPrimary) {
            existingPrimary.accountHolderName = accountHolderName.trim();
            existingPrimary.accountNumber = accountNumber ? accountNumber.trim() : null;
            existingPrimary.ifscCode = ifscCode ? ifscCode.trim().toUpperCase() : null;
            existingPrimary.bankName = bankName ? bankName.trim() : null;
            existingPrimary.upiId = upiId ? upiId.trim() : null;
        } else {
            retailer.payoutMethods.push({
                type: upiId && !accountNumber ? 'upi' : 'bank_account',
                accountHolderName: accountHolderName.trim(),
                accountNumber: accountNumber ? accountNumber.trim() : null,
                ifscCode: ifscCode ? ifscCode.trim().toUpperCase() : null,
                bankName: bankName ? bankName.trim() : null,
                upiId: upiId ? upiId.trim() : null,
                isPrimary: true,
                createdAt: new Date()
            });
        }

        if (!retailer.licenseNumber) {
            retailer.licenseNumber = 'DL-AY-10001';
        }
        await retailer.save({ validateModifiedOnly: true });

        res.status(200).json({ 
            message: 'Bank details saved successfully for IMPS/UPI payouts!', 
            bankDetails: retailer.bankDetails,
            payoutMethods: retailer.payoutMethods
        });
    } catch (error) {
        console.error('Save bank details error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getBankDetails = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const retailer = await Retailer.findById(id).select('bankDetails payoutMethods cashfreeVendorId cashfreeBeneficiaryId');
        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });
        res.status(200).json({ 
            bankDetails: retailer.bankDetails || {}, 
            payoutMethods: retailer.payoutMethods || [],
            cashfreeVendorId: retailer.cashfreeVendorId,
            cashfreeBeneficiaryId: retailer.cashfreeBeneficiaryId 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * PUT /api/retailers/:id/verify
 * Admin only: Approve or revoke a retailer's verified seller status.
 */
exports.toggleRetailerVerification = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        const { id } = req.params;
        const { isVerified, notes } = req.body;

        const retailer = await Retailer.findById(id);
        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });

        if (!retailer.adminVerification) {
            retailer.adminVerification = {};
        }

        const newVerified = isVerified !== undefined ? Boolean(isVerified) : !retailer.adminVerification.isVerified;
        retailer.adminVerification.isVerified = newVerified;
        retailer.adminVerification.verifiedAt = newVerified ? new Date() : null;
        retailer.adminVerification.verifiedBy = req.user._id;
        if (notes) retailer.adminVerification.notes = notes;
        if (req.body.cashfreeVendorId !== undefined) {
            retailer.cashfreeVendorId = req.body.cashfreeVendorId ? req.body.cashfreeVendorId.trim() : null;
        }
        if (req.body.cashfreeBeneficiaryId !== undefined) {
            retailer.cashfreeBeneficiaryId = req.body.cashfreeBeneficiaryId ? req.body.cashfreeBeneficiaryId.trim() : null;
        }

        await retailer.save();

        res.status(200).json({
            message: `Retailer verification ${newVerified ? 'approved' : 'revoked'} successfully`,
            adminVerification: retailer.adminVerification
        });
    } catch (error) {
        console.error('Error toggling retailer verification:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/retailers/:id/eligibility
 * Returns the 3-point onboarding & verification checklist for this retailer.
 */
exports.getRetailerEligibility = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const retailer = await Retailer.findById(id);
        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });

        const deliveryConfigured = Boolean(
            retailer.shippingIntegrations?.delhivery?.isConfigured && 
            retailer.warehouse?.isConfigured
        );
        const paymentConfigured = Boolean(
            (retailer.payoutMethods && retailer.payoutMethods.length > 0) ||
            (retailer.bankDetails?.isSubmitted && (retailer.bankDetails?.accountNumber || retailer.bankDetails?.upiId)) ||
            retailer.cashfreeVendorId ||
            retailer.cashfreeBeneficiaryId
        );
        const adminApproved = Boolean(retailer.adminVerification?.isVerified);
        const isEligible = deliveryConfigured && paymentConfigured && adminApproved;

        res.status(200).json({
            isEligible,
            checklist: {
                deliveryConfigured,
                warehouseConfigured: Boolean(retailer.warehouse?.isConfigured),
                courierLinked: Boolean(retailer.shippingIntegrations?.delhivery?.isConfigured),
                paymentConfigured,
                adminApproved
            },
            adminVerification: retailer.adminVerification || { isVerified: false }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};