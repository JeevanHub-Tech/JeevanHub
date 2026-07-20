import { getDefaultCartItems, getCheckoutCartUrl } from './cartData';

describe('cart response helpers', () => {
	 test('reads checkout items from the API defaultCart response', () => {
		expect(getDefaultCartItems({
			defaultCart: {
				items: [{ _id: 'item-1', quantity: 2 }]
			}
		})).toEqual([{ _id: 'item-1', quantity: 2 }]);
	});

	 test('returns an empty list for an empty or malformed cart response', () => {
		expect(getDefaultCartItems({ defaultCart: null })).toEqual([]);
		expect(getDefaultCartItems(null)).toEqual([]);
	});

	 test('requests only the default cart for checkout', () => {
		expect(getCheckoutCartUrl('patient-1')).toBe('/api/cart/patient-1?scope=default');
	});
});
