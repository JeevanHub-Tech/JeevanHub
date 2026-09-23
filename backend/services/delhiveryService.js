// services/delhiveryService.js
//
// Everything that talks to Delhivery lives here. Three credential methods are
// supported because retailers get different levels of API access depending on
// their Delhivery One plan:
//
//   apiToken -> a static token from the dashboard, sent as `Authorization: Token <t>`
//   oauth2   -> MCP/OAuth2 client credentials, exchanged for a short-lived
//               Bearer token, then the same tracking endpoint
//   webhook  -> Delhivery pushes scans to us; there is nothing to poll
//
// The tracking endpoint and response shape are identical across apiToken and
// oauth2 -- only the Authorization header differs.

const axios = require('axios');
const Retailer = require('../models/Retailer');
const { decrypt, isEncrypted } = require('../utils/encryption');

const TRACKING_BASE_URL = process.env.DELHIVERY_TRACKING_URL || 'https://track.delhivery.com/api/v1/packages/json/';
const REQUEST_TIMEOUT_MS = 10000;

// A waybill that cannot exist, used only to make Delhivery judge an API token.
const VERIFY_PROBE_AWB = '00000000000000';

// Credential fields are `select: false` on the schema so they never leak through
// a generic retailer fetch. Anything that needs to actually authenticate has to
// ask for them explicitly, which is what findRetailerWithCredentials does.
const CREDENTIAL_SELECT = [
    '+shippingIntegrations.delhivery.apiToken',
    '+shippingIntegrations.delhivery.oauth2ClientId',
    '+shippingIntegrations.delhivery.oauth2ClientSecret',
    '+shippingIntegrations.delhivery.oauth2AuthUrl',
    '+shippingIntegrations.delhivery.oauth2Realm',
    '+shippingIntegrations.delhivery.webhookSecret'
].join(' ');

/**
 * Loads a retailer with their (still-encrypted) Delhivery credentials attached.
 * @param {string|import('mongoose').Types.ObjectId} retailerId
 */
async function findRetailerWithCredentials(retailerId) {
    if (!retailerId) return null;
    return Retailer.findById(retailerId).select(CREDENTIAL_SELECT);
}

// OAuth2 access tokens are short-lived (~1h), so cache them per retailer in
// memory rather than re-authenticating on every tracking call. Process-local
// and deliberately not persisted -- a restart just re-authenticates.
const oauth2TokenCache = new Map(); // retailerId -> { accessToken, expiresAt }

function readCredential(value, label) {
    if (!value) {
        throw new Error(`Delhivery ${label} is missing. Please re-save your integration credentials.`);
    }
    if (!isEncrypted(value)) {
        throw new Error(`Delhivery ${label} is not stored in the expected encrypted format. Please re-save your integration credentials.`);
    }
    try {
        return decrypt(value);
    } catch {
        // Almost always means DELHIVERY_ENCRYPTION_KEY changed after the
        // credential was saved -- say so instead of leaking a crypto error.
        throw new Error(`Could not decrypt the stored Delhivery ${label}. If the server encryption key was rotated, the retailer must re-save their credentials.`);
    }
}

/**
 * Builds the Keycloak client-credentials token endpoint.
 *
 * D1_AUTH_URL is an auth-server *base* (e.g. https://ucp-auth.delhivery.com/holyknight)
 * and the realm is a separate field, so the endpoint is
 * `{base}/realms/{realm}/protocol/openid-connect/token`. This matches Delhivery's
 * own `d1-mcp-mint` package, and is confirmed by the server answering
 * `invalid_client` on a real realm versus 404 when the path is wrong.
 *
 * A retailer who pastes a full token URL (or one ending in /realms/<realm>) is
 * honoured as given rather than having the path appended twice.
 */
function buildTokenEndpoint(authUrl, realm) {
    const base = String(authUrl || '').trim().replace(/\/+$/, '');
    if (!base) {
        throw new Error('Delhivery auth URL is empty. Re-save the integration with D1_AUTH_URL.');
    }
    if (/\/protocol\/openid-connect\/token$/.test(base)) return base;
    if (/\/realms\/[^/]+$/.test(base)) return `${base}/protocol/openid-connect/token`;
    if (!realm) {
        throw new Error('Delhivery realm is missing, so the OAuth2 token URL cannot be built. Re-save the integration with D1_REALM.');
    }
    return `${base}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`;
}

