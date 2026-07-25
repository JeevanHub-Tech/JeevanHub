import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

// Keeps a flat set of filter values synced with the URL query string, so
// navigating to a detail page and back (or reloading, or sharing the link)
// restores the same filters instead of resetting to defaults — list screens
// unmount when you navigate to /medicines/:id or /doctor-detail, so any
// filter state kept only in useState is lost the moment you go back.
//
// Values equal to their default are omitted from the URL to keep it clean.
export function useUrlFilters(defaults) {
	const [searchParams, setSearchParams] = useSearchParams();

	const values = useMemo(() => {
		const result = {};
		for (const key of Object.keys(defaults)) {
			result[key] = searchParams.has(key) ? searchParams.get(key) : defaults[key];
		}
		return result;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	const setFilters = useCallback(
		(patch) => {
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev);
					for (const [key, value] of Object.entries(patch)) {
						if (value === undefined || value === null || value === "" || value === defaults[key]) {
							next.delete(key);
						} else {
							next.set(key, value);
						}
					}
					return next;
				},
				{ replace: true },
			);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[setSearchParams],
	);

	const setFilter = useCallback((key, value) => setFilters({ [key]: value }), [setFilters]);

	const resetFilters = useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [setSearchParams]);

	return { values, setFilter, setFilters, resetFilters };
}
