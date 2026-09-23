// Diagnostic probe for the Delhivery OAuth2 / MCP credential method.
//
// Reads credentials from the environment ONLY -- no secret is written into this
// file. Run it whenever a retailer reports "Delhivery OAuth2 authentication
// failed" to find out whether the fault is our URL, their realm, or their
// client secret.
//
//   D1_AUTH_URL=... D1_REALM=... D1_CLIENT_ID=... D1_CLIENT_SECRET=... \
//     node scripts/probe.delhiveryAuth.js
//
// How to read the result:
//   404 RESTEASY003210 ....... our URL is not a token endpoint (our bug)
//   404 Realm does not exist . URL shape fine, the realm is not on that host
//   400 invalid_client ....... URL and realm both fine, credentials rejected
//   200 + access_token ....... everything is valid
require('dotenv').config();
const axios = require('axios');
const { encrypt } = require('../utils/encryption');
const delhivery = require('../services/delhiveryService');

const AUTH_URL = process.env.D1_AUTH_URL;
const REALM = process.env.D1_REALM;
const CLIENT_ID = process.env.D1_CLIENT_ID;
const CLIENT_SECRET = process.env.D1_CLIENT_SECRET;

const brief = (err) => {
    if (!err.response) return `${err.code || ''} ${err.message}`.trim();
    const b = err.response.data;
    const body = typeof b === 'string' ? b : JSON.stringify(b);
    return `HTTP ${err.response.status} :: ${body.slice(0, 180)}`;
};

const post = async (url, body) => {
    try {
        const r = await axios.post(url, new URLSearchParams(body).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 12000
        });
        return `HTTP ${r.status} :: got ${r.data.token_type} token, expires_in=${r.data.expires_in}`;
    } catch (e) {
        return brief(e);
    }
};

let failures = 0;
const check = (label, actual, expected) => {
    const ok = actual === expected;
    if (!ok) failures += 1;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}`);
    if (!ok) console.log(`       expected ${expected}\n       actual   ${actual}`);
};

(async () => {
    // --- 1. The URL builder, offline -----------------------------------------
    console.log('[1] buildTokenEndpoint');
    const TOKEN_PATH = '/protocol/openid-connect/token';
    check('base + realm',
        delhivery.buildTokenEndpoint('https://ucp-auth.delhivery.com/holyknight', 'r1'),
        `https://ucp-auth.delhivery.com/holyknight/realms/r1${TOKEN_PATH}`);
    check('trailing slashes stripped',
        delhivery.buildTokenEndpoint('https://a.example.com///', 'r1'),
        `https://a.example.com/realms/r1${TOKEN_PATH}`);
    check('full token URL pasted -> used as-is',
        delhivery.buildTokenEndpoint(`https://a.example.com/realms/r9${TOKEN_PATH}`, 'ignored'),
        `https://a.example.com/realms/r9${TOKEN_PATH}`);
    check('/realms/<realm> pasted -> path appended once',
        delhivery.buildTokenEndpoint('https://a.example.com/realms/r9', 'ignored'),
        `https://a.example.com/realms/r9${TOKEN_PATH}`);
    check('realm is url-encoded',
        delhivery.buildTokenEndpoint('https://a.example.com', 'a b/c'),
        `https://a.example.com/realms/a%20b%2Fc${TOKEN_PATH}`);
    for (const [label, args] of [['empty auth URL', ['   ', 'r1']], ['missing realm', ['https://a.example.com', '']]]) {
        try {
            delhivery.buildTokenEndpoint(...args);
            console.log(`  FAIL ${label} should throw`);
            failures += 1;
        } catch {
            console.log(`  ok   ${label} throws`);
        }
    }

    if (!CLIENT_ID || !CLIENT_SECRET || !AUTH_URL || !REALM) {
        console.log('\nSet D1_AUTH_URL / D1_REALM / D1_CLIENT_ID / D1_CLIENT_SECRET for the live checks.');
        process.exit(failures ? 1 : 0);
    }

    // --- 2. Does the realm exist? (no real credentials sent) -----------------
    // "Realm does not exist" vs "invalid_client" is the whole diagnosis: the
    // second means the path resolved and Keycloak actually judged credentials.
    console.log('\n[2] Does the realm exist on this host? (dummy credentials)');
    const origin = new URL(AUTH_URL).origin;
    for (const realm of [REALM, 'master']) {
        const url = delhivery.buildTokenEndpoint(AUTH_URL, realm);
        console.log(`  realm="${realm}"\n     ${await post(url, { grant_type: 'client_credentials', client_id: 'probe', client_secret: 'probe' })}`);
    }

    // --- 3. The retailer's real credentials, both URL layouts ----------------
    console.log('\n[3] Real credentials');
    for (const base of [AUTH_URL, origin]) {
        const url = delhivery.buildTokenEndpoint(base, REALM);
        console.log(`  ${url}\n     ${await post(url, { grant_type: 'client_credentials', client_id: CLIENT_ID, client_secret: CLIENT_SECRET })}`);
    }

    // --- 4. Through the real service, exactly as the ship button does --------
    // Proves what a retailer now sees in the UI, rather than what a probe sees.
    console.log('\n[4] Same credentials via trackShipment() -- the message the UI will show');
    if (!/^[0-9a-f]{64}$/i.test(process.env.DELHIVERY_ENCRYPTION_KEY || '')) {
        console.log('  skipped: DELHIVERY_ENCRYPTION_KEY is not set');
    } else {
        const fakeRetailer = {
            _id: 'probe-retailer',
            shippingIntegrations: {
                delhivery: {
                    isConfigured: true,
                    method: 'oauth2',
                    oauth2ClientId: encrypt(CLIENT_ID),
                    oauth2ClientSecret: encrypt(CLIENT_SECRET),
                    oauth2AuthUrl: encrypt(AUTH_URL),
                    oauth2Realm: encrypt(REALM)
                }
            }
        };
        try {
            const r = await delhivery.trackShipment(fakeRetailer, '1234567890123');
            console.log(`  unexpected success: ${r.currentStatus}`);
        } catch (e) {
            console.log(`  ${e.message}`);
        }
    }

    console.log(failures ? `\n${failures} offline check(s) FAILED` : '\nAll offline checks pass.');
    process.exit(failures ? 1 : 0);
})();
