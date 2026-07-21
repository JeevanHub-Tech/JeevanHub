import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShoppingBag, AlertCircle, Minus, Plus, Trash2, Stethoscope, ArrowRightLeft, Lock, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AuthContext } from "../context/AuthContext";
import { authFetch } from "../utils/authFetch";
import { BACKEND_URL } from '../config';

// Olive-tinted botanical placeholder, used only when a medicine truly has no
// uploaded image or the image URL fails to load.
const FALLBACK_IMAGE =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23556b2f" stroke-width="1.5"><path d="M12 2C9 6 6 9 6 13a6 6 0 0 0 12 0c0-4-3-7-6-11Z"/><path d="M12 13v9"/></svg>';

// Medicine.images is an array of paths/URLs (see MedicineForm.js's resolveThumb) —
// take the first real one, resolving it against the backend if it's a relative path.
const getMedicineThumb = (images) => {
	const first = (images || []).filter(Boolean)[0];
	if (!first) return FALLBACK_IMAGE;
	return first.startsWith('http') ? first : `${BACKEND_URL}/${first}`;
};

// Shared row markup for a single cart line item — used by both "My Cart" and
// each doctor-prescribed cart, since the visual and data shape are identical.
const CartItemRow = ({ item, onIncrement, onDecrement, onRemove, onViewDetails }) => {
	const lineTotal = (item.medicineId?.price || 0) * item.quantity;
	const name = item.medicineId?.name || "Unknown Medicine";
	return (
		<li className="list-none">
			<Card className="@container flex-row gap-0 overflow-hidden rounded-(--jh-radius-lg) border-border p-0 py-0 shadow-(--jh-shadow-rest) transition-all duration-250 ease-out hover:-translate-y-1 hover:border-(--jh-olive-leaf) hover:shadow-(--jh-shadow-hover)">
				<img
					src={getMedicineThumb(item.medicineId?.images)}
					alt={name}
					className="h-24 w-24 shrink-0 cursor-pointer border-r border-border bg-secondary object-cover object-center sm:h-32 sm:w-32"
					onClick={onViewDetails}
					onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
				/>

				<div className="flex min-w-0 flex-1 flex-col gap-3.5 p-5 @[700px]:flex-row @[700px]:items-center @[700px]:justify-between">
					<div className="min-w-0 cursor-pointer @[700px]:min-w-0 @[700px]:flex-1" onClick={onViewDetails}>
						<h3 className="m-0 mb-0.5 line-clamp-2 font-display text-lg leading-snug font-semibold wrap-break-word text-(--jh-ink-strong)">{name}</h3>
						<div className="flex items-center justify-between gap-3">
							<p className="m-0 text-sm font-medium text-muted-foreground">₹{item.medicineId?.price?.toFixed(2)} each</p>
							<button
								onClick={(e) => { e.stopPropagation(); onRemove(); }}
								className="inline-flex shrink-0 items-center gap-1.5 bg-transparent p-0 text-sm font-semibold text-destructive transition-opacity hover:opacity-75"
								aria-label={`Remove ${name} from cart`}
								type="button"
							>
								<Trash2 size={15} />
								Remove
							</button>
						</div>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-4 @[700px]:shrink-0">
						<div className="flex w-fit items-center gap-2.5 rounded-(--jh-radius-md) bg-secondary p-1.5">
							<button
								onClick={onDecrement}
								disabled={item.quantity <= 1}
								aria-label={`Decrease quantity of ${name}`}
								type="button"
								className="flex size-8.5 items-center justify-center rounded-(--jh-radius-sm) border-[1.5px] border-(--jh-line-strong) bg-card text-primary transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:scale-105 enabled:hover:border-primary enabled:hover:bg-primary enabled:hover:text-primary-foreground"
							>
								<Minus size={16} />
							</button>
							<span className="min-w-7 text-center text-base font-bold text-(--jh-ink-strong)">{item.quantity}</span>
							<button
								onClick={onIncrement}
								aria-label={`Increase quantity of ${name}`}
								type="button"
								className="flex size-8.5 items-center justify-center rounded-(--jh-radius-sm) border-[1.5px] border-(--jh-line-strong) bg-card text-primary transition-all duration-200 ease-out hover:scale-105 hover:border-primary hover:bg-primary hover:text-primary-foreground"
							>
								<Plus size={16} />
							</button>
						</div>

						<p className="m-0 text-base font-bold text-(--jh-ink-strong)">₹{lineTotal.toFixed(2)}</p>
					</div>
				</div>
			</Card>
		</li>
	);
};

