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

exports.saveBankDetails = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { accountHolderName, accountNumber, ifscCode, businessType } = req.body;
        
        if (!accountHolderName || !accountNumber || !ifscCode) {
            return res.status(400).json({ message: 'Account Holder Name, Account Number, and IFSC Code are required.' });
        }

        const retailer = await Retailer.findById(id);
        if (!retailer) {
            return res.status(404).json({ message: 'Retailer not found' });
        }

        // Save bank details
        retailer.bankDetails = {
            accountHolderName: accountHolderName.trim(),
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim(),
            businessType: businessType || 'individual',
            isSubmitted: true
        };

        // Automate Razorpay Linked Account Creation via v1/beta/accounts API
        if (!retailer.razorpayAccountId && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
            const axios = require('axios');
            try {
                const authHeader = 'Basic ' + Buffer.from(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET).toString('base64');
                const payload = {
                    name: retailer.firstName + ' ' + retailer.lastName,
                    email: retailer.email,
                    tnc_accepted: true,
                    account_details: {
                        business_name: retailer.BusinessName || (retailer.firstName + ' ' + retailer.lastName),
                        business_type: businessType || 'individual'
                    },
                    bank_account: {
                        ifsc_code: ifscCode.trim(),
                        beneficiary_name: accountHolderName.trim(),
                        account_number: accountNumber.trim()
                    }
                };

                const response = await axios.post('https://api.razorpay.com/v1/beta/accounts', payload, {
                    headers: {
                        'Authorization': authHeader,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data && response.data.id) {
                    retailer.razorpayAccountId = response.data.id;
                }
            } catch (apiError) {
                console.error('Error auto-creating Razorpay Linked Account:', apiError.response?.data || apiError.message);
                // We don't block the save if the API fails; admin can retry or create manually.
            }
        }

        await retailer.save();

        const successMessage = retailer.razorpayAccountId 
            ? 'Bank details saved and Razorpay account linked successfully!'
            : 'Bank details saved successfully. Our team will verify and link your account for payouts.';

        res.status(200).json({ message: successMessage, bankDetails: retailer.bankDetails });
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
        const retailer = await Retailer.findById(id).select('bankDetails razorpayAccountId');
        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });
        res.status(200).json({ bankDetails: retailer.bankDetails || {}, razorpayAccountId: retailer.razorpayAccountId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};