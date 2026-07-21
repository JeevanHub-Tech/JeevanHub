import { useEffect, useState } from "react";

import { OPENCAGE_API_KEY } from "../config";

// Shared by every navbar (public + dashboard): resolves the visitor's city via
// browser geolocation + OpenCage reverse-geocoding, falling back to a static
// label whenever permission is denied, the API key is missing, or the lookup fails.
function useUserLocation(fallback = "Your location") {
	const [location, setLocation] = useState(fallback);

	useEffect(() => {
		if (!navigator.geolocation || !OPENCAGE_API_KEY) return;

		navigator.geolocation.getCurrentPosition(
			async ({ coords }) => {
				try {
					const response = await fetch(
						`https://api.opencagedata.com/geocode/v1/json?q=${coords.latitude}+${coords.longitude}&key=${OPENCAGE_API_KEY}`,
					);
					const data = await response.json();
					const components = data.results?.[0]?.components;
					setLocation(components?.city || components?.town || fallback);
				} catch {
					setLocation(fallback);
				}
			},
			() => setLocation(fallback),
			{ maximumAge: 300000, timeout: 5000 },
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return location;
}

export { useUserLocation };