// Compact placeholder shown for "My Cart" when it has nothing in it yet,
// even while doctor-prescribed carts are present — the two are never conflated.
const MyCartEmptyPlaceholder = ({ onBrowse }) => (
	<EmptyState
		icon={ShoppingBag}
		description="Your cart is empty. Add medicines you need — they'll show up here."
		action={
			<Button type="button" onClick={onBrowse}>
				Browse Medicines
			</Button>
		}
		className="border-dashed"
	/>
);

const CartScreen = () => {
	const navigate = useNavigate();
	const { auth, loading: authLoading } = useContext(AuthContext);

	const [defaultCart, setDefaultCart] = useState({ items: [], totalPrice: 0 });
	const [doctorCarts, setDoctorCarts] = useState([]);
	const [expandedIds, setExpandedIds] = useState(new Set());
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const patientId = auth?.user?.id;
	const token = localStorage.getItem('token');

	useEffect(() => {
		const fetchCart = async () => {
			if (authLoading) return;
			if (!patientId) {
				setLoading(false);
				return;
			}

			try {
				const response = await authFetch(
					`${BACKEND_URL}/api/cart/${patientId}`,
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
	}, [authLoading, patientId, token]);

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
				`${BACKEND_URL}/api/cart/update-quantity`,
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
				`${BACKEND_URL}/api/cart/remove`,
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
				`${BACKEND_URL}/api/cart/doctor/${doctorId}/update-quantity`,
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
				`${BACKEND_URL}/api/cart/doctor/${doctorId}/remove-item`,
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
				`${BACKEND_URL}/api/cart/doctor/${doctorId}/move-to-default`,
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
				`${BACKEND_URL}/api/cart/doctor/${doctorId}`,
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

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-background px-4 pb-32.5 font-body text-foreground sm:px-5 sm:pb-15">
				<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center text-muted-foreground">
					<Loader2 className="size-10 animate-spin text-(--jh-olive-leaf)" />
					<p>Loading your cart&hellip;</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-background px-4 pb-32.5 font-body text-foreground sm:px-5 sm:pb-15">
				<div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center text-muted-foreground">
					<AlertCircle size={40} className="text-destructive" />
					<p>{error}</p>
					<Button type="button" onClick={() => window.location.reload()}>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	// The "My Cart" items + summary block, reused as-is in both layouts below.
	const myCartItemsAndSummary = (
		<>
			<ul className="@container m-0 flex w-full list-none flex-col gap-5 p-0">
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

			<aside className="fixed inset-x-0 bottom-0 z-40 rounded-none border-0 border-t border-border bg-card p-4 shadow-[0_-6px_20px_rgba(47,53,36,0.14)] sm:static sm:rounded-(--jh-radius-lg) sm:border sm:p-7 sm:shadow-(--jh-shadow-card) in-[.cart-layout--stacked]:sm:static">
				<h2 className="m-0 mb-4.5 hidden font-display text-xl font-semibold text-(--jh-ink-strong) sm:block">Order summary</h2>
				<div className="mb-4 hidden justify-between border-b border-border pb-4 text-sm text-muted-foreground sm:flex">
					<span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
					<span>₹{totalPrice.toFixed(2)}</span>
				</div>
				<div className="mb-3.5 flex items-baseline justify-between font-display text-lg font-semibold text-(--jh-ink-strong) sm:mb-6 sm:text-2xl">
					<span>Total</span>
					<span>₹{totalPrice.toFixed(2)}</span>
				</div>
				<Button type="button" onClick={handleProceedToCheckout} className="w-full">
					Proceed to Checkout
				</Button>
			</aside>
		</>
	);

	return (
		<div className={`mx-auto min-h-screen bg-background px-4 pb-32.5 font-body text-foreground transition-[max-width] duration-200 ease-out sm:px-5 sm:pb-15 ${hasDoctorCarts ? 'max-w-none' : 'max-w-275'}`}>
			<header className="mb-10 flex flex-col items-center text-center">
				<h1 className="m-0 font-display text-3xl leading-tight font-normal tracking-tight text-(--jh-ink-strong) sm:text-4xl">Your Cart</h1>
				<span
					aria-hidden="true"
					className="mt-3.5 block h-1 w-21 rounded-(--jh-radius-pill) bg-linear-to-r from-(--jh-olive-leaf) via-(--jh-turmeric-gold) to-(--jh-bark-brown)"
				/>
				{defaultCart.items.length > 0 && (
					<p className="mt-3.5 text-sm text-muted-foreground">
						{itemCount} {itemCount === 1 ? "item" : "items"} ready for checkout
					</p>
				)}
			</header>

			{isEverythingEmpty ? (
				<EmptyState
					icon={ShoppingBag}
					title="Your cart is empty"
					description="Browse our ayurvedic medicines and add what you need — we'll keep it here for you."
					action={
						<Button type="button" onClick={() => navigate('/medicines')}>
							Browse Medicines
						</Button>
					}
				/>
			) : hasDoctorCarts ? (
				// Split layout: My Cart takes priority (it's the actual checkout path),
				// doctor-prescribed carts sit alongside it, most recent expanded.
				<div className="grid grid-cols-1 items-start gap-10 min-[900px]:grid-cols-[55%_1fr] min-[900px]:gap-0">
					<div className="min-[900px]:border-r min-[900px]:border-border min-[900px]:pr-3.5">
						<h2 className="m-0 mb-5 font-display text-xl font-semibold text-(--jh-ink-strong)">My Cart</h2>
						{defaultCart.items.length > 0
							? <div className="cart-layout--stacked flex flex-col gap-6">{myCartItemsAndSummary}</div>
							: <MyCartEmptyPlaceholder onBrowse={() => navigate('/medicines')} />
						}
					</div>

					<div className="min-w-0 min-[900px]:pl-3.5">
						<h2 className="m-0 mb-1.5 flex items-center gap-2.5 font-display text-lg font-semibold text-(--jh-ink-strong)">
							<Stethoscope size={20} className="shrink-0 text-(--jh-olive-leaf)" />
							Prescribed by Your Doctors
						</h2>
						<p className="mb-5 text-sm text-muted-foreground">
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
								<Card key={doctorId || dc._id} className={`mb-4 gap-0 overflow-hidden rounded-(--jh-radius-lg) border-border p-0 py-0 shadow-(--jh-shadow-rest) transition-shadow duration-200 ease-out ${isExpanded ? 'shadow-(--jh-shadow-card)' : ''}`}>
									<button
										type="button"
										className={`flex w-full items-center gap-3 bg-transparent p-4.5 text-left hover:bg-secondary ${isExpanded ? 'border-b border-dashed border-border' : ''}`}
										onClick={() => toggleExpanded(doctorId)}
										aria-expanded={isExpanded}
									>
										<h3 className="m-0 flex min-w-10 shrink items-center gap-2 font-display text-base font-semibold text-(--jh-ink-strong)">
											<Stethoscope size={16} className="shrink-0 text-(--jh-olive-leaf)" />
											<span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{doctorName}</span>
										</h3>

										{!isExpanded && (
											<div className="flex min-w-0 flex-1 -space-x-2.5">
												{dc.items.slice(0, 3).map((item, i) => (
													<img
														key={item._id || i}
														src={getMedicineThumb(item.medicineId?.images)}
														alt=""
														className="size-7.5 shrink-0 rounded-full border-2 border-card bg-secondary object-cover ring-1 ring-border"
														onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
													/>
												))}
											</div>
										)}

										<span className="ml-auto shrink-0 text-sm font-semibold whitespace-nowrap text-muted-foreground">
											{count} {count === 1 ? "item" : "items"} · ₹{dc.totalPrice.toFixed(2)}
										</span>
										<ChevronDown size={18} className={`shrink-0 text-muted-foreground transition-transform duration-200 ease-out ${isExpanded ? 'rotate-180' : ''}`} />
									</button>

									{isExpanded && (
										<div className="p-5">
											<ul className="@container m-0 mb-5 flex list-none flex-col gap-5 p-0">
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

											<div className="flex flex-wrap gap-3 max-[640px]:flex-col max-[640px]:items-stretch">
												<Button
													type="button"
													variant="secondary"
													onClick={() => handleMoveToDefault(doctorId, doctorName)}
												>
													<ArrowRightLeft size={16} />
													Move Items to My Cart
												</Button>
												<Button
													type="button"
													variant="destructive"
													onClick={() => handleDeleteDoctorCart(doctorId, doctorName)}
												>
													<Trash2 size={16} />
													Delete Cart
												</Button>
												<Button
													type="button"
													variant="outline"
													disabled
													title="Checking out a doctor's cart directly is coming soon — move it to your cart to check out for now."
													className="ml-auto max-[640px]:ml-0"
												>
													<Lock size={15} />
													Checkout This Cart
												</Button>
											</div>
										</div>
									)}
								</Card>
							);
						})}
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 items-start gap-8 min-[860px]:grid-cols-[1fr_340px]">
					{myCartItemsAndSummary}
				</div>
			)}
		</div>
	);
};

export default CartScreen;
