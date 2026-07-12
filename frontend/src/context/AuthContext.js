// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const BACKEND_URL = process.env.REACT_APP_AYURVEDA_BACKEND_URL || 'http://localhost:8080';

// The refresh-token cookie is httpOnly and scoped to /api/auth, so every
// request needs to carry credentials for the silent-refresh flow to work.
axios.defaults.withCredentials = true;

function AuthProvider({ children }) {
	const [auth, setAuth] = useState({
		token: localStorage.getItem('token'),
		user: null,
		role: localStorage.getItem('role') || 'guest',
	});

	// True until the initial /api/auth/user bootstrap check settles. A stored
	// token means `auth.user` is legitimately null for a moment while it's
	// being verified -- that is NOT the same thing as "not logged in", so
	// route guards must wait for this instead of treating null-user as guest.
	const [loading, setLoading] = useState(true);

	// Interceptor closures below run outside React's render cycle, so they need
	// a ref to read the *current* auth instead of a stale one from mount time.
	const authRef = useRef(auth);
	useEffect(() => { authRef.current = auth; }, [auth]);

	const logout = useCallback(() => {
		setAuth({ token: null, user: null, role: 'guest' });
		localStorage.removeItem('token');
		localStorage.removeItem('role');
		// Best-effort: clear the refresh-token cookie server-side too. Local
		// logout must not block on this.
		axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true }).catch(() => {});
	}, []);

	// Shared across concurrent 401s so they trigger exactly one refresh call.
	const refreshPromiseRef = useRef(null);
	const refreshAccessToken = useCallback(() => {
		if (!refreshPromiseRef.current) {
			refreshPromiseRef.current = axios
				.post(`${BACKEND_URL}/api/auth/refresh-token`, {}, { withCredentials: true })
				.then((res) => {
					const newToken = res.data.token;
					localStorage.setItem('token', newToken);
					setAuth((prev) => ({ ...prev, token: newToken }));
					return newToken;
				})
				.catch((err) => {
					// Only a definitive "this refresh token is invalid/expired" (401)
					// means the session is actually over. A 429 (rate limit), a 5xx,
					// or a dropped connection is transient -- logging the user out on
					// those turns a momentary blip into a forced re-login.
					if (err.response?.status === 401) {
						logout();
					}
					throw err;
				})
				.finally(() => {
					refreshPromiseRef.current = null;
				});
		}
		return refreshPromiseRef.current;
	}, [logout]);

	// authFetch (src/utils/authFetch.js) covers fetch()-based call sites that
	// can't reach this component's `logout` directly; it signals a definitive
	// refresh failure via this event instead.
	useEffect(() => {
		const onAuthLogout = () => logout();
		window.addEventListener('auth:logout', onAuthLogout);
		return () => window.removeEventListener('auth:logout', onAuthLogout);
	}, [logout]);

	// Transparently swap an expired access token for a fresh one via the
	// refresh-token cookie instead of forcing the user back to the login page.
	useEffect(() => {
		const interceptorId = axios.interceptors.response.use(
			(response) => response,
			async (error) => {
				const { config, response } = error;
				const url = config?.url || '';
				const isAuthExempt = url.includes('/api/auth/login')
					|| url.includes('/api/auth/refresh-token')
					|| url.includes('/api/auth/register');

				if (response?.status === 401 && config && !config._retry && !isAuthExempt && authRef.current.token) {
					config._retry = true;
					try {
						const newToken = await refreshAccessToken();
						config.headers = { ...config.headers, Authorization: `Bearer ${newToken}` };
						return axios(config);
					} catch (refreshError) {
						return Promise.reject(refreshError);
					}
				}
				return Promise.reject(error);
			}
		);

		return () => axios.interceptors.response.eject(interceptorId);
	}, [refreshAccessToken]);

	useEffect(() => {
		const fetchUser = async () => {
			if (auth.token) {
				try {
					const response = await axios.get(`${BACKEND_URL}/api/auth/user`, {
						headers: { Authorization: `Bearer ${auth.token}` },
					});
					setAuth((prev) => ({ ...prev, user: response.data.user, role: response.data.user.role }));
				} catch (error) {
					// A 401 here is retried transparently by the interceptor above; if it
					// still fails (refresh token also expired/invalid), logout() already ran.
					console.error('Error fetching user:', error);
				}
			} else if (auth.role !== 'guest' || localStorage.getItem('role')) {
				setAuth({ token: null, user: null, role: 'guest' });
				localStorage.removeItem('role');
			}
			setLoading(false);
		};

		fetchUser();
	}, [auth.token, auth.role]);

	return (
		<AuthContext.Provider value={{ auth, setAuth, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
}

export default AuthProvider;