/**
 * Exchanges the retailer's OAuth2 client credentials for an access token.
 * Cached until 60s before expiry.
 */
async function getOAuth2Token(retailerId, delhivery) {
    const cacheKey = String(retailerId);
    const cached = oauth2TokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.accessToken;
    }

    const clientId = readCredential(delhivery.oauth2ClientId, 'client ID');
    const clientSecret = readCredential(delhivery.oauth2ClientSecret, 'client secret');
    const authUrl = readCredential(delhivery.oauth2AuthUrl, 'auth URL');
    const realm = readCredential(delhivery.oauth2Realm, 'realm');

    const tokenEndpoint = buildTokenEndpoint(authUrl, realm);

    // Keycloak takes the realm from the URL path, not the form body.
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    let response;
    try {
        response = await axios.post(tokenEndpoint, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: REQUEST_TIMEOUT_MS
        });
    } catch (error) {
        // "Realm does not exist" is an account-provisioning problem, not a
        // credential typo -- say which realm was tried so it is actionable.
        const body = error.response?.data;
        const serverError = typeof body === 'string' ? body : (body?.error_description || body?.error || '');
        if (error.response?.status === 404 && /realm does not exist/i.test(String(serverError))) {
            throw new Error(
                `Delhivery does not recognise the realm "${realm}" at ${new URL(tokenEndpoint).origin}. ` +
                `Confirm D1_AUTH_URL and D1_REALM with Delhivery -- the auth server reached us fine, ` +
                `but that realm is not hosted there.`
            );
        }
        throw new Error(`Delhivery OAuth2 authentication failed (${tokenEndpoint}): ${describeAxiosError(error)}`);
    }

    const accessToken = response.data?.access_token;
    if (!accessToken) {
        throw new Error('Delhivery OAuth2 response did not contain an access_token');
    }

    const expiresIn = Number(response.data.expires_in) || 3600;
    oauth2TokenCache.set(cacheKey, {
        accessToken,
        expiresAt: Date.now() + Math.max(expiresIn - 60, 30) * 1000
    });
    return accessToken;
}

/** Drops a retailer's cached OAuth2 token (called when credentials change). */
function invalidateTokenCache(retailerId) {
    oauth2TokenCache.delete(String(retailerId));
}

/**
 * Builds the Authorization header for whichever method the retailer configured.
 * @param {Object} retailer a retailer doc loaded via findRetailerWithCredentials
 */
async function getAuthHeader(retailer) {
    const delhivery = retailer?.shippingIntegrations?.delhivery;
    if (!delhivery || !delhivery.isConfigured) {
        throw new Error('Delhivery integration is not configured for this retailer');
    }

    if (delhivery.method === 'apiToken') {
        return `Token ${readCredential(delhivery.apiToken, 'API token')}`;
    }

    if (delhivery.method === 'oauth2') {
        const accessToken = await getOAuth2Token(retailer._id, delhivery);
        return `Bearer ${accessToken}`;
    }

    // Webhook-only retailers have no outbound credentials at all -- Delhivery
    // pushes to us, so there is nothing to poll with.
    throw new Error('This retailer uses webhook-only integration, so live tracking cannot be fetched on demand.');
}

/** True when the retailer's method supports us calling Delhivery ourselves. */
function canPoll(retailer) {
    const method = retailer?.shippingIntegrations?.delhivery?.method;
    return Boolean(retailer?.shippingIntegrations?.delhivery?.isConfigured)
        && (method === 'apiToken' || method === 'oauth2');
}

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

// Delhivery's StatusType is coarser than its Status string -- in practice
// everything mid-journey comes back as "UD" with the detail carried in Status
// ("In Transit", "Out for Delivery", ...). So map on StatusType first for the
// terminal states we care about, and fall back to the string otherwise.
const TERMINAL_STATUS_TYPES = {
    DL: 'delivered',  // Delivered
    RT: 'cancelled'   // RTO -- being returned to the seller
};

/**
 * Maps a Delhivery status to JeevanHub's orderStatus enum.
 * Only a real delivery moves the order to 'delivered' (which starts the payout
 * hold); every in-transit state stays 'shipped'.
 *
 * @param {string} statusCode Delhivery StatusType, e.g. "DL"
 * @param {string} [statusText] Delhivery Status string, e.g. "Out for Delivery"
 * @returns {'shipped'|'delivered'|'cancelled'}
 */
