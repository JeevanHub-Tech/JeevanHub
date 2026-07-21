import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const PAYMENT_METHODS = ["Credit/Debit Card", "Net Banking", "UPI"];

const PaymentScreen = () => {
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

	const handlePaymentSubmit = () => {
		if (selectedPaymentMethod) {
			alert(`Payment successful using ${selectedPaymentMethod}!`);
		} else {
			alert("Please select a payment method.");
		}
	};

	return (
		<div className="px-5 py-10 text-center">
			<h2 className="font-display mb-6 text-2xl font-semibold text-foreground">Checkout</h2>

			<Card className="mx-auto max-w-125 gap-4 p-6 text-left">
				<h3 className="m-0 text-lg font-semibold text-foreground">Select Payment Method</h3>

				<RadioGroup value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
					{PAYMENT_METHODS.map((method) => (
						<div key={method} className="flex items-center gap-2.5">
							<RadioGroupItem value={method} id={method} />
							<Label htmlFor={method} className="cursor-pointer text-base font-normal">
								{method}
							</Label>
						</div>
					))}
				</RadioGroup>

				<Button onClick={handlePaymentSubmit} className="mt-2 w-full">
					Pay Now
				</Button>
			</Card>
		</div>
	);
};

export default PaymentScreen;
