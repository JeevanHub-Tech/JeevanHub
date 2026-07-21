import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, ShoppingCart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { authFetch } from '../utils/authFetch';
import { BACKEND_URL, RAZORPAY_KEY_ID } from '../config';
import { getCheckoutCartUrl, getDefaultCartItems } from '../utils/cartData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const STEP_LABELS = {
	summary: 'Order Summary',
	shipping: 'Shipping',
	prescription: 'Prescription',
	payment: 'Payment',
	confirmation: 'Confirmation'
};

const PAYMENT_METHODS = [
	{
		value: 'cashOnDelivery',
		label: 'Cash on Delivery',
		description: 'Pay with cash when your order is delivered.'
	},
	{
		value: 'onlinePayment',
		label: 'Online Payment',
		description: 'Pay now using UPI, Net Banking, or other online methods (Razorpay).'
	}
];

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
				const response = await authFetch(`${BACKEND_URL}${getCheckoutCartUrl(userId)}`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' }
				});
				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.message || 'Failed to load cart');
				}
				setCartItems(getDefaultCartItems(data));
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

	const handlePaymentMethodChange = (value) => {
		setPaymentMethod(value);
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
				key: RAZORPAY_KEY_ID,
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
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-3 text-muted-foreground">
					<Loader2 className="size-8 animate-spin text-primary" />
					<p>Loading your cart…</p>
				</div>
			</div>
		);
	}

	if (cartItems.length === 0 && currentStep !== 'confirmation') {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background px-4">
				<EmptyState
					icon={ShoppingCart}
					title="Your cart is empty"
					description="Add some medicines to your cart before checking out."
					action={<Button onClick={() => navigate('/medicines')}>Browse Medicines</Button>}
				/>
			</div>
		);
	}

	const renderStepContent = () => {
		switch (currentStep) {
			case 'summary':
				return (
					<div>
						<h2 className="font-display mb-5 border-b border-border pb-3 text-xl font-semibold text-foreground">
							Order Summary
						</h2>
						<div className="mb-5 flex flex-col gap-4">
							{cartItems.map((item) => (
								<div key={item._id} className="flex gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0">
									<img
										src={item.medicineId?.image ? `${BACKEND_URL}/${item.medicineId.image}` : 'https://via.placeholder.com/80'}
										alt={item.medicineId?.name}
										className="size-20 shrink-0 rounded-lg object-cover"
									/>
									<div className="flex-1">
										<h3 className="text-base font-medium text-foreground">{item.medicineId?.name}</h3>
										{item.medicineId?.prescription && (
											<Badge variant="warning" className="mt-1">Prescription required</Badge>
										)}
										<p className="mt-1 text-sm text-muted-foreground">
											Price: ₹{(item.medicineId?.price || 0).toFixed(2)} × {item.quantity}
										</p>
										<p className="text-sm font-semibold text-foreground">
											Subtotal: ₹{((item.medicineId?.price || 0) * item.quantity).toFixed(2)}
										</p>
									</div>
								</div>
							))}
						</div>
						<div className="mb-5 flex justify-end border-t border-border pt-4 text-lg font-semibold text-foreground">
							Total: ₹{totalPrice.toFixed(2)}
						</div>
						<div className="flex flex-wrap justify-between gap-3">
							<Button type="button" variant="outline" onClick={() => navigate('/cart')}>
								Back to Cart
							</Button>
							<Button type="button" onClick={handleNext}>
								Next: Shipping Details
							</Button>
						</div>
					</div>
				);

			case 'shipping':
				return (
					<div>
						<h2 className="font-display mb-5 border-b border-border pb-3 text-xl font-semibold text-foreground">
							Shipping Address
						</h2>
						<form className="flex flex-col gap-4">
							<Field>
								<FieldLabel htmlFor="street">Street Address</FieldLabel>
								<Input
									type="text"
									id="street"
									name="street"
									value={address.street}
									onChange={handleAddressChange}
									placeholder="Enter your street address"
									required
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="city">City</FieldLabel>
								<Input
									type="text"
									id="city"
									name="city"
									value={address.city}
									onChange={handleAddressChange}
									placeholder="Enter your city"
									required
								/>
							</Field>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<Field>
									<FieldLabel htmlFor="state">State</FieldLabel>
									<Input
										type="text"
										id="state"
										name="state"
										value={address.state}
										onChange={handleAddressChange}
										placeholder="Enter your state"
										required
									/>
								</Field>

								<Field>
									<FieldLabel htmlFor="postalCode">Postal Code</FieldLabel>
									<Input
										type="text"
										id="postalCode"
										name="postalCode"
										value={address.postalCode}
										onChange={handleAddressChange}
										placeholder="Enter postal code"
										required
									/>
								</Field>
							</div>

							<Field>
								<FieldLabel htmlFor="country">Country</FieldLabel>
								<Input
									type="text"
									id="country"
									name="country"
									value={address.country}
									onChange={handleAddressChange}
									readOnly
								/>
							</Field>
						</form>

						{error && (
							<Alert variant="destructive" className="mt-4">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="mt-5 flex flex-wrap justify-between gap-3">
							<Button type="button" variant="outline" onClick={prevStep}>
								Back to Order Summary
							</Button>
							<Button type="button" onClick={handleNext}>
								{prescriptionNeeded ? 'Next: Upload Prescription' : 'Next: Payment Method'}
							</Button>
						</div>
					</div>
				);

			case 'prescription':
				return (
					<div>
						<h2 className="font-display mb-5 border-b border-border pb-3 text-xl font-semibold text-foreground">
							Upload Prescription
						</h2>
						<p className="mb-4 text-sm text-muted-foreground">
							Your cart contains one or more prescription-required medicines.
							Please upload a clear photo or scan of a valid prescription before continuing.
						</p>

						<Field className="mb-4">
							<FieldLabel htmlFor="prescriptionFile">Prescription Image</FieldLabel>
							<Input
								type="file"
								id="prescriptionFile"
								accept="image/*,application/pdf"
								onChange={handlePrescriptionFileChange}
							/>
						</Field>

						{prescriptionUrl && (
							<Badge variant="warning" className="mb-4">Prescription uploaded successfully.</Badge>
						)}

						{error && (
							<Alert variant="destructive" className="mb-4">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="flex flex-wrap justify-between gap-3">
							<Button type="button" variant="outline" onClick={prevStep}>
								Back to Shipping
							</Button>
							{!prescriptionUrl ? (
								<Button
									type="button"
									onClick={uploadPrescription}
									disabled={prescriptionUploading || !prescriptionFile}
								>
									{prescriptionUploading ? 'Uploading...' : 'Upload Prescription'}
								</Button>
							) : (
								<Button type="button" onClick={handleNext}>
									Next: Payment Method
								</Button>
							)}
						</div>
					</div>
				);

			case 'payment':
				return (
					<div>
						<h2 className="font-display mb-5 border-b border-border pb-3 text-xl font-semibold text-foreground">
							Payment Method
						</h2>
						<RadioGroup
							value={paymentMethod}
							onValueChange={handlePaymentMethodChange}
							className="mb-5 gap-3"
						>
							{PAYMENT_METHODS.map((method) => (
								<FieldLabel key={method.value} htmlFor={method.value}>
									<Field orientation="horizontal">
										<RadioGroupItem value={method.value} id={method.value} />
										<FieldContent>
											<FieldTitle>{method.label}</FieldTitle>
											<FieldDescription>{method.description}</FieldDescription>
										</FieldContent>
									</Field>
								</FieldLabel>
							))}
						</RadioGroup>

						<div className="mb-5 flex justify-end border-t border-border pt-4 text-lg font-semibold text-foreground">
							Order Total: ₹{totalPrice.toFixed(2)}
						</div>

						{error && (
							<Alert variant="destructive" className="mb-4">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="flex flex-wrap justify-between gap-3">
							<Button type="button" variant="outline" onClick={prevStep}>
								Back
							</Button>
							<Button
								type="button"
								onClick={placeOrder}
								disabled={loading}
							>
								{loading ? 'Processing...' : paymentMethod === 'onlinePayment' ? 'Pay Now' : 'Place Order'}
							</Button>
						</div>
					</div>
				);

			case 'confirmation':
				return (
					<div className="flex flex-col items-center gap-3 py-10 text-center">
						<CheckCircle2 className="size-12 text-primary" />
						<h2 className="font-display text-2xl font-semibold text-foreground">Order Placed Successfully!</h2>
						<p className="text-muted-foreground">Thank you for your order.</p>

						<div className="mt-2 flex flex-col gap-2 text-sm text-foreground">
							<p>Order ID: <span className="font-semibold">{orderId}</span></p>
							{paymentMethod === 'cashOnDelivery' ? (
								<p>You have selected Cash on Delivery. Please keep cash ready at the time of delivery.</p>
							) : (
								<p>Your payment has been received. You will receive order updates via email.</p>
							)}
							{notificationsAvailable && (
								<p>Order updates will be available in your notifications.</p>
							)}
						</div>

						<div className="mt-6 flex flex-wrap justify-center gap-3">
							<Button type="button" onClick={() => navigate('/order-history')}>
								View My Orders
							</Button>
							<Button type="button" variant="outline" onClick={() => navigate('/')}>
								Continue Shopping
							</Button>
						</div>
					</div>
				);

			default:
				return <div>Unknown step</div>;
		}
	};

	return (
		<div className="min-h-screen bg-background pb-16">
			<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
				<div className="relative mb-10">
					<div className="absolute top-4 right-0 left-0 h-0.5 bg-border" />
					<div className="relative flex justify-between">
						{steps.map((step, index) => (
							<div key={step} className="flex flex-col items-center gap-2">
								<span
									className={cn(
										'flex size-8 items-center justify-center rounded-full text-sm font-semibold',
										currentStepIndex >= index
											? 'bg-primary text-primary-foreground'
											: 'bg-secondary text-muted-foreground'
									)}
								>
									{index + 1}
								</span>
								<span
									className={cn(
										'text-xs',
										currentStepIndex >= index ? 'font-semibold text-foreground' : 'text-muted-foreground'
									)}
								>
									{STEP_LABELS[step]}
								</span>
							</div>
						))}
					</div>
				</div>

				<Card className="p-6">
					{renderStepContent()}
				</Card>
			</div>
		</div>
	);
};

export default CheckoutScreen;
