import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShoppingBag, AlertCircle, Minus, Plus, Trash2, Stethoscope, ArrowRightLeft, Lock, ChevronDown } from "lucide-react";
import "./Cart.css";
import { AuthContext } from "../context/AuthContext";
import { authFetch } from "../utils/authFetch";

// Olive-tinted botanical placeholder, used only when a medicine truly has no
// uploaded image or the image URL fails to load.
const FALLBACK_IMAGE =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23556b2f" stroke-width="1.5"><path d="M12 2C9 6 6 9 6 13a6 6 0 0 0 12 0c0-4-3-7-6-11Z"/><path d="M12 13v9"/></svg>';

// Medicine.images is an array of paths/URLs (see MedicineForm.js's resolveThumb) —
// take the first real one, resolving it against the backend if it's a relative path.
const getMedicineThumb = (images) => {
	const first = (images || []).filter(Boolean)[0];
	if (!first) return FALLBACK_IMAGE;
	return first.startsWith('http') ? first : `${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/${first}`;
};

// Shared row markup for a single cart line item — used by both "My Cart" and
// each doctor-prescribed cart, since the visual and data shape are identical.
const CartItemRow = ({ item, onIncrement, onDecrement, onRemove, onViewDetails }) => {
	const lineTotal = (item.medicineId?.price || 0) * item.quantity;
	const name = item.medicineId?.name || "Unknown Medicine";
	return (
		<li className="cart-item">
			<img
				src={getMedicineThumb(item.medicineId?.images)}
				alt={name}
				className="cart-item__thumb"
				onClick={onViewDetails}
				onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
			/>

			<div className="cart-details">
				<div className="cart-details__info" onClick={onViewDetails}>
					<h3>{name}</h3>
					<div className="cart-details__price-row">
						<p className="item-price">₹{item.medicineId?.price?.toFixed(2)} each</p>
						<button
							onClick={(e) => { e.stopPropagation(); onRemove(); }}
							className="remove-item-btn"
							aria-label={`Remove ${name} from cart`}
						>
							<Trash2 size={15} />
							Remove
						</button>
					</div>
				</div>

				<div className="cart-details__controls">
					<div className="quantity-controls">
						<button onClick={onDecrement} disabled={item.quantity <= 1} aria-label={`Decrease quantity of ${name}`}>
							<Minus size={16} />
						</button>
						<span>{item.quantity}</span>
						<button onClick={onIncrement} aria-label={`Increase quantity of ${name}`}>
							<Plus size={16} />
						</button>
					</div>

					<p className="item-subtotal">₹{lineTotal.toFixed(2)}</p>
				</div>
			</div>
		</li>
	);
};

// Compact placeholder shown for "My Cart" when it has nothing in it yet,
// even while doctor-prescribed carts are present — the two are never conflated.
const MyCartEmptyPlaceholder = ({ onBrowse }) => (
	<div className="cart-mycart-empty">
		<ShoppingBag size={28} className="cart-empty__icon" aria-hidden="true" />
		<p>Your cart is empty. Add medicines you need — they&rsquo;ll show up here.</p>
		<button onClick={onBrowse} className="cart-btn cart-btn--primary">
			Browse Medicines
		</button>
	</div>
);

