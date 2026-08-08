// Converts a YouTube watch/share URL into an embeddable player URL.
// Returns null for anything that isn't a specific video (e.g. the
// search-results fallback link used when no video could be resolved) --
// YouTube blocks embedding search-results pages, so those never render.
export function getYouTubeEmbedUrl(link) {
	if (!link) return null;
	try {
		const u = new URL(link);
		const host = u.hostname.replace(/^www\./, "");

		if (host === "youtu.be") {
			const id = u.pathname.slice(1);
			return id ? `https://www.youtube.com/embed/${id}` : null;
		}

		if (host === "youtube.com" || host === "m.youtube.com") {
			if (u.pathname === "/watch") {
				const id = u.searchParams.get("v");
				return id ? `https://www.youtube.com/embed/${id}` : null;
			}
			if (u.pathname.startsWith("/embed/")) return link;
		}

		return null;
	} catch {
		return null;
	}
}

// Fallback for asanas with no video link at all (doctor typed a name only,
// or record predates auto-fetch) -- a search link beats no link.
export function buildYoutubeSearchUrl(name) {
	return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} yoga asana tutorial`)}`;
}
