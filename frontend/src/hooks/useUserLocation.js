import { useCallback, useEffect, useState } from "react";

import { OPENCAGE_API_KEY } from "../config";

const STORAGE_KEY = "jh_location_override";

function readStoredOverride() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

// Shared by every navbar (public + dashboard): resolves the visitor's city via
// browser geolocation + OpenCage reverse-geocoding, falling back to a static
// label whenever permission is denied, the API key is missing, or the lookup fails.
// A manually-entered pincode (Amazon-style "deliver to") always wins once set,
// since it's an explicit user choice — it's persisted in localStorage so it
// survives reloads without needing to re-prompt geolocation.
// `savedLocation` (e.g. the signed-in patient's own saved address/PIN code) is
// the next-best source when present, since it needs no browser permission
// prompt and is already known to be accurate for that user.
function useUserLocation(fallback = "Your location", savedLocation = null) {
	const [override, setOverride] = useState(readStoredOverride);
	const [detected, setDetected] = useState(savedLocation || fallback);
	const [pincodeStatus, setPincodeStatus] = useState("idle"); // idle | loading | error

	useEffect(() => {
		if (override || savedLocation) {
			if (savedLocation) setDetected(savedLocation);
			return;
		}
		if (!navigator.geolocation || !OPENCAGE_API_KEY) return;

		navigator.geolocation.getCurrentPosition(
			async ({ coords }) => {
				try {
					const response = await fetch(
						`https://api.opencagedata.com/geocode/v1/json?q=${coords.latitude}+${coords.longitude}&key=${OPENCAGE_API_KEY}`,
					);
					const data = await response.json();
					const components = data.results?.[0]?.components;
					setDetected(components?.city || components?.town || fallback);
				} catch {
					setDetected(fallback);
				}
			},
			() => setDetected(fallback),
			{ maximumAge: 300000, timeout: 5000 },
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [savedLocation, override]);

	const setManualPincode = useCallback(async (pincode) => {
		if (!/^\d{6}$/.test(pincode)) {
			setPincodeStatus("error");
			return false;
		}
		setPincodeStatus("loading");
		try {
			let label = pincode;
			if (OPENCAGE_API_KEY) {
				const response = await fetch(
					`https://api.opencagedata.com/geocode/v1/json?q=${pincode}&countrycode=in&key=${OPENCAGE_API_KEY}`,
				);
				const data = await response.json();
				const components = data.results?.[0]?.components;
				const city =
					components?.city ||
					components?.town ||
					components?.village ||
					components?.suburb ||
					components?.city_district ||
					components?.state_district ||
					components?.county;
				if (city) label = `${city} ${pincode}`;
			}
			const next = { label, pincode };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			setOverride(next);
			setPincodeStatus("idle");
			return true;
		} catch {
			setPincodeStatus("error");
			return false;
		}
	}, []);

	const clearManualPincode = useCallback(() => {
		localStorage.removeItem(STORAGE_KEY);
		setOverride(null);
	}, []);

	return {
		location: override?.label || detected,
		pincode: override?.pincode || "",
		setManualPincode,
		clearManualPincode,
		pincodeStatus,
	};
}

export { useUserLocation };