function mapDelhiveryStatusToOrderStatus(statusCode, statusText) {
    const code = String(statusCode || '').trim().toUpperCase();
    if (TERMINAL_STATUS_TYPES[code]) return TERMINAL_STATUS_TYPES[code];

    const text = String(statusText || '').trim().toLowerCase();
    // "Undelivered" contains "delivered", so rule it out before matching.
    if (text && !text.includes('undelivered') && !text.includes('not delivered')) {
        if (text.includes('delivered')) return 'delivered';
    }
    if (text.includes('rto') || text.includes('return to origin')) return 'cancelled';

    // Manifested / Picked Up / In Transit / Processing / Out for Delivery /
    // Undelivered (a failed attempt that Delhivery will retry) all stay shipped.
    return 'shipped';
}

/** Human-readable label for a raw Delhivery status type, for the UI. */
const STATUS_TYPE_LABELS = {
    M: 'Manifested',
    PP: 'Picked Up',
    IT: 'In Transit',
    OP: 'In Transit',
    OT: 'Out for Delivery',
    UD: 'In Transit',
    DL: 'Delivered',
    RT: 'Returning to Seller'
};

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

function toDateOrNull(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Normalizes the raw Delhivery tracking response.
 *
 * Delhivery has shipped both PascalCase (ShipmentData/ScanDetail) and
 * snake_case (shipment_data/scan_detail) shapes over the years depending on the
 * account, so accept either.
 *
 * @returns {{currentStatus, currentStatusCode, currentLocation, currentStatusAt, timeline}}
 */
function parseTrackingResponse(apiResponse) {
    const container = apiResponse?.ShipmentData || apiResponse?.shipment_data;
    const shipment = Array.isArray(container)
        ? (container[0]?.Shipment || container[0]?.shipment)
        : null;

    if (!shipment) {
        // Delhivery answers 200 with an empty list for an AWB it doesn't know.
        throw new Error('Delhivery returned no shipment for this AWB. Check that the waybill number is correct and belongs to this Delhivery account.');
    }

    const status = shipment.Status || shipment.status || {};
    const rawCode = status.StatusType || status.status_type || null;
    const rawStatus = status.Status || status.status || null;

    const timeline = (shipment.Scans || shipment.scans || [])
        .map((scan) => {
            const d = scan?.ScanDetail || scan?.scan_detail || scan || {};
            const scanCode = d.StatusCode || d.status_code || d.ScanType || null;
            const scanStatus = d.Scan || d.scan || d.Status || null;
            return {
                status: scanStatus || STATUS_TYPE_LABELS[String(scanCode || '').toUpperCase()] || 'Update',
                statusCode: scanCode ? String(scanCode).toUpperCase() : null,
                location: d.ScannedLocation || d.scanned_location || d.location || null,
                timestamp: toDateOrNull(d.ScanDateTime || d.scan_date_time || d.StatusDateTime || d.date_time),
                remarks: d.Instructions || d.instructions || d.remarks || ''
            };
        })
        // Newest first, so the UI can render the timeline top-down without sorting.
        .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));

    const currentStatusCode = rawCode ? String(rawCode).toUpperCase() : (timeline[0]?.statusCode || null);
    const currentStatus = rawStatus
        || timeline[0]?.status
        || STATUS_TYPE_LABELS[currentStatusCode]
        || 'Unknown';

    return {
        currentStatus,
        currentStatusCode,
        currentLocation: status.StatusLocation || status.status_location || timeline[0]?.location || null,
        currentStatusAt: toDateOrNull(status.StatusDateTime || status.status_date_time) || timeline[0]?.timestamp || null,
        timeline
    };
}

function describeAxiosError(error) {
    if (error.response) {
        const body = error.response.data;
        const detail = typeof body === 'string'
            ? body.slice(0, 200)
            : (body?.message || body?.error || body?.Error || JSON.stringify(body || {}).slice(0, 200));
        if (error.response.status === 401 || error.response.status === 403) {
            return `Delhivery rejected the credentials (HTTP ${error.response.status}). ${detail || 'Check that the token is a live token and has tracking access.'}`;
        }
        return `Delhivery responded with HTTP ${error.response.status}. ${detail}`;
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return 'Delhivery did not respond in time. Please try again.';
    }
    return error.message || 'Unknown error contacting Delhivery';
}

// ---------------------------------------------------------------------------
// Sandbox mode -- local testing without a Delhivery account
// ---------------------------------------------------------------------------

