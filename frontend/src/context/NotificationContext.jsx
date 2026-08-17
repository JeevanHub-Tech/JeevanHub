import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { authFetch } from '../utils/authFetch';
import { BACKEND_URL } from '../config';

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
	const { auth, loading: authLoading } = useContext(AuthContext);
	const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

	const fetchNotificationCount = useCallback(async () => {
		if (!auth?.token) {
			setUnreadNotificationsCount(0);
			return;
		}

		try {
			const response = await authFetch(`${BACKEND_URL}/api/notifications`, {
				method: "GET",
				headers: { "Content-Type": "application/json" },
			});
			if (response.ok) {
				const data = await response.json();
				const count = data.filter((n) => !n.isRead).length;
				setUnreadNotificationsCount(count);
			}
		} catch (err) {
			console.error("Error fetching notification count:", err);
		}
	}, [auth?.token]);

	useEffect(() => {
		if (!authLoading) {
			if (auth?.token) {
				fetchNotificationCount();
				const interval = setInterval(fetchNotificationCount, 30000);
				return () => clearInterval(interval);
			} else {
				setUnreadNotificationsCount(0);
			}
		}
	}, [authLoading, auth?.token, fetchNotificationCount]);

	return (
		<NotificationContext.Provider value={{ unreadNotificationsCount, setUnreadNotificationsCount, fetchNotificationCount }}>
			{children}
		</NotificationContext.Provider>
	);
}

export function useNotification() {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error('useNotification must be used within a NotificationProvider');
	}
	return context;
}
