import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './OrderHistory.css';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from "react-router-dom";
import { Star, Loader2, AlertCircle, PackageSearch } from "lucide-react";
import { BACKEND_URL } from '../../config';

const API_BASE_URL = `${BACKEND_URL}`;
const img = "https://images.unsplash.com/photo-1638310526160-ce17611bffff?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const OrderHistory = () => {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const { auth } = useContext(AuthContext);
	const userId = auth?.user?.id;
	const navigate = useNavigate();

	useEffect(() => {
		const fetchOrders = async () => {
			try {
				setLoading(true);
				const response = await axios.get(`${API_BASE_URL}/api/orders/getOrdersByBuyerId/${userId}`, {
					headers: { Authorization: `Bearer ${auth.token}` }
				});
				setOrders(response.data.orders || []);
				setLoading(false);
			} catch (error) {
				if (error.response?.status === 404) {
					// No orders yet -- not a failure, just an empty list.
					setOrders([]);
				} else {
					console.error('Error fetching orders:', error);
					setError('Failed to load your orders. Please try again later.');
				}
				setLoading(false);
			}
		};

		if (userId) fetchOrders();
	}, [userId, auth.token]);

	// Function to format date
	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	// Function to handle image paths
	const getImageUrl = (imagePath) => {
		if (!imagePath) {
			// No image provided → use Unsplash random fallback
			return img;
		}

		// Handle different image path scenarios
		if (imagePath.startsWith('http')) {
			// Already a full URL
			return imagePath;
		} else if (imagePath.startsWith('/')) {
			// Absolute path from root
			return `${API_BASE_URL}${imagePath}`;
		} else {
			// Relative path
			return `${API_BASE_URL}/${imagePath}`;
		}
	};

	return (
		<div className="order-history-page">
			<header className="oh-header">
				<h1>Your Orders</h1>
				<span className="oh-header__accent" aria-hidden="true" />
				{!loading && !error && orders.length > 0 && (
					<p className="oh-header__count">
						{orders.length} order{orders.length === 1 ? '' : 's'} placed
					</p>
				)}
			</header>

			{loading ? (
				<div className="oh-status-container">
					<Loader2 className="oh-spinner" size={40} />
					<p>Loading your orders...</p>
				</div>
			) : error ? (
				<div className="oh-status-container">
					<AlertCircle size={40} className="oh-status-icon oh-status-icon--danger" />
					<p>{error}</p>
				</div>
			) : orders.length === 0 ? (
				<div className="oh-empty">
					<PackageSearch size={40} className="oh-empty__icon" />
					<h2>No orders yet</h2>
					<p>Medicines you order will show up here so you can track them from purchase to delivery.</p>
					<button
						onClick={() => navigate('/medicines')}
						className="oh-btn oh-btn--primary"
					>
						Shop Now
					</button>
				</div>
			) : (
				<div className="oh-orders">
					{orders.map((order) => (
						<div key={order._id} className="oh-card">
							<div className="oh-card__strip">
								<div className="oh-card__meta">
									<div className="oh-card__meta-item">
										<span className="oh-card__meta-label">Order placed</span>
										<span className="oh-card__meta-value">{formatDate(order.createdAt)}</span>
									</div>
									<div className="oh-card__meta-item">
										<span className="oh-card__meta-label">Total</span>
										<span className="oh-card__meta-value">₹{(Number(order.totalPrice) || 0).toFixed(2)}</span>
									</div>
									<div className="oh-card__meta-item oh-card__meta-item--id">
										<span className="oh-card__meta-label">Order #</span>
										<span className="oh-card__meta-value">{order._id.slice(-6)}</span>
									</div>
								</div>
								<span className={`oh-status oh-status--${order.orderStatus}`}>
									{order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
								</span>
							</div>

							<div className="oh-card__body">
								{order.retailers?.length > 0 && (
									<p className="oh-card__retailer">Sold by {order.retailers.join(', ')}</p>
								)}

								<ul className="oh-items">
									{order.items.map((item, index) => {
										const medicineImage = item.medicineId?.images?.[0];
										return (
											<li key={index} className="oh-item">
												<div className="oh-item__image">
													{medicineImage ? (
														<img
															src={getImageUrl(medicineImage)}
															alt={item.medicineId?.name}
															onError={(e) => {
																e.target.onerror = null;
																e.target.src = img;
															}}
														/>
													) : (
														<img
															src={img}
															alt={item.medicineId?.name}
														/>
													)}
												</div>
												<div className="oh-item__details">
													<p className="oh-item__name">{item.medicineId?.name}</p>
													<p className="oh-item__price">
														₹{(Number(item.medicineId?.price) || 0).toFixed(2)} × {item.quantity}
													</p>
												</div>
												<p className="oh-item__subtotal">
													₹{(Number(item.subTotal) || 0).toFixed(2)}
												</p>
											</li>
										);
									})}
								</ul>

								{order.orderStatus.toLowerCase() === "delivered" && order.review && (
									<div className="oh-feedback">
										<h4>Your feedback</h4>
										<div className="oh-feedback__stars">
											{[1, 2, 3, 4, 5].map((i) => (
												<Star
													key={i}
													size={16}
													fill={i <= order.review.rating ? "currentColor" : "none"}
													className={i <= order.review.rating ? "oh-feedback__star oh-feedback__star--filled" : "oh-feedback__star"}
												/>
											))}
										</div>
										{order.review.comment && (
											<p className="oh-feedback__comment">{order.review.comment}</p>
										)}
										{order.review.deliveredAt && (
											<p className="oh-feedback__delivered">
												Delivered on {new Date(order.review.deliveredAt).toLocaleDateString()}
											</p>
										)}
									</div>
								)}

								<div className="oh-card__footer">
									<div className="oh-card__payment">
										<p>
											<span>Payment method</span>
											{order.paymentMethod === 'cashOnDelivery' ? 'Cash On Delivery' : 'Online Payment'}
										</p>
										<p>
											<span>Payment status</span>
											{order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
										</p>
									</div>

									{order.orderStatus.toLowerCase() === "shipped" && (
										<button
											className="oh-btn oh-btn--primary"
											onClick={() => navigate(`/BuyerFeedback/${order._id}`)}
										>
											Update Order Status
										</button>
									)}

									{order.orderStatus.toLowerCase() === "delivered" && (
										<button
											className="oh-btn oh-btn--secondary"
											onClick={() => navigate(`/BuyerFeedback/${order._id}`)}
										>
											Update Feedback
										</button>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default OrderHistory;