// Lets the full ship -> track -> deliver -> payout-hold flow be exercised with
// no Delhivery account and no real waybill.
//
// Deliberately impossible to enable in production: a faked "Delivered" starts
// the payout hold and then releases retailer money, so this must never be one
// stray env var away from being live.
const SANDBOX_ENABLED =
    /^(1|true|yes|on)$/i.test(String(process.env.DELHIVERY_SANDBOX || '')) &&
    process.env.NODE_ENV !== 'production';

const SANDBOX_NOTE = 'SANDBOX - simulated scan, not from Delhivery';

if (SANDBOX_ENABLED) {
    console.warn('⚠️  DELHIVERY_SANDBOX is on: tracking is simulated, no Delhivery calls are made.');
}

/**
 * The AWB picks the scenario, so every branch is reachable from the UI without
 * touching the database. Case-insensitive substring match.
 */
function sandboxScenario(awb) {
    const value = String(awb || '').toUpperCase();
    if (value.includes('BAD') || value.includes('404')) return 'notFound';
    if (value.includes('DL')) return 'delivered';
    if (value.includes('RT')) return 'rto';
    if (value.includes('UD')) return 'undelivered';
    return 'transit';
}

/**
 * Builds a response in Delhivery's own PascalCase shape rather than returning a
 * pre-parsed object, so sandbox runs still exercise parseTrackingResponse and
 * the status mapping for real.
 */
function sandboxPayload(awb, scenario) {
    const now = Date.now();
    const hoursAgo = (h) => new Date(now - h * 3600000).toISOString();

    const scans = [
        { code: 'PP', text: 'Manifested', loc: 'Gurgaon_Bilaspur (Haryana)', at: hoursAgo(30) },
        { code: 'UD', text: 'In Transit', loc: 'Gurgaon_Hub (Haryana)', at: hoursAgo(22) },
        { code: 'UD', text: 'In Transit', loc: 'Kolkata_Hub (West Bengal)', at: hoursAgo(8) }
    ];

    if (scenario === 'delivered') {
        scans.push({ code: 'UD', text: 'Out for Delivery', loc: 'Kolkata_Behala (West Bengal)', at: hoursAgo(4) });
        scans.push({ code: 'DL', text: 'Delivered', loc: 'Kolkata_Behala (West Bengal)', at: hoursAgo(1) });
    } else if (scenario === 'rto') {
        scans.push({ code: 'RT', text: 'RTO Initiated', loc: 'Kolkata_Hub (West Bengal)', at: hoursAgo(2) });
    } else if (scenario === 'undelivered') {
        // Stays 'shipped': a failed attempt Delhivery will retry, and the string
        // "Undelivered" contains "delivered", so this is the mapping trap.
        scans.push({ code: 'UD', text: 'Undelivered', loc: 'Kolkata_Behala (West Bengal)', at: hoursAgo(2) });
    } else {
        scans.push({ code: 'UD', text: 'Out for Delivery', loc: 'Kolkata_Behala (West Bengal)', at: hoursAgo(2) });
    }

    const latest = scans[scans.length - 1];
    return {
        ShipmentData: [{
            Shipment: {
                AWB: String(awb),
                Status: {
                    Status: latest.text,
                    StatusType: latest.code,
                    StatusLocation: latest.loc,
                    StatusDateTime: latest.at,
                    Instructions: SANDBOX_NOTE
                },
                Scans: scans.map((s) => ({
                    ScanDetail: {
                        Scan: s.text,
                        ScanType: s.code,
                        ScannedLocation: s.loc,
                        ScanDateTime: s.at,
                        Instructions: SANDBOX_NOTE
                    }
                }))
            }
        }]
    };
}

/**
 * Sandbox stand-in for a tracking call. Still checks the retailer is configured
 * and that the stored credentials decrypt, so the parts that don't need the
 * network (storage, encryption, method gating) are genuinely covered.
 */