const CartScreen = () => {
	const navigate = useNavigate();
	const { auth } = useContext(AuthContext);

	const [defaultCart, setDefaultCart] = useState({ items: [], totalPrice: 0 });
	const [doctorCarts, setDoctorCarts] = useState([]);
	const [expandedIds, setExpandedIds] = useState(new Set());
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const patientId = auth?.user?.id;
	const token = localStorage.getItem('token');

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
				const fetchedDoctorCarts = data.doctorCarts || [];
				setDefaultCart({
					items: data.defaultCart?.items || [],
					totalPrice: data.defaultCart?.totalPrice || 0
				});
				setDoctorCarts(fetchedDoctorCarts);

				// The most recently active doctor cart (already sorted by the API)
				// starts expanded; the rest start collapsed.
				const firstId = fetchedDoctorCarts[0]?.doctorId?._id;
				setExpandedIds(firstId ? new Set([firstId]) : new Set());

			} catch (err) {
				console.error("Fetch Error:", err);
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchCart();
	}, [patientId, token]);

	const toggleExpanded = (doctorId) => {
		setExpandedIds(prev => {
			const next = new Set(prev);
			if (next.has(doctorId)) next.delete(doctorId);
			else next.add(doctorId);
			return next;
		});
	};

	// --- My Cart handlers (default cart) ---

	const handleQuantityChange = async (medicineId, delta) => {
		if (!patientId) return;
		const action = delta > 0 ? "increment" : "decrement";

		try {
			const response = await authFetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/cart/update-quantity`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
					body: JSON.stringify({ patientId, medicineId, action })
				}
			);

			const data = await response.json();
			if (!response.ok) {
				alert(data.message || "Failed to update quantity");
				return;
			}
			if (data.cartItems) {
				setDefaultCart({ items: data.cartItems.items, totalPrice: data.cartItems.totalPrice });
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
					headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
					body: JSON.stringify({ patientId, medicineId })
				}
			);

			const data = await response.json();
			if (!response.ok) {
				alert(data.message || "Failed to remove item");
				return;
			}
			setDefaultCart({
				items: data.cartItems?.items || [],
				totalPrice: data.cartItems?.totalPrice || 0
			});
		} catch (err) {
			console.error("Remove Error:", err);
			alert("Error removing item");
		}
	};

	const handleProceedToCheckout = () => {
		navigate('/checkout');
	};

	// --- Doctor-cart handlers (RUD only — no add-item action exists here) ---

	const updateDoctorCartLocal = (doctorId, patch) => {
		setDoctorCarts(prev => prev.map(dc =>
			dc.doctorId?._id === doctorId ? { ...dc, ...patch } : dc
		));
	};

	const removeDoctorCartLocal = (doctorId) => {
		setDoctorCarts(prev => prev.filter(dc => dc.doctorId?._id !== doctorId));
	};

	const handleDoctorQuantityChange = async (doctorId, medicineId, delta) => {
		const action = delta > 0 ? "increment" : "decrement";
		try {
			const response = await authFetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/cart/doctor/${doctorId}/update-quantity`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
					body: JSON.stringify({ medicineId, action })
				}
			);
			const data = await response.json();
			if (!response.ok) {
				alert(data.message || "Failed to update quantity");
				return;
			}
			if (data.cartItems) {
				updateDoctorCartLocal(doctorId, { items: data.cartItems.items, totalPrice: data.cartItems.totalPrice });
			}
		} catch (err) {
			console.error("Update Doctor Cart Error:", err);
			alert("Network error updating cart");
		}
	};

	const handleDoctorRemoveItem = async (doctorId, medicineId) => {
		try {
			const response = await authFetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/cart/doctor/${doctorId}/remove-item`,
				{
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
					body: JSON.stringify({ medicineId })
				}
			);
			const data = await response.json();
			if (!response.ok) {
				alert(data.message || "Failed to remove item");
				return;
			}
			if (data.cartItems) {
				updateDoctorCartLocal(doctorId, { items: data.cartItems.items, totalPrice: data.cartItems.totalPrice });
			} else {
				// Cart emptied out and was auto-deleted server-side.
				removeDoctorCartLocal(doctorId);
			}
		} catch (err) {
			console.error("Remove From Doctor Cart Error:", err);
			alert("Error removing item");
		}
	};

	const handleMoveToDefault = async (doctorId, doctorLabel) => {
		try {
			const response = await authFetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/cart/doctor/${doctorId}/move-to-default`,
				{ method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
			);
			const data = await response.json();
			if (!response.ok) {
				alert(data.message || "Failed to move items to your cart");
				return;
			}
			setDefaultCart({ items: data.cartItems.items, totalPrice: data.cartItems.totalPrice });
			removeDoctorCartLocal(doctorId);
		} catch (err) {
			console.error("Move To Default Error:", err);
			alert(`Could not move ${doctorLabel}'s items to your cart. Please try again.`);
		}
	};

	const handleDeleteDoctorCart = async (doctorId, doctorLabel) => {
		if (!window.confirm(`Delete everything ${doctorLabel} prescribed to your cart? This can't be undone.`)) return;

		try {
			const response = await authFetch(
				`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/cart/doctor/${doctorId}`,
				{ method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }
			);
			const data = await response.json();
			if (!response.ok) {
				alert(data.message || "Failed to delete cart");
				return;
			}
			removeDoctorCartLocal(doctorId);
		} catch (err) {
			console.error("Delete Doctor Cart Error:", err);
			alert("Error deleting cart");
		}
	};

	const handleViewMedicine = (medicineId) => {
		if (medicineId) navigate(`/medicines/${medicineId}`);
	};

	// --- Derived totals ---
	const itemCount = defaultCart.items.reduce((count, item) => count + item.quantity, 0);
	const totalPrice = defaultCart.totalPrice;
	const isEverythingEmpty = defaultCart.items.length === 0 && doctorCarts.length === 0;
	const hasDoctorCarts = doctorCarts.length > 0;

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

	// The "My Cart" items + summary block, reused as-is in both layouts below.
	const myCartItemsAndSummary = (
		<>
			<ul className="cart-items">
				{defaultCart.items.map((item) => (
					<CartItemRow
						key={item._id}
						item={item}
						onIncrement={() => handleQuantityChange(item.medicineId._id, 1)}
						onDecrement={() => handleQuantityChange(item.medicineId._id, -1)}
						onRemove={() => handleRemoveItem(item.medicineId._id)}
						onViewDetails={() => handleViewMedicine(item.medicineId._id)}
					/>
				))}
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
				<button onClick={handleProceedToCheckout} className="cart-btn cart-btn--primary cart-btn--full">
					Proceed to Checkout
				</button>
			</aside>
		</>
	);

	return (
		<div
			className={`cart-page ${hasDoctorCarts ? 'cart-page--wide' : ''}`}
			// Inline style as a deliberate belt-and-suspenders alongside the
			// .cart-page--wide CSS rule: inline styles always win over
			// external stylesheet rules regardless of cascade/specificity.
			style={hasDoctorCarts ? { maxWidth: 'none' } : undefined}
		>
			<header className="cart-header">
				<h1>Your Cart</h1>
				<span className="cart-header__accent" aria-hidden="true" />
				{defaultCart.items.length > 0 && (
					<p className="cart-header__count">
						{itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout
					</p>
				)}
			</header>

			{isEverythingEmpty ? (
				<div className="cart-empty">
					<ShoppingBag size={40} className="cart-empty__icon" aria-hidden="true" />
					<h2>Your cart is empty</h2>
					<p>Browse our ayurvedic medicines and add what you need — we&rsquo;ll keep it here for you.</p>
					<button onClick={() => navigate('/medicines')} className="cart-btn cart-btn--primary">
						Browse Medicines
					</button>
				</div>
			) : hasDoctorCarts ? (
				// Split layout: My Cart takes priority (it's the actual checkout path),
				// doctor-prescribed carts sit alongside it, most recent expanded.
				<div className="cart-split">
					<div className="cart-split__mycart">
						<h2 className="cart-split__heading">My Cart</h2>
						{defaultCart.items.length > 0
							? <div className="cart-layout cart-layout--stacked">{myCartItemsAndSummary}</div>
							: <MyCartEmptyPlaceholder onBrowse={() => navigate('/medicines')} />
						}
					</div>

					<div className="cart-split__doctors">
						<h2 className="cart-doctor-section__title">
							<Stethoscope size={20} />
							Prescribed by Your Doctors
						</h2>
						<p className="cart-doctor-section__hint">
							Kept separate from your own cart, most recent first. Move a doctor&rsquo;s items into your cart to check out, or remove them.
						</p>

						{doctorCarts.map((dc) => {
							const doctorName = dc.doctorId
								? `Dr. ${dc.doctorId.firstName || ''} ${dc.doctorId.lastName || ''}`.trim()
								: 'Unknown Doctor';
							const doctorId = dc.doctorId?._id;
							const count = dc.items.reduce((n, i) => n + i.quantity, 0);
							const isExpanded = expandedIds.has(doctorId);

							return (
								<div key={doctorId || dc._id} className={`cart-doctor-card ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}>
									<button
										type="button"
										className="cart-doctor-card__header"
										onClick={() => toggleExpanded(doctorId)}
										aria-expanded={isExpanded}
									>
										<h3><Stethoscope size={16} /> <span className="cart-doctor-card__name-text">{doctorName}</span></h3>

										{!isExpanded && (
											<div className="cart-doctor-card__preview">
												{dc.items.slice(0, 3).map((item, i) => (
													<img
														key={item._id || i}
														src={getMedicineThumb(item.medicineId?.images)}
														alt=""
														className="cart-doctor-card__preview-thumb"
														onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
													/>
												))}
											</div>
										)}

										<span className="cart-doctor-card__count">
											{count} {count === 1 ? "item" : "items"} · ₹{dc.totalPrice.toFixed(2)}
										</span>
										<ChevronDown size={18} className="cart-doctor-card__chevron" />
									</button>

									{isExpanded && (
										<div className="cart-doctor-card__body">
											<ul className="cart-items">
												{dc.items.map((item) => (
													<CartItemRow
														key={item._id}
														item={item}
														onIncrement={() => handleDoctorQuantityChange(doctorId, item.medicineId._id, 1)}
														onDecrement={() => handleDoctorQuantityChange(doctorId, item.medicineId._id, -1)}
														onRemove={() => handleDoctorRemoveItem(doctorId, item.medicineId._id)}
														onViewDetails={() => handleViewMedicine(item.medicineId._id)}
													/>
												))}
											</ul>

											<div className="cart-doctor-card__actions">
												<button
													className="cart-btn cart-btn--secondary"
													onClick={() => handleMoveToDefault(doctorId, doctorName)}
												>
													<ArrowRightLeft size={16} />
													Move Items to My Cart
												</button>
												<button
													className="cart-btn cart-btn--ghost-danger"
													onClick={() => handleDeleteDoctorCart(doctorId, doctorName)}
												>
													<Trash2 size={16} />
													Delete Cart
												</button>
												<button
													className="cart-btn cart-btn--disabled"
													disabled
													title="Checking out a doctor's cart directly is coming soon — move it to your cart to check out for now."
												>
													<Lock size={15} />
													Checkout This Cart
												</button>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			) : (
				<div className="cart-layout">
					{myCartItemsAndSummary}
				</div>
			)}
		</div>
	);
};

export default CartScreen;
