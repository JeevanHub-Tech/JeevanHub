/**
 * Config for the Gemini prescription-OCR agent. Kept separate from the
 * doctor-match agent's config so the two can be tuned independently.
 */
const bool = (v, d) => (v === undefined || v === '' ? d : String(v).toLowerCase() === 'true');
const num = (v, d) => (v === undefined || v === '' || isNaN(Number(v)) ? d : Number(v));

module.exports = {
  PRESCRIPTION_OCR_ENABLED: bool(process.env.PRESCRIPTION_OCR_ENABLED, true),

  // '-latest' aliases don't go stale the way pinned gemini-2.5-* ids did.
  // Smallest/cheapest tier (flash-lite) -- keep AI usage conservative and low-cost.
  PRESCRIPTION_OCR_MODEL: process.env.PRESCRIPTION_OCR_MODEL || 'gemini-flash-lite-latest',

  // Defensive bound on the file fetched from Cloudinary before base64-encoding it.
  PRESCRIPTION_OCR_MAX_FILE_BYTES: num(process.env.PRESCRIPTION_OCR_MAX_FILE_BYTES, 10 * 1024 * 1024),
};
