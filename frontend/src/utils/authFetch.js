// Drop-in replacement for the global `fetch` for authenticated API calls.
//
// Plain `fetch()` calls that manually attach `Authorization: Bearer <token>`
// never benefit from the silent-refresh flow AuthContext sets up for axios
// (see the response interceptor in src/context/AuthContext.js): once the
// 15-minute access token expires, they just 401 instead of transparently
// swapping in a fresh token. authFetch mirrors that interceptor for call
// sites that use fetch instead of axios.
//
// Same signature and return type as fetch() -- callers keep their existing
// `response.ok` / `response.json()` handling unchanged.

const BACKEND_URL = process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080';

let refreshPromise = null;

function requestLogout() {
	window.dispatchEvent(new Event('auth:logout'));
}

function refreshAccessToken() {
	if (!refreshPromise) {
		refreshPromise = fetch(`${BACKEND_URL}/api/auth/refresh-token`, {
			method: 'POST',
			credentials: 'include',
		})
			.then(async (res) => {
				if (!res.ok) {
					const err = new Error('Refresh failed');
					err.status = res.status;
					throw err;
				}
				const data = await res.json();
				localStorage.setItem('token', data.token);
				return data.token;
			})
			.catch((err) => {
				// Only a definitive 401 (refresh token itself invalid/expired) means
				// the session is actually over -- a 429/5xx/network blip shouldn't
				// force a logout, just fail this one retry.
				if (err.status === 401) requestLogout();
				throw err;
			})
			.finally(() => {
				refreshPromise = null;
			});
	}
	return refreshPromise;
}

export async function authFetch(url, options = {}) {
	const attach = (token) => ({
		...options,
		credentials: options.credentials ?? 'include',
		headers: {
			...options.headers,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	});

	const token = localStorage.getItem('token');
	const response = await fetch(url, attach(token));

	const isAuthExempt = url.includes('/api/auth/login')
		|| url.includes('/api/auth/refresh-token')
		|| url.includes('/api/auth/register');

	if (response.status !== 401 || !token || isAuthExempt) {
		return response;
	}

	try {
		const newToken = await refreshAccessToken();
		return await fetch(url, attach(newToken));
	} catch {
		// Refresh failed -- return the original 401 so the caller's existing
		// error-handling path runs exactly as it did before.
		return response;
	}
}
