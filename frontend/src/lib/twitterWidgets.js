let widgetsPromise = null;

// Twitter/X's widgets.js is what actually turns a <blockquote class="twitter-tweet">
// into the real embedded tweet iframe. It must be loaded once (shared between the
// editor's live preview and the public blog detail page) and re-run via
// window.twttr.widgets.load() whenever new tweet blockquotes are added to the DOM.
export function loadTwitterWidgets() {
	if (window.twttr?.widgets) return Promise.resolve(window.twttr);
	if (widgetsPromise) return widgetsPromise;

	widgetsPromise = new Promise((resolve, reject) => {
		const existing = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
		if (existing) {
			existing.addEventListener("load", () => resolve(window.twttr));
			existing.addEventListener("error", reject);
			return;
		}
		const script = document.createElement("script");
		script.src = "https://platform.twitter.com/widgets.js";
		script.async = true;
		script.onload = () => resolve(window.twttr);
		script.onerror = reject;
		document.body.appendChild(script);
	});

	return widgetsPromise;
}

export function renderTwitterEmbeds(container) {
	loadTwitterWidgets()
		.then((twttr) => twttr?.widgets?.load(container))
		.catch(() => {
			// Twitter's CDN being unreachable shouldn't break the rest of the page —
			// the raw blockquote link still renders as a fallback.
		});
}

export function isTwitterUrl(url) {
	return /^https?:\/\/(www\.)?(twitter|x)\.com\/[^/]+\/status\/\d+/i.test(url);
}

export function extractYouTubeId(url) {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
	];
	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) return match[1];
	}
	// Allow pasting a bare video ID too.
	if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
	return null;
}
