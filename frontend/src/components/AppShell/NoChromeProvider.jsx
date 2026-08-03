import { createContext, useContext, useMemo } from "react";
import { useLocation, matchPath } from "react-router-dom";

const NoChromeContext = createContext(false);

// Central registry of routes that render without the public/dashboard navbar
// and footer: auth screens (avoid duplicate branding) and full-page content
// editors (distraction-free). Add a path pattern here instead of hand-wiring
// another check into AppChrome every time a new chrome-free screen ships.
// Patterns support react-router's :param syntax via matchPath.
const NO_CHROME_PATTERNS = [
	"/signin",
	"/signup",
	"/admin/login",
	"/signup-patient",
	"/signup-doctor",
	"/signup-retailer",
	"/health-blogs/new",
	"/health-blogs/edit/:id",
	"/admin/blogs/new",
	"/admin/blogs/update/:id",
	"/blog/:id",
];

// Computed synchronously from the current route (not registered via effect),
// so there's no chrome flash on navigation into/out of a no-chrome page.
function NoChromeProvider({ children }) {
	const location = useLocation();
	const noChrome = useMemo(
		() => NO_CHROME_PATTERNS.some((pattern) => matchPath(pattern, location.pathname)),
		[location.pathname],
	);
	return <NoChromeContext.Provider value={noChrome}>{children}</NoChromeContext.Provider>;
}

function useNoChrome() {
	return useContext(NoChromeContext);
}

export { NoChromeProvider, useNoChrome, NO_CHROME_PATTERNS };
