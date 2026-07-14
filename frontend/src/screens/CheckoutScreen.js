import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authFetch } from '../utils/authFetch';
import './CheckoutScreen.css';

const BACKEND_URL = process.env.REACT_APP_AYURVEDA_BACKEND_URL;

const CheckoutScreen = () => {
	const navigate = useNavigate();
	const { auth } = useContext(AuthContext);
	const userId = auth?.user?.id;

	// State variables
	const [cartItems, setCartItems] = useState([]);
	const [cartLoading, setCartLoading] = useState(true);
	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [address, setAddress] = useState({
		street: '',
		city: '',
		state: '',
		postalCode: '',
		country: 'India'
	});
	const [paymentMethod, setPaymentMethod] = useState('cashOnDelivery');
	const [prescriptionFile, setPrescriptionFile] = useState(null);
	const [prescriptionUrl, setPrescriptionUrl] = useState(null);
	const [prescriptionUploading, setPrescriptionUploading] = useState(false);
	const [orderId, setOrderId] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [notificationsAvailable, setNotificationsAvailable] = useState(false);

	// Calculate total price from the real cart data (backend-priced, not client-supplied)
	const totalPrice = cartItems.reduce(
		(total, item) => total + (item.medicineId?.price || 0) * item.quantity,
		0
	);

	const prescriptionNeeded = useMemo(
		() => cartItems.some(item => item.medicineId?.prescription === true),
		[cartItems]
	);

	// Ordered list of steps; the prescription step only appears when the cart
	// actually contains an Rx-flagged medicine.
	const steps = useMemo(() => {
		const base = ['summary', 'shipping'];
		if (prescriptionNeeded) base.push('prescription');
		base.push('payment', 'confirmation');
		return base;
	}, [prescriptionNeeded]);

	const currentStep = steps[currentStepIndex];

	// Fetch the real cart from the backend (localStorage never held cart data)
	useEffect(() => {
		const fetchCart = async () => {
			if (!userId) {
				setCartLoading(false);
				return;
			}
			try {
				const response = await authFetch(`${BACKEND_URL}/api/cart/${userId}`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' }
				});
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.message || 'Failed to load cart');
				}
				setCartItems(data.cartItems ? data.cartItems.items : []);
			} catch (err) {
				console.error('Error fetching cart:', err);
				setError('Could not load your cart. Please go back and try again.');
			} finally {
				setCartLoading(false);
			}
		};

		fetchCart();

		const savedAddress = localStorage.getItem('userAddress');
		if (savedAddress) {
			setAddress(JSON.parse(savedAddress));
		}

		checkNotificationsAPI();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId]);

	// Save address when it changes
	useEffect(() => {
		if (address.street || address.city || address.state || address.postalCode) {
			localStorage.setItem('userAddress', JSON.stringify(address));
		}
	}, [address]);

	const checkNotificationsAPI = async () => {
		try {
			await authFetch(`${BACKEND_URL}/api/notifications`, { method: 'HEAD' });
			setNotificationsAvailable(true);
		} catch (err) {
			setNotificationsAvailable(false);
		}
	};

	const handleAddressChange = (e) => {
		const { name, value } = e.target;
		setAddress(prev => ({ ...prev, [name]: value }));
	};

	const handlePaymentMethodChange = (e) => {
		setPaymentMethod(e.target.value);
	};

	const handlePrescriptionFileChange = (e) => {
		setPrescriptionFile(e.target.files[0]);
		setPrescriptionUrl(null);
	};

	const uploadPrescription = async () => {
		if (!prescriptionFile) {
			setError('Please select a prescription image to upload');
			return;
		}
		try {
			setPrescriptionUploading(true);
			setError('');
			const formData = new FormData();
			formData.append('prescription', prescriptionFile);

			const response = await authFetch(`${BACKEND_URL}/api/orders/upload-prescription`, {
				method: 'POST',
				body: formData
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || 'Failed to upload prescription');
			}
			setPrescriptionUrl(data.url);
		} catch (err) {
			console.error('Error uploading prescription:', err);
			setError(err.message || 'Failed to upload prescription. Please try again.');
		} finally {
			setPrescriptionUploading(false);
		}
	};

	const nextStep = () => setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
	const prevStep = () => setCurrentStepIndex(prev => Math.max(prev - 1, 0));

	const validateStep = () => {
		if (currentStep === 'shipping') {
			if (!address.street || !address.city || !address.state || !address.postalCode) {
				setError('Please fill in all address fields');
				return false;
			}
		}
		if (currentStep === 'prescription') {
			if (!prescriptionUrl) {
				setError('Please upload your prescription to continue');
				return false;
			}
		}
		setError('');
		return true;
	};

	const handleNext = () => {
		if (validateStep()) {
			nextStep();
		}
	};

	const buildOrderPayload = (extra = {}) => ({
		items: cartItems.map(item => ({
			medicineId: item.medicineId._id,
			quantity: item.quantity
		})),
		buyer: {
			firstName: auth.user.firstName,
			lastName: auth.user.lastName,
			type: auth.user.role
		},
		shippingAddress: address,
		paymentMethod,
		...(prescriptionNeeded ? { prescriptionUrl } : {}),
		...extra
	});

	const submitOrder = async (payload) => {
		const response = await authFetch(`${BACKEND_URL}/api/orders`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.message || 'Failed to place order');
		}
		return data;
	};

	const handleOnlinePayment = async () => {
		try {
			const res = await authFetch(`${BACKEND_URL}/api/payment/create-order`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ amount: totalPrice })
			});
			const razorpayOrder = await res.json();
			if (!res.ok) {
				throw new Error(razorpayOrder.error || 'Could not start payment');
			}

			const options = {
				key: process.env.REACT_APP_RAZORPAY_KEY_ID,
				amount: razorpayOrder.amount,
				currency: razorpayOrder.currency,
				name: 'JeevanHub',
				description: 'Medicine order payment',
				order_id: razorpayOrder.id,

				handler: async function (response) {
					try {
						const order = await submitOrder(buildOrderPayload({
							razorpayOrderId: response.razorpay_order_id,
							razorpayPaymentId: response.razorpay_payment_id,
							razorpaySignature: response.razorpay_signature
						}));
						setOrderId(order._id);
						setCurrentStepIndex(steps.length - 1);
					} catch (err) {
						console.error('Error finalizing paid order:', err);
						setError(`Payment was received but we could not finalize your order: ${err.message}. Please contact support with payment id ${response.razorpay_payment_id}.`);
					} finally {
						setLoading(false);
					}
				},

				modal: {
					ondismiss: () => setLoading(false)
				},

				prefill: {
					name: `${auth.user.firstName} ${auth.user.lastName}`,
				},

				theme: {
					color: '#556b2f',
				},
			};

			const rzp = new window.Razorpay(options);
			rzp.on('payment.failed', () => {
				setError('Payment failed. Please try again.');
				setLoading(false);
			});
			rzp.open();
		} catch (err) {
			console.error('Payment error:', err);
			setError(err.message || 'Payment failed');
			setLoading(false);
		}
	};

	const placeOrder = async () => {
		setError('');
		setLoading(true);

		if (paymentMethod === 'onlinePayment') {
			// loading stays true until the Razorpay handler/dismiss resolves it
			await handleOnlinePayment();
			return;
		}

		try {
			const order = await submitOrder(buildOrderPayload());
			setOrderId(order._id);
			setCurrentStepIndex(steps.length - 1);
		} catch (err) {
			console.error('Error placing order:', err);
			setError(err.message || 'Failed to place order. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	if (cartLoading) {
		return <div className="checkout-container"><p>Loading your cart&hellip;</p></div>;
	}

	if (cartItems.length === 0 && currentStep !== 'confirmation') {
		return (
			<div className="checkout-container">
				<div className="checkout-step">
					<h2>Your cart is empty</h2>
					<p>Add some medicines to your cart before checking out.</p>
					<button onClick={() => navigate('/medicines')} className="next-btn">Browse Medicines</button>
				</div>
			</div>
		);
	}

	const renderStepContent = () => {
		switch (currentStep) {
			case 'summary':
				return (
					<div className="checkout-step">
						<h2>Order Summary</h2>
						<div className="order-items">
							{cartItems.map((item) => (
								<div key={item._id} className="order-item">
									<img
										src={item.medicineId?.image ? `${BACKEND_URL}/${item.medicineId.image}` : 'https://via.placeholder.com/80'}
										alt={item.medicineId?.name}
									/>
									<div className="item-details">
										<h3>{item.medicineId?.name}</h3>
										{item.medicineId?.prescription && (
											<p className="item-rx-badge">Prescription required</p>
										)}
										<p>Price: ₹{(item.medicineId?.price || 0).toFixed(2)} × {item.quantity}</p>
										<p className="item-subtotal">
											Subtotal: ₹{((item.medicineId?.price || 0) * item.quantity).toFixed(2)}
										</p>
									</div>
								</div>
							))}
						</div>
						<div className="order-summary-total">
							<h3>Total: ₹{totalPrice.toFixed(2)}</h3>
						</div>
						<div className="navigation-buttons">
							<button onClick={() => navigate('/cart')} className="back-btn">
								Back to Cart
							</button>
							<button onClick={handleNext} className="next-btn">
								Next: Shipping Details
							</button>
						</div>
					</div>
				);

			case 'shipping':
				return (
					<div className="checkout-step">
						<h2>Shipping Address</h2>
						<form className="address-form">
							<div className="form-group">
								<label htmlFor="street">Street Address</label>
								<input
									type="text"
									id="street"
									name="street"
									value={address.street}
									onChange={handleAddressChange}
									placeholder="Enter your street address"
									required
								/>
							</div>

							<div className="form-group">
								<label htmlFor="city">City</label>
								<input
									type="text"
									id="city"
									name="city"
									value={address.city}
									onChange={handleAddressChange}
									placeholder="Enter your city"
									required
								/>
							</div>

							<div className="form-row">
								<div className="form-group">
									<label htmlFor="state">State</label>
									<input
										type="text"
										id="state"
										name="state"
										value={address.state}
										onChange={handleAddressChange}
										placeholder="Enter your state"
										required
									/>
								</div>

								<div className="form-group">
									<label htmlFor="postalCode">Postal Code</label>
									<input
										type="text"
										id="postalCode"
										name="postalCode"
										value={address.postalCode}
										onChange={handleAddressChange}
										placeholder="Enter postal code"
										required
									/>
								</div>
							</div>

							<div className="form-group">
								<label htmlFor="country">Country</label>
								<input
									type="text"
									id="country"
									name="country"
									value={address.country}
									onChange={handleAddressChange}
									readOnly
								/>
							</div>
						</form>

						{error && <div className="error-message">{error}</div>}

						<div className="navigation-buttons">
							<button onClick={prevStep} className="back-btn">
								Back to Order Summary
							</button>
							<button onClick={handleNext} className="next-btn">
								{prescriptionNeeded ? 'Next: Upload Prescription' : 'Next: Payment Method'}
							</button>
						</div>
					</div>
				);

			case 'prescription':
				return (
					<div className="checkout-step">
						<h2>Upload Prescription</h2>
						<p>
							Your cart contains one or more prescription-required medicines.
							Please upload a clear photo or scan of a valid prescription before continuing.
						</p>

						<div className="payment-proof-upload">
							<label htmlFor="prescriptionFile">Prescription Image</label>
							<input
								type="file"
								id="prescriptionFile"
								accept="image/*,application/pdf"
								onChange={handlePrescriptionFileChange}
							/>
						</div>

						{prescriptionUrl && (
							<p className="item-rx-badge">Prescription uploaded successfully.</p>
						)}

						{error && <div className="error-message">{error}</div>}

						<div className="navigation-buttons">
							<button onClick={prevStep} className="back-btn">
								Back to Shipping
							</button>
							{!prescriptionUrl ? (
								<button
									onClick={uploadPrescription}
									className="next-btn"
									disabled={prescriptionUploading || !prescriptionFile}
								>
									{prescriptionUploading ? 'Uploading...' : 'Upload Prescription'}
								</button>
							) : (
								<button onClick={handleNext} className="next-btn">
									Next: Payment Method
								</button>
							)}
						</div>
					</div>
				);

			case 'payment':
				return (
					<div className="checkout-step">
						<h2>Payment Method</h2>
						<div className="payment-options">
							<div className="payment-option">
								<input
									type="radio"
									id="cashOnDelivery"
									name="paymentMethod"
									value="cashOnDelivery"
									checked={paymentMethod === 'cashOnDelivery'}
									onChange={handlePaymentMethodChange}
								/>
								<label htmlFor="cashOnDelivery">Cash on Delivery</label>
								<p className="payment-description">
									Pay with cash when your order is delivered.
								</p>
							</div>

							<div className="payment-option">
								<input
									type="radio"
									id="onlinePayment"
									name="paymentMethod"
									value="onlinePayment"
									checked={paymentMethod === 'onlinePayment'}
									onChange={handlePaymentMethodChange}
								/>
								<label htmlFor="onlinePayment">Online Payment</label>
								<p className="payment-description">
									Pay now using UPI, Net Banking, or other online methods (Razorpay).
								</p>
							</div>
						</div>

						<div className="order-final-summary">
							<h3>Order Total: ₹{totalPrice.toFixed(2)}</h3>
						</div>

						{error && <div className="error-message">{error}</div>}

						<div className="navigation-buttons">
							<button onClick={prevStep} className="back-btn">
								Back
							</button>
							<button
								onClick={placeOrder}
								className="place-order-btn"
								disabled={loading}
							>
								{loading ? 'Processing...' : paymentMethod === 'onlinePayment' ? 'Pay Now' : 'Place Order'}
							</button>
						</div>
					</div>
				);

			case 'confirmation':
				return (
					<div className="checkout-step order-confirmation">
						<div className="success-icon">✓</div>
						<h2>Order Placed Successfully!</h2>
						<p>Thank you for your order.</p>

						<div className="order-details">
							<p>Order ID: <span>{orderId}</span></p>
							{paymentMethod === 'cashOnDelivery' ? (
								<p>You have selected Cash on Delivery. Please keep cash ready at the time of delivery.</p>
							) : (
								<p>Your payment has been received. You will receive order updates via email.</p>
							)}
							{notificationsAvailable && (
								<p>Order updates will be available in your notifications.</p>
							)}
						</div>

						<div className="navigation-buttons">
							<button onClick={() => navigate('/order-history')} className="view-orders-btn">
								View My Orders
							</button>
							<button onClick={() => navigate('/')} className="shop-more-btn">
								Continue Shopping
							</button>
						</div>
					</div>
				);

			default:
				return <div>Unknown step</div>;
		}
	};

	return (
		<div className="checkout-container">
			<div className="checkout-progress">
				{steps.map((step, index) => (
					<div key={step} className={`progress-step ${currentStepIndex >= index ? 'active' : ''}`}>
						<span className="step-number">{index + 1}</span>
						<span className="step-name">
							{{
								summary: 'Order Summary',
								shipping: 'Shipping',
								prescription: 'Prescription',
								payment: 'Payment',
								confirmation: 'Confirmation'
							}[step]}
						</span>
					</div>
				))}
			</div>

			<div className="checkout-content">
				{renderStepContent()}
			</div>
		</div>
	);
};

export default CheckoutScreen;
