import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShoppingBag, AlertCircle, Minus, Plus, Trash2 } from "lucide-react";
import "./Cart.css";
import { AuthContext } from "../context/AuthContext";
import { authFetch } from "../utils/authFetch";

// Olive-tinted botanical placeholder, used when a medicine has no image or
// the image URL fails to load — keeps the fallback on-brand instead of a
// generic gray box or an external placeholder.com request.
const FALLBACK_IMAGE =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23556b2f" stroke-width="1.5"><path d="M12 2C9 6 6 9 6 13a6 6 0 0 0 12 0c0-4-3-7-6-11Z"/><path d="M12 13v9"/></svg>';

const CartScreen = () => {
	const navigate = useNavigate();
	const { auth } = useContext(AuthContext);

	const [cartItems, setCartItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const patientId = auth?.user?.id;
	const token = localStorage.getItem('token');

	// --- 1. Fetch Cart from Backend ---
	useEffect(() => {
		const fetchCart = async () => {
			if (!patientId) {
				setLoading(false);
				return;
			}

			try {
				const response = await authFetch(
					`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/cart/${patientId}`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						}
					}
				);

				if (!response.ok) {
					const errData = await response.json().catch(() => ({}));
					throw new Error(errData.message || "Failed to fetch cart");
				}

				const data = await response.json();

				// Check structure and set items
				const items = data.cartItems ? data.cartItems.items : [];
				setCartItems(items);

			} catch (err) {
				console.error("Fetch Error:", err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchCart();
	}, [patientId, token]);


	// --- 2. Handlers ---
	const handleQuantityChange = async (itemMedicineIdStr, delta) => {
		// Prevent updates if no patient ID
		if (!patientId) return;

		// Determine action string for backend
		const action = delta > 0 ? "increment" : "decrement";

		try {
			const response = await authFetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/cart/update-quantity`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify({
						patientId: patientId,
						medicineId: itemMedicineIdStr,
						action: action
					})
				}
			);

			const data = await response.json();

			if (!response.ok) {
				alert(data.message || "Failed to update quantity");
				return;
			}

			if (data.cartItems && data.cartItems.items) {
				setCartItems(data.cartItems.items);
			}

		} catch (err) {
			console.error("Update Error:", err);
			alert("Network error updating cart");
		}
	};

	const handleRemoveItem = async (medicineId) => {
		if (!patientId) return;

		try {
			const response = await authFetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/cart/remove`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`
					},
					body: JSON.stringify({
						patientId: patientId,
						medicineId: medicineId
					})
				}
			);

			const data = await response.json();

			if (!response.ok) {
				alert(data.message || "Failed to remove item");
				return;
			}

			if (data.cartItems && data.cartItems.items) {
				setCartItems(data.cartItems.items);
			} else {
				// If cart is empty now
				setCartItems([]);
			}

		} catch (err) {
			console.error("Remove Error:", err);
			alert("Error removing item");
		}
	};

	const handleProceedToCheckout = () => {
		navigate('/checkout');
	};

	// Calculate Total Price
	const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);
	const totalPrice = cartItems.reduce((total, item) => {
		const price = item.medicineId?.price || 0;
		return total + (price * item.quantity);
	}, 0);

	// --- 3. Render Helpers ---
	if (loading) {
		return (
			<div className="cart-page">
				<div className="cart-status-container">
					<Loader2 className="cart-spinner" size={40} />
					<p>Loading your cart&hellip;</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="cart-page">
				<div className="cart-status-container">
					<AlertCircle size={40} className="cart-status-icon cart-status-icon--danger" />
					<p>{error}</p>
					<button onClick={() => window.location.reload()} className="cart-btn cart-btn--primary">
						Retry
					</button>
				</div>
			</div>
		);
	}

	// Helper to get image URL safely
	const getImageUrl = (imagePath) => {
		if (!imagePath) return FALLBACK_IMAGE;
		if (imagePath.startsWith('http')) return imagePath;
		return `${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/${imagePath}`;
	};

	return (
		<div className="cart-page">
			<header className="cart-header">
				<h1>Your Cart</h1>
				<span className="cart-header__accent" aria-hidden="true" />
				{cartItems.length > 0 && (
					<p className="cart-header__count">
						{itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout
					</p>
				)}
			</header>

			{cartItems.length === 0 ? (
				<div className="cart-empty">
					<ShoppingBag size={40} className="cart-empty__icon" aria-hidden="true" />
					<h2>Your cart is empty</h2>
					<p>Browse our ayurvedic medicines and add what you need — we&rsquo;ll keep it here for you.</p>
					<button onClick={() => navigate('/medicines')} className="cart-btn cart-btn--primary">
						Browse Medicines
					</button>
				</div>
			) : (
				<div className="cart-layout">
					<ul className="cart-items">
						{cartItems.map((item) => {
							const lineTotal = (item.medicineId?.price || 0) * item.quantity;
							return (
								<li key={item._id} className="cart-item">
									<img
										src={getImageUrl(item.medicineId?.image)}
										alt={item.medicineId?.name || "Medicine"}
										onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
									/>

									<div className="cart-details">
										<div className="cart-details__info">
											<h3>{item.medicineId?.name || "Unknown Medicine"}</h3>
											<p className="item-price">₹{item.medicineId?.price?.toFixed(2)} each</p>
										</div>

										<div className="cart-details__controls">
											<div className="quantity-controls">
												{/* Pass medicineId._id instead of item._id because the controller matches by medicineId */}
												<button
													onClick={() => handleQuantityChange(item.medicineId._id, -1)}
													disabled={item.quantity <= 1}
													aria-label={`Decrease quantity of ${item.medicineId?.name || "item"}`}
												>
													<Minus size={16} />
												</button>
												<span>{item.quantity}</span>
												<button
													onClick={() => handleQuantityChange(item.medicineId._id, 1)}
													aria-label={`Increase quantity of ${item.medicineId?.name || "item"}`}
												>
													<Plus size={16} />
												</button>
											</div>

											<p className="item-subtotal">₹{lineTotal.toFixed(2)}</p>
										</div>

										<button
											onClick={() => handleRemoveItem(item.medicineId._id)}
											className="remove-item-btn"
											aria-label={`Remove ${item.medicineId?.name || "item"} from cart`}
										>
											<Trash2 size={15} />
											Remove
										</button>
									</div>
								</li>
							);
						})}
					</ul>

					<aside className="cart-summary">
						<h2>Order summary</h2>
						<div className="cart-summary__row">
							<span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
							<span>₹{totalPrice.toFixed(2)}</span>
						</div>
						<div className="cart-summary__total">
							<span>Total</span>
							<span>₹{totalPrice.toFixed(2)}</span>
						</div>
						<button
							onClick={handleProceedToCheckout}
							className="cart-btn cart-btn--primary cart-btn--full"
						>
							Proceed to Checkout
						</button>
					</aside>
				</div>
			)}
		</div>
	);
};

export default CartScreen;
