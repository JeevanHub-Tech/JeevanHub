import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { authFetch } from '../utils/authFetch';
import { BACKEND_URL } from '../config';

export const CartContext = createContext();

export function CartProvider({ children }) {
	const { auth, loading: authLoading } = useContext(AuthContext);
	const [cartCount, setCartCount] = useState(0);

	const patientId = auth?.user?.id;
	const token = localStorage.getItem('token');

	const fetchCartCount = useCallback(async () => {
		if (!patientId || !token) {
			setCartCount(0);
			return;
		}

		try {
			const response = await authFetch(
				`${BACKEND_URL}/api/cart/${patientId}?scope=default`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					}
				}
			);

			if (response.ok) {
				const data = await response.json();
				const items = data.defaultCart?.items || [];
				const count = items.reduce((total, item) => total + item.quantity, 0);
				setCartCount(count);
			}
		} catch (err) {
			console.error('Error fetching cart count:', err);
		}
	}, [patientId, token]);

	// Fetch count when the authenticated user changes
	useEffect(() => {
		if (!authLoading) {
			if (auth?.role === 'patient' && patientId) {
				fetchCartCount();
			} else {
				setCartCount(0);
			}
		}
	}, [authLoading, auth?.role, patientId, fetchCartCount]);

	return (
		<CartContext.Provider value={{ cartCount, setCartCount, fetchCartCount }}>
			{children}
		</CartContext.Provider>
	);
}

export function useCart() {
	const context = useContext(CartContext);
	if (!context) {
		throw new Error('useCart must be used within a CartProvider');
	}
	return context;
}
