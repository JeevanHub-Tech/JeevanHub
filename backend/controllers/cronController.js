const Booking = require("../models/Booking");
const Order = require("../models/Order");

// Settlement sweep for the payout escrow (see Booking.payoutStatus / Order.payoutStatus).
// Meant to be hit by an external cron pinger (cron-job.org, etc.) every 15-30 min --
// NOT a long-running worker, since Render's free tier can't keep one alive between
// requests. Protected by a shared secret header, not a user session, since the
// caller is a machine, not a logged-in admin.
//
// Bookings: a held payout whose hold window has passed either releases (the doctor
// actually opened the call room -- doctorJoinedAt is set) or gets auto-flagged as
// disputed (no doctorJoinedAt -- a likely no-show), landing it in the same admin
// review queue as a patient-raised dispute instead of paying out unattended.
//
// Orders: there's no attendance-equivalent signal yet (no patient "I received this"
// confirmation flow), so a held order payout just auto-releases once its window
// passes -- a patient who never got their delivery has to dispute before then.
exports.settlePayouts = async (req, res) => {
	const secret = req.header("x-cron-secret");
	if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const now = new Date();
	const result = {
		bookingsReleased: 0,
		bookingsFlaggedNoShow: 0,
		ordersReleased: 0,
	};

	try {
		const dueBookings = await Booking.find({ payoutStatus: "held", payoutHoldUntil: { $lte: now } });
		for (const booking of dueBookings) {
			if (!booking.doctorJoinedAt) {
				booking.payoutStatus = "disputed";
				booking.dispute = {
					reason: "Auto-flagged: the doctor never opened the video call room for this appointment.",
					raisedAt: now,
				};
				result.bookingsFlaggedNoShow += 1;
			} else if (booking.dietPlanRequested && booking.dietPlanStatus !== "completed") {
				// Doctor attended the consultation call, but did not upload/publish the requested personalized diet plan
				booking.payoutStatus = "disputed";
				booking.dispute = {
					reason: `Auto-flagged: Doctor did not upload/publish the requested Personalized Diet Plan (₹${booking.dietPlanFee || 299}) within the 48-hour fulfillment window.`,
					raisedAt: now,
				};
				result.bookingsFlaggedNoShow += 1;
			} else {
				booking.payoutStatus = "released";
				result.bookingsReleased += 1;
			}
			await booking.save();
		}

		const dueOrders = await Order.find({ payoutStatus: "held", payoutHoldUntil: { $lte: now } });
		for (const order of dueOrders) {
			order.payoutStatus = "released";
			result.ordersReleased += 1;
			await order.save();

			// Release Razorpay Route transfers from hold if any were created on checkout
			try {
				const getRazorpay = require('../services/razorpayService');
				const razorpay = getRazorpay();
				const transferIds = [...new Set(order.items.map(i => i.razorpayTransferId).filter(Boolean))];
				for (const tId of transferIds) {
					try {
						await razorpay.transfers.edit(tId, { on_hold: false });
					} catch (e) {
						console.error("Error releasing Razorpay transfer hold for:", tId, e.message);
					}
				}
			} catch (e) {
				// Razorpay service may not be configured in local test
			}
		}

		// Process multi-vendor per-shipment 7-day holds
		const dueShipmentOrders = await Order.find({
			paymentMethod: "onlinePayment",
			paymentStatus: "paid",
			"shipments.payout.status": "held",
			"shipments.payout.holdUntil": { $lte: now }
		}).populate("items.medicineId");

		const Retailer = require("../models/Retailer");
		const { createNotification } = require("./notificationController");

		for (const order of dueShipmentOrders) {
			let orderModified = false;
			for (const shipment of (order.shipments || [])) {
				if (shipment.payout?.status === "held" && shipment.payout.holdUntil && shipment.payout.holdUntil <= now) {
					const retailerId = shipment.retailerId;
					const retailer = await Retailer.findById(retailerId);

					// Calculate items total for this specific retailer
					const retailerItems = (order.items || []).filter(item => {
						const rId = item.medicineId?.retailerId?._id || item.medicineId?.retailerId;
						return rId && String(rId) === String(retailerId);
					});
					const itemsSubtotal = retailerItems.reduce((acc, i) => acc + (i.subTotal || 0), 0);

					const COMMISSION_RATE = process.env.PLATFORM_COMMISSION_PERCENT
						? (parseFloat(process.env.PLATFORM_COMMISSION_PERCENT) / 100)
						: 0.02;

					const commissionAmount = Math.round(itemsSubtotal * COMMISSION_RATE * 100) / 100;
					const itemsAfterCommission = Math.max(0, itemsSubtotal - commissionAmount);

					const totalRetailersInOrder = new Set((order.items || []).map(i => {
						const rId = i.medicineId?.retailerId?._id || i.medicineId?.retailerId;
						return rId ? String(rId) : null;
					}).filter(Boolean)).size || 1;

					const shippingAmount = shipment.shippingCharge !== undefined && shipment.shippingCharge !== null && shipment.shippingCharge > 0
						? shipment.shippingCharge
						: (order.shippingCharge ? Math.round((order.shippingCharge / totalRetailersInOrder) * 100) / 100 : 0);

					const netPayout = Math.round((itemsAfterCommission + shippingAmount) * 100) / 100;
					const payoutAmount = shipment.payout.amount > 0 ? shipment.payout.amount : netPayout;

					shipment.payout.amount = payoutAmount;
					shipment.payout.itemsSubtotal = itemsSubtotal;
					shipment.payout.commissionAmount = commissionAmount;
					shipment.payout.shippingAmount = shippingAmount;

					// Find retailer's primary payout method (or fallback to bankDetails or first method)
					const primaryPayoutMethod = (retailer?.payoutMethods || []).find(m => m.isPrimary) ||
						retailer?.payoutMethods?.[0] ||
						(retailer?.bankDetails?.isSubmitted ? {
							type: retailer.bankDetails.upiId ? 'upi' : 'bank_account',
							accountHolderName: retailer.bankDetails.accountHolderName || `${retailer.firstName} ${retailer.lastName}`,
							accountNumber: retailer.bankDetails.accountNumber,
							ifscCode: retailer.bankDetails.ifscCode,
							bankName: retailer.bankDetails.bankName,
							upiId: retailer.bankDetails.upiId
						} : null);

					if (primaryPayoutMethod && retailer) {
						try {
							const razorpayXService = require("../services/razorpayXService");
							const payoutRes = await razorpayXService.processPayout({
								retailer,
								payoutMethod: primaryPayoutMethod,
								amountInRupees: payoutAmount,
								orderId: order._id
							});

							shipment.payout.razorpayTransferId = payoutRes.payoutId;
							shipment.payout.status = "transferred";
							shipment.payout.transferredAt = now;
							orderModified = true;
							result.ordersReleased += 1;

							const destination = primaryPayoutMethod.type === 'upi'
								? `UPI ID (${primaryPayoutMethod.upiId})`
								: `Bank Account (ending in ${primaryPayoutMethod.accountNumber ? primaryPayoutMethod.accountNumber.slice(-4) : 'XXXX'})`;

							const breakdownText = commissionAmount > 0 || shippingAmount > 0
								? ` (Items: ₹${itemsSubtotal.toFixed(2)} - 2% fee: ₹${commissionAmount.toFixed(2)} + Shipping: ₹${shippingAmount.toFixed(2)})`
								: '';

							await createNotification(
								retailerId,
								"retailer",
								order._id,
								`Payout of ₹${payoutAmount.toFixed(2)}${breakdownText} for Order #${order._id.toString().slice(-6)} has been disbursed to your ${destination}. Ref: ${payoutRes.payoutId}`,
								"order"
							);
						} catch (transferErr) {
							console.error(`Failed to disburse payout for order ${order._id}, retailer ${retailerId}:`, transferErr.message);
							shipment.payout.status = "failed";
							shipment.payout.failureReason = transferErr.message;
							orderModified = true;
						}
					} else {
						// In case no payout method configured, mark released for manual settlement
						shipment.payout.status = "released";
						shipment.payout.transferredAt = now;
						orderModified = true;
						result.ordersReleased += 1;
					}
				}
			}
			if (orderModified) {
				await order.save();
			}
		}

		return res.status(200).json({ message: "Settlement sweep complete", ...result });
	} catch (error) {
		console.error("Error running settlement sweep:", error);
		return res.status(500).json({ error: "Server error" });
	}
};

// Manual trigger for the Delhivery delivery-status poll that otherwise runs on a
// 6-hourly cron inside the app process. Same shared-secret protection as the
// settlement sweep. Useful both for testing and as a backstop on hosts that
// restart the process often enough to miss a tick.
exports.pollDeliveries = async (req, res) => {
	const secret = req.header("x-cron-secret");
	if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	try {
		// Required lazily: scheduler.js pulls in the notification/WhatsApp stack,
		// and this keeps the module graph the same shape it was before.
		const { pollDeliveryStatuses } = require("../scheduler");
		const stats = await pollDeliveryStatuses();
		return res.status(200).json({ message: "Delivery poll complete", ...stats });
	} catch (error) {
		console.error("Error running delivery poll:", error);
		return res.status(500).json({ error: "Server error" });
	}
};
