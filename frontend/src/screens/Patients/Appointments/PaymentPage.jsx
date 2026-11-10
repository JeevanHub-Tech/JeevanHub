import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL, CASHFREE_ENV } from "../../../config";

function PaymentPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [qrCode, setQrCode] = useState("");
	const [price, setPrice] = useState(null);
	const [bookingId, setBookingId] = useState("");
	const [paymentScreenshot, setPaymentScreenshot] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [payingOnline, setPayingOnline] = useState(false);

	const handleCashfreeOnlinePayment = async () => {
		setPayingOnline(true);
		setError(null);
		try {
			const token = localStorage.getItem("token");
			const res = await authFetch(`${BACKEND_URL}/api/payment/create-order`, {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ amount: Number(price) })
			});
			const cfOrder = await res.json();
			if (!res.ok || !cfOrder.payment_session_id) {
				throw new Error(cfOrder.error || "Could not start payment session");
			}

			if (!window.Cashfree) {
				throw new Error("Cashfree SDK is loading. Please try again in a moment.");
			}

			const cashfree = window.Cashfree({ mode: CASHFREE_ENV });
			const result = await cashfree.checkout({
				paymentSessionId: cfOrder.payment_session_id,
				redirectTarget: "_modal"
			});

			if (result.error) {
				console.error("Cashfree checkout error:", result.error);
				setError(result.error.message || "Payment was not completed.");
				setPayingOnline(false);
				return;
			}

			const verifyRes = await authFetch(`${BACKEND_URL}/api/bookings/${bookingId}/verify-payment`, {
				method: "PUT",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({
					cashfreeOrderId: cfOrder.order_id,
					cashfreePaymentId: cfOrder.cf_order_id ? String(cfOrder.cf_order_id) : cfOrder.order_id
				})
			});
			const verifyData = await verifyRes.json();
			if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");

			alert("Payment successful! Your appointment is confirmed.");
			navigate("/patient-home");
		} catch (err) {
			console.error("Online payment error:", err);
			setError(err.message || "Payment failed");
		} finally {
			setPayingOnline(false);
		}
	};

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const qrCodeParam = urlParams.get("qrCode");
		const priceParam = urlParams.get("price");
		const bookingIdParam = urlParams.get("bookingId");

		if (qrCodeParam && priceParam && bookingIdParam) {
			setQrCode(qrCodeParam);
			setPrice(priceParam);
			setBookingId(bookingIdParam);
			setLoading(false);
		} else {
			setError("QR Code, Price, or Booking ID is missing.");
			setLoading(false);
		}
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!paymentScreenshot) {
			setError("Please upload a payment screenshot.");
			return;
		}

		const formData = new FormData();
		formData.append("paymentScreenshot", paymentScreenshot);
		formData.append("amountPaid", price);
		formData.append("paymentStatus", "Completed");

		setSubmitting(true);
		try {
			const response = await authFetch(`${BACKEND_URL}/api/bookings/${bookingId}/payment`, {
				method: "POST",
				headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
				body: formData,
			});

			const result = await response.json();
			if (!response.ok) throw new Error(result.error || "Failed to upload payment screenshot.");

			alert(t("paymentScreen.successAlert", "Payment uploaded successfully. Your doctor will send the meeting link at the time of appointment."));
			setTimeout(() => navigate("/patient-home"), 3000);
			setPaymentScreenshot(null);
		} catch (err) {
			setError(err.message);
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<main className="flex min-h-[60vh] items-center justify-center bg-background">
				<p className="text-muted-foreground">{t("paymentScreen.loadingQr", "Loading QR code...")}</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className="flex min-h-[60vh] items-center justify-center bg-background">
				<p className="rounded-(--jh-radius-md) bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
			</main>
		);
	}

	const qrCodePath = qrCode.replace(/^uploads\/doctors\//, "");
	const qrCodeUrl = `${BACKEND_URL}/uploads/doctors/${qrCodePath}`;

	return (
		<main className="bg-background">
			<div className="mx-auto max-w-md px-4 py-10 sm:px-6">
				<Card>
					<CardHeader>
						<CardTitle className="font-display text-2xl">
							{t("paymentScreen.title", "Doctor consultation payment")}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-5">
						<p className="text-sm text-muted-foreground">
							{t("paymentScreen.scanQr", "Scan the QR code below to pay.")}
						</p>

						<div className="flex justify-center rounded-(--jh-radius-lg) bg-secondary/60 p-4">
							<img
								src={qrCodeUrl}
								alt="Doctor's QR code"
								className="size-48 rounded-(--jh-radius-md) bg-card object-contain"
								onError={(e) => {
									setError("Failed to load QR code image.");
									e.target.style.display = "none";
								}}
							/>
						</div>

						<p className="text-center text-lg font-semibold text-foreground">
							{t("paymentScreen.amountToPay", "Amount to Pay:")} ₹{price}
						</p>

						<div className="flex flex-col gap-2">
							<Button 
								type="button" 
								onClick={handleCashfreeOnlinePayment} 
								disabled={payingOnline}
								className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
							>
								{payingOnline ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
								{payingOnline ? "Opening Cashfree Gateway..." : `Pay Online Instantly (UPI / Cards) • ₹${price}`}
							</Button>
							<div className="relative my-1 text-center text-xs text-muted-foreground after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
								<span className="relative z-10 bg-card px-2 text-muted-foreground">OR UPLOAD SCREENSHOT</span>
							</div>
						</div>

						<form onSubmit={handleSubmit} className="flex flex-col gap-3">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="paymentScreenshot">
									{t("paymentScreen.uploadScreenshot", "Upload Payment Screenshot")}
								</Label>
								<input
									type="file"
									id="paymentScreenshot"
									name="paymentScreenshot"
									accept="image/*"
									onChange={(e) => setPaymentScreenshot(e.target.files[0])}
									required
									className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-secondary-foreground"
								/>
							</div>
							<Button type="submit" disabled={submitting} className="w-full">
								{submitting ? <Loader2 className="size-4 animate-spin" /> : null}
								{submitting ? t("paymentScreen.submitting", "Submitting...") : t("paymentScreen.submitPayment", "Submit Payment")}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

export default PaymentPage;
