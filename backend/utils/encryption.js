// utils/encryption.js
//
// Authenticated symmetric encryption for third-party credentials we have to
// store at rest (currently retailers' Delhivery API tokens / OAuth2 secrets).
//
// AES-256-GCM rather than plain AES-CBC so a tampered ciphertext fails loudly
// on decrypt instead of silently yielding garbage that we'd then send to
// Delhivery as an auth header.
//
// Stored format is "iv:authTag:ciphertext", all hex. The `:` separator is safe
// because every segment is hex-encoded and can never contain a colon.

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96-bit nonce -- the size GCM is specified for
const KEY_LENGTH = 32;  // 256-bit key => 64 hex chars

// Read the key lazily (not at require time) so importing this module in a
// process that never encrypts anything doesn't hard-crash on a missing env var.
function getKey() {
    const hex = process.env.DELHIVERY_ENCRYPTION_KEY;
    if (!hex) {
        throw new Error(
            'DELHIVERY_ENCRYPTION_KEY is not set. Generate one with: ' +
            'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
    }
    if (!/^[0-9a-fA-F]{64}$/.test(hex.trim())) {
        throw new Error('DELHIVERY_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)');
    }
    const key = Buffer.from(hex.trim(), 'hex');
    if (key.length !== KEY_LENGTH) {
        throw new Error('DELHIVERY_ENCRYPTION_KEY must decode to 32 bytes');
    }
    return key;
}

/**
 * Encrypts a plaintext string.
 * @param {string} plaintext
 * @returns {string|null} "iv_hex:authTag_hex:ciphertext_hex", or null for empty input
 */
function encrypt(plaintext) {
    if (plaintext === null || plaintext === undefined || plaintext === '') return null;
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const ciphertext = Buffer.concat([
        cipher.update(String(plaintext), 'utf8'),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

/**
 * Decrypts a string produced by encrypt().
 * @param {string} payload
 * @returns {string|null} the original plaintext, or null for empty input
 * @throws if the payload is malformed or has been tampered with
 */
function decrypt(payload) {
    if (payload === null || payload === undefined || payload === '') return null;
    const parts = String(payload).split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted payload: expected "iv:authTag:ciphertext"');
    }
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    return Buffer.concat([
        decipher.update(Buffer.from(ciphertextHex, 'hex')),
        decipher.final()
    ]).toString('utf8');
}

/**
 * True if a stored value looks like something encrypt() produced. Used to give
 * a clearer error than "unable to authenticate data" when a credential was
 * written to the DB before encryption was wired up, or under a different key.
 */
function isEncrypted(value) {
    if (!value || typeof value !== 'string') return false;
    const parts = value.split(':');
    return parts.length === 3 && parts.every(p => /^[0-9a-f]+$/i.test(p) && p.length > 0);
}

/**
 * Shows only the last few characters of a secret, for confirmation UI
 * ("token ending ...a1b2") without ever sending the secret to the client.
 */
function maskTail(plaintext, visible = 4) {
    if (!plaintext) return null;
    const s = String(plaintext);
    if (s.length <= visible) return '•'.repeat(s.length);
    return `${'•'.repeat(Math.min(8, s.length - visible))}${s.slice(-visible)}`;
}

module.exports = { encrypt, decrypt, isEncrypted, maskTail };
