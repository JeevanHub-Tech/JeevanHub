const Fuse = require('fuse.js');

const DEFAULT_OPTIONS = {
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
  distance: 100,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

// keys: string[] | { name: string, weight: number }[]
function fuzzySearch(docs, keys, query, options = {}) {
  if (!query || !Array.isArray(docs) || docs.length === 0) return [];

  const fuse = new Fuse(docs, {
    ...DEFAULT_OPTIONS,
    ...options,
    keys,
  });

  return fuse.search(query);
}

module.exports = { fuzzySearch };