function sandboxTrack(retailer, awb) {
    const delhivery = retailer?.shippingIntegrations?.delhivery;
    if (!delhivery?.isConfigured) {
        throw new Error('Delhivery integration is not configured for this retailer');
    }
    if (delhivery.method === 'apiToken') {
        readCredential(delhivery.apiToken, 'API token');
    } else if (delhivery.method === 'oauth2') {
        readCredential(delhivery.oauth2ClientId, 'client ID');
        readCredential(delhivery.oauth2ClientSecret, 'client secret');
    } else {
        throw new Error('This retailer uses webhook-only integration, so live tracking cannot be fetched on demand.');
    }

    const scenario = sandboxScenario(awb);
    if (scenario === 'notFound') {
        // Same message the real parser produces for an unknown AWB, so the
        // rejection path in shipOrder can be tested too.
        throw new Error('Delhivery returned no shipment for this AWB. Check that the waybill number is correct and belongs to this Delhivery account.');
    }
    return parseTrackingResponse(sandboxPayload(awb, scenario));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches live tracking for an AWB using the retailer's configured credentials.
 * @param {Object} retailer loaded via findRetailerWithCredentials
 * @param {string} awb
 */
async function trackShipment(retailer, awb) {
    if (SANDBOX_ENABLED) {
        const parsed = sandboxTrack(retailer, awb);
        return {
            ...parsed,
            mappedOrderStatus: mapDelhiveryStatusToOrderStatus(parsed.currentStatusCode, parsed.currentStatus)
        };
    }

    const authHeader = await getAuthHeader(retailer);

    let response;
    try {
        response = await axios.get(TRACKING_BASE_URL, {
            params: { waybill: awb },
            headers: {
                Authorization: authHeader,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            timeout: REQUEST_TIMEOUT_MS
        });
    } catch (error) {
        // A 401 on an OAuth2 call may just be a stale cached token; drop it so
        // the next attempt re-authenticates rather than failing forever.
        if (error.response?.status === 401) invalidateTokenCache(retailer._id);
        throw new Error(describeAxiosError(error));
    }

    const parsed = parseTrackingResponse(response.data);
    return {
        ...parsed,
        mappedOrderStatus: mapDelhiveryStatusToOrderStatus(parsed.currentStatusCode, parsed.currentStatus)
    };
}

/**
 * Confirms an AWB exists in the retailer's Delhivery account, so a typo is
 * caught at ship time instead of silently producing an untrackable order.
 * @returns {{valid: boolean, result?: Object, error?: string}}
 */
async function validateAwb(retailer, awb) {
    try {
        const result = await trackShipment(retailer, awb);
        return { valid: true, result };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

/**
 * Proves a set of credentials actually works, so "Connected" can only ever mean
 * "Delhivery answered us". Called before the credentials are persisted, so a
 * failure leaves any previously-working integration untouched.
 *
 * Takes the same (encrypted) shape as the stored subdocument, so what gets
 * verified is exactly what would get saved.
 *
 * @param {string} retailerId
 * @param {Object} delhivery { method, apiToken?, oauth2ClientId?, ... } encrypted
 * @returns {Promise<{ok: boolean, error?: string, detail?: string}>}
 */
async function verifyCredentials(retailerId, delhivery) {
    const method = delhivery?.method;

    if (!['apiToken', 'oauth2', 'webhook'].includes(method)) {
        return { ok: false, error: `Unknown Delhivery integration method "${method}".` };
    }

    // Webhook is the one method with nothing to call: we mint the secret and
    // Delhivery pushes to us. There is no credential of theirs to test.
    if (method === 'webhook') {
        return { ok: true, detail: 'Nothing to verify — Delhivery pushes to us. The first scan confirms it works.' };
    }

    // Sandbox makes no network calls, but the values must still decrypt --
    // otherwise a broken encryption key would look like a healthy connection.
    if (SANDBOX_ENABLED) {
        try {
            if (method === 'apiToken') {
                readCredential(delhivery.apiToken, 'API token');
            } else {
                readCredential(delhivery.oauth2ClientId, 'client ID');
                readCredential(delhivery.oauth2ClientSecret, 'client secret');
                readCredential(delhivery.oauth2AuthUrl, 'auth URL');
                readCredential(delhivery.oauth2Realm, 'realm');
            }
        } catch (error) {
            return { ok: false, error: error.message };
        }
        return { ok: true, detail: 'Sandbox mode: credentials were not checked with Delhivery.' };
    }

    if (method === 'oauth2') {
        // Minting a token proves all four values at once: auth domain, realm,
        // client id and secret. We deliberately stop there -- whether this
        // tenant's token is honoured by the REST tracking API or only by the MCP
        // gateway is a separate question, and failing on it would reject
        // credentials that are genuinely correct.
        invalidateTokenCache(retailerId);
        try {
            await getOAuth2Token(retailerId, delhivery);
            return { ok: true, detail: 'Delhivery issued an access token.' };
        } catch (error) {
            invalidateTokenCache(retailerId);
            return { ok: false, error: error.message };
        }
    }

    if (method === 'apiToken') {
        // Delhivery has no "whoami" endpoint, so ask the tracking API about a
        // waybill that cannot exist. Auth is checked before the lookup, so
        // 401/403 means the token is wrong, while *any* other answer -- including
        // "no such shipment" -- proves Delhivery accepted the token.
        let token;
        try {
            token = readCredential(delhivery.apiToken, 'API token');
        } catch (error) {
            return { ok: false, error: error.message };
        }

        try {
            await axios.get(TRACKING_BASE_URL, {
                params: { waybill: VERIFY_PROBE_AWB },
                headers: {
                    Authorization: `Token ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                timeout: REQUEST_TIMEOUT_MS
            });
            return { ok: true, detail: 'Delhivery accepted the API token.' };
        } catch (error) {
            const status = error.response?.status;
            if (status === 401 || status === 403) {
                return {
                    ok: false,
                    error: `Delhivery rejected this API token (HTTP ${status}). Copy it again from Delhivery One → Settings → API Setup, and check you are using the live token rather than a staging one.`
                };
            }
            if (status >= 400 && status < 500) {
                // An unknown-waybill rejection still means the token authenticated.
                return { ok: true, detail: 'Delhivery accepted the API token.' };
            }
            return { ok: false, error: `Could not reach Delhivery to verify the token: ${describeAxiosError(error)}` };
        }
    }
}

/**
 * Normalizes an inbound Delhivery webhook body into the same shape as a scan
 * from parseTrackingResponse().
 */
function parseWebhookPayload(payload) {
    const shipment = payload?.Shipment || payload?.shipment;
    if (!shipment) {
        throw new Error('Invalid Delhivery webhook payload: no Shipment object');
    }

    const status = shipment.Status || shipment.status || {};
    const statusCode = status.StatusType || status.status_type || null;
    const statusText = status.Status || status.status || null;

    return {
        awb: shipment.AWB || shipment.awb || shipment.Waybill || null,
        referenceNo: shipment.ReferenceNo || shipment.reference_no || null,
        currentStatus: statusText || 'Update',
        currentStatusCode: statusCode ? String(statusCode).toUpperCase() : null,
        currentLocation: status.StatusLocation || status.status_location || null,
        timestamp: toDateOrNull(status.StatusDateTime || status.status_date_time) || new Date(),
        remarks: status.Instructions || status.instructions || '',
        mappedOrderStatus: mapDelhiveryStatusToOrderStatus(statusCode, statusText)
    };
}

// ---------------------------------------------------------------------------
// Fulfillment APIs -- shipment creation, labels, pickup, cancellation, freight
// ---------------------------------------------------------------------------

/** Base URL for Delhivery Express APIs (not just tracking). */
function getBaseUrl() {
    return (process.env.DELHIVERY_TRACKING_URL || 'https://track.delhivery.com').replace(/\/+$/, '');
}

/**
 * Checks if a destination pincode is serviceable by Delhivery.
 *
 * GET /c/api/pin-codes/json/?filter_codes=<PIN>
 *
 * @param {Object} retailer - loaded via findRetailerWithCredentials
 * @param {string} destPin - 6-digit destination pincode
 * @returns {{ serviceable: boolean, prepaid: boolean, cod: boolean, pickup: boolean, city: string|null, state: string|null }}
 */
async function checkServiceability(retailer, destPin) {
    if (SANDBOX_ENABLED) {
        return { serviceable: true, prepaid: true, cod: true, pickup: true, city: 'Sandbox City', state: 'SB' };
    }
    const authHeader = await getAuthHeader(retailer);
    const response = await axios.get(`${getBaseUrl()}/c/api/pin-codes/json/`, {
        params: { filter_codes: destPin },
        headers: { Authorization: authHeader, Accept: 'application/json' },
        timeout: REQUEST_TIMEOUT_MS
    });

    const codes = response.data?.delivery_codes || [];
    if (codes.length === 0) {
        return { serviceable: false, prepaid: false, cod: false, pickup: false, city: null, state: null };
    }

    const pin = codes[0].postal_code;
    return {
        serviceable: pin.pre_paid === 'Y' || pin.cash === 'Y',
        prepaid: pin.pre_paid === 'Y',
        cod: pin.cod === 'Y' || pin.cash === 'Y',
        pickup: pin.pickup === 'Y',
        city: pin.city || null,
        state: pin.state || null
    };
}

/**
 * Calculates estimated shipping cost.
 *
 * GET /api/kinko/v1/invoice/charges/.json?md=E&cgm=<WEIGHT>&ss=Delivered&o_pin=<OPIN>&d_pin=<DPIN>
 *
 * @param {Object} retailer - loaded via findRetailerWithCredentials
 * @param {string} originPin - 6-digit origin pincode
 * @param {string} destPin - 6-digit destination pincode
 * @param {number} weightGrams - total weight in grams
 * @param {string} [mode='E'] - 'E' for Express, 'S' for Surface
 * @returns {{ totalAmount: number, grossAmount: number, zone: string, tax: number }}
 */
async function calculateFreight(retailer, originPin, destPin, weightGrams, mode = 'S', paymentType = 'Pre-paid', codAmount = 0) {
    if (SANDBOX_ENABLED) {
        return { totalAmount: 78.50, grossAmount: 66.52, zone: 'Sandbox Zone', tax: 11.98 };
    }
    const authHeader = await getAuthHeader(retailer);
    
    // Helper to fetch rate for a specific mode
    const fetchRate = async (billingMode) => {
        const response = await axios.get(`${getBaseUrl()}/api/kinko/v1/invoice/charges/.json`, {
            params: { 
                md: billingMode, 
                cgm: weightGrams, 
                ss: 'Delivered', 
                o_pin: originPin, 
                d_pin: destPin,
                pt: paymentType,
                cod: codAmount
            },
            headers: { Authorization: authHeader, Accept: 'application/json' },
            timeout: REQUEST_TIMEOUT_MS
        });
        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        return {
            totalAmount: data?.total_amount || 0,
            grossAmount: data?.gross_amount || 0,
            zone: data?.zone || 'Unknown',
            tax: data?.charge_tax_total || 0
        };
    };

    let result = await fetchRate(mode);
    
    // If the requested mode returns 0 (rate card gap for this zone), fallback to the other mode
    if (result.totalAmount === 0) {
        const fallbackMode = mode === 'S' ? 'E' : 'S';
        const fallbackResult = await fetchRate(fallbackMode);
        if (fallbackResult.totalAmount > 0) {
            result = fallbackResult;
        }
    }
    
    return result;
}

/**
 * Creates a shipment in Delhivery and auto-generates an AWB.
 *
 * POST /api/cmu/create.json  (Content-Type: application/x-www-form-urlencoded)
 * Body: format=json&data=<JSON>
 *
 * @param {Object} retailer - loaded via findRetailerWithCredentials
 * @param {Object} order - the Mongoose order document
 * @param {Object} packageDetails - { weightGrams, productsDesc, consigneePhone, warehouseName, warehouseAddress, warehouseCity, warehousePincode, warehousePhone }
 * @returns {{ success: boolean, awb: string, refnum: string, remarks: string }}
 */
async function createShipment(retailer, order, packageDetails) {
    if (SANDBOX_ENABLED) {
        const fakeAwb = 'SBX' + Date.now().toString().slice(-10);
        return { success: true, awb: fakeAwb, refnum: order._id.toString(), remarks: 'Sandbox shipment' };
    }

    const authHeader = await getAuthHeader(retailer);

    const paymentMode = order.paymentMethod === 'cashOnDelivery' ? 'COD' : 'Prepaid';
    const codAmount = paymentMode === 'COD' ? (order.totalPrice + (order.shippingCharge || 0)) : 0;

    const shipmentData = {
        shipments: [{
            order: order._id.toString(),
            name: `${order.buyer.firstName || ''} ${order.buyer.lastName || ''}`.trim(),
            add: order.shippingAddress?.street || '',
            city: order.shippingAddress?.city || '',
            state: order.shippingAddress?.state || '',
            country: order.shippingAddress?.country || 'India',
            pin: order.shippingAddress?.postalCode || '',
            phone: packageDetails.consigneePhone || '',
            payment_mode: paymentMode,
            total_amount: order.totalPrice + (order.shippingCharge || 0),
            cod_amount: codAmount,
            products_desc: packageDetails.productsDesc || 'Ayurvedic Medicines',
            weight: packageDetails.weightGrams || 500,
            quantity: String(packageDetails.itemCount || 1)
        }],
        pickup_location: {
            name: packageDetails.warehouseName,
            add: packageDetails.warehouseAddress || '',
            city: packageDetails.warehouseCity || '',
            pin: packageDetails.warehousePincode || '',
            country: 'India',
            phone: packageDetails.warehousePhone || ''
        }
    };

    const params = new URLSearchParams();
    params.append('format', 'json');
    params.append('data', JSON.stringify(shipmentData));

    let response;
    try {
        response = await axios.post(`${getBaseUrl()}/api/cmu/create.json`, params.toString(), {
            headers: { Authorization: authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000
        });
    } catch (error) {
        throw new Error(`Failed to create Delhivery shipment: ${describeAxiosError(error)}`);
    }

    const pkg = response.data?.packages?.[0];
    if (!pkg || pkg.status !== 'Success') {
        throw new Error(pkg?.remarks || response.data?.rmk || 'Delhivery rejected the shipment. Check warehouse name and consignee details.');
    }

    return {
        success: true,
        awb: pkg.waybill,
        refnum: pkg.refnum || order._id.toString(),
        remarks: pkg.remarks || ''
    };
}

/**
 * Downloads the shipping label PDF for an AWB.
 *
 * GET /api/p/packing_slip?wbns=<AWB>&pdf=true
 *
 * @param {Object} retailer - loaded via findRetailerWithCredentials
 * @param {string} awb - the waybill number
 * @returns {Buffer} PDF binary data
 */
async function getShippingLabel(retailer, awb) {
    if (SANDBOX_ENABLED) {
        // Return a minimal PDF placeholder for sandbox mode
        return Buffer.from('%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF');
    }
    const authHeader = await getAuthHeader(retailer);
    const response = await axios.get(`${getBaseUrl()}/api/p/packing_slip`, {
        params: { wbns: awb, pdf: true },
        headers: { Authorization: authHeader },
        responseType: 'arraybuffer',
        timeout: 15000
    });
    return response.data;
}

/**
 * Requests a pickup from Delhivery.
 *
 * POST /fm/request/new/
 *
 * @param {Object} retailer - loaded via findRetailerWithCredentials
 * @param {string} warehouseName - exact registered name of the pickup location
 * @param {string} pickupDate - YYYY-MM-DD
 * @param {string} [pickupTime='14:00:00'] - HH:MM:SS
 * @param {number} [packageCount=1]
 * @returns {{ pickupId: string, message: string }}
 */
async function requestPickup(retailer, warehouseName, pickupDate, pickupTime, packageCount) {
    if (SANDBOX_ENABLED) {
        return { pickupId: 'SBX-PK-' + Date.now(), message: 'Sandbox pickup request created' };
    }
    const authHeader = await getAuthHeader(retailer);
    const response = await axios.post(`${getBaseUrl()}/fm/request/new/`, {
        pickup_location: warehouseName,
        pickup_date: pickupDate,
        pickup_time: pickupTime || '14:00:00',
        expected_package_count: packageCount || 1
    }, {
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        timeout: REQUEST_TIMEOUT_MS
    });

    return {
        pickupId: String(response.data?.pickup_id || ''),
        message: response.data?.message || 'Pickup request created'
    };
}

/**
 * Cancels a shipment before pickup.
 *
 * POST /api/p/edit
 * Body: { waybill: "<AWB>", cancellation: "true" }
 *
 * @param {Object} retailer - loaded via findRetailerWithCredentials
 * @param {string} awb - the waybill number
 * @returns {{ success: boolean, message: string }}
 */
async function cancelShipment(retailer, awb) {
    if (SANDBOX_ENABLED) {
        return { success: true, message: 'Sandbox shipment cancelled' };
    }
    const authHeader = await getAuthHeader(retailer);
    const response = await axios.post(`${getBaseUrl()}/api/p/edit`, {
        waybill: awb,
        cancellation: 'true'
    }, {
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        timeout: REQUEST_TIMEOUT_MS
    });

    return {
        success: response.data?.status === 'Success',
        message: response.data?.remarks || 'Cancellation processed'
    };
}

module.exports = {
    findRetailerWithCredentials,
    canPoll,
    trackShipment,
    validateAwb,
    verifyCredentials,
    parseTrackingResponse,
    parseWebhookPayload,
    mapDelhiveryStatusToOrderStatus,
    invalidateTokenCache,
    buildTokenEndpoint,
    STATUS_TYPE_LABELS,
    CREDENTIAL_SELECT,
    SANDBOX_ENABLED,
    // New fulfillment APIs
    checkServiceability,
    calculateFreight,
    createShipment,
    getShippingLabel,
    requestPickup,
    cancelShipment,
    getBaseUrl
};

