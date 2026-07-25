const TTL_MS = 30 * 1000;
const cache = new Map(); // key -> { data, expiresAt }

// Caches the result of a DB fetch briefly so rapid keystrokes
// during typeahead search don't each trigger a full collection scan.
async function getCached(key, fetchFn) {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.data;

  const data = await fetchFn();
  cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
  return data;
}

module.exports = { getCached };
