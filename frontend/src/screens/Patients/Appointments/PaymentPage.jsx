import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { authFetch } from "../../../utils/authFetch";
import { BACKEND_URL } from "../../../config";

function PaymentPage() {
	const navigate = useNavigate();

	const [qrCode, setQrCode] = useState("");
	const [price, setPrice] = useState(null);
	const [bookingId, setBookingId] = useState("");
	const [paymentScreenshot, setPaymentScreenshot] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);

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

			alert("Payment uploaded successfully. Your doctor will send the meeting link at the time of appointment.");
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
				<p className="text-muted-foreground">Loading QR code...</p>
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
						<CardTitle className="font-display text-2xl">Doctor consultation payment</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-5">
						<p className="text-sm text-muted-foreground">Scan the QR code below to pay.</p>

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

						<p className="text-center text-lg font-semibold text-foreground">Amount to pay: ₹{price}</p>

						<form onSubmit={handleSubmit} className="flex flex-col gap-3">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="paymentScreenshot">Upload payment screenshot</Label>
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
								{submitting ? "Submitting..." : "Submit screenshot"}
							</Button>
						</form>

						<div className="rounded-(--jh-radius-md) bg-secondary/60 p-4">
							<h3 className="text-sm font-semibold text-foreground">Instructions</h3>
							<ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
								<li>Open any UPI app (PhonePe, Google Pay, Paytm)</li>
								<li>Scan the QR code shown above</li>
								<li>Pay the amount ₹{price}</li>
								<li>Take a screenshot of the successful payment</li>
								<li>Upload the screenshot using the form above</li>
							</ol>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

export default PaymentPage;
