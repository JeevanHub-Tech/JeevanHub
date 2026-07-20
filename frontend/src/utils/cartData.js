export const getDefaultCartItems = (responseData) => {
	const items = responseData?.defaultCart?.items;
	return Array.isArray(items) ? items : [];
};

export const getCheckoutCartUrl = (patientId) =>
	`/api/cart/${encodeURIComponent(patientId)}?scope=default`;
