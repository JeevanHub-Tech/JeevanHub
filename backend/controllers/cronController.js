const Booking = require("../models/Booking");
const Order = require("../models/Order");
const Doctor = require("../models/Doctor");
const Retailer = require("../models/Retailer");
const cashfreeService = require("../services/cashfreeService");
const { createNotification } = require("./notificationController");

// Settlement sweep for the payout escrow (see Booking.payoutStatus / Order.payoutStatus).
// Meant to be hit by an external cron pinger (cron-job.org, etc.) every 15-30 min --
// NOT a long-running worker, since Render's free tier can't keep one alive between
// requests. Protected by a shared secret header, not a user session, since the
// caller is a machine, not a logged-in admin.
//
// Bookings (Doctors):
// - Payout lock-in period: 7 days after appointment / slot-end.
// - Platform commission: 12% on consultation + diet plan fee.
// - Requirements: Doctor must have attended (doctorJoinedAt is set), and diet plan
//   must be completed if requested. Otherwise auto-flagged as disputed.
// - Disbursed directly via Cashfree Payouts into the doctor's UPI ID or Bank Account.
//
// Orders (Retailers):
// - Payout lock-in period: 7 days after per-shipment delivery.
// - Platform commission: 2% on items subtotal + 100% shipping charge.
// - Disbursed directly via Cashfree Payouts into the retailer's primary payout method.
exports.settlePayouts = async (req, res) => {
	const secret = req.header("x-cron-secret");
	if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
		return res.status(401).json({ error: "Unauthorized" });
	}

	const now = new Date();
	const result = {
		bookingsReleased: 0,
		bookingsTransferred: 0,
		bookingsFlaggedNoShow: 0,
		bookingsFlaggedDietIncomplete: 0,
		bookingsFailed: 0,
		ordersReleased: 0,
		ordersTransferred: 0,
		ordersFailed: 0,
	};

	try {
		// --- 1. Settle Doctor Consultation Bookings ---
		const dueBookings = await Booking.find({ payoutStatus: "held", payoutHoldUntil: { $lte: now } });
		for (const booking of dueBookings) {
			if (!booking.doctorJoinedAt) {
				booking.payoutStatus = "disputed";
				booking.dispute = {
					reason: "Auto-flagged: the doctor never opened the video call room for this appointment.",
					raisedAt: now,
				};
				result.bookingsFlaggedNoShow += 1;
				await booking.save();
				continue;
			}
			
			if (booking.dietPlanRequested && booking.dietPlanStatus !== "completed") {
				// Doctor attended consultation call, but did not upload/publish the requested personalized diet plan
				booking.payoutStatus = "disputed";
				booking.dispute = {
					reason: `Auto-flagged: Doctor did not upload/publish the requested Personalized Diet Plan (₹${booking.dietPlanFee || 299}) within the fulfillment window.`,
					raisedAt: now,
				};
				result.bookingsFlaggedDietIncomplete += 1;
				await booking.save();
				continue;
			}

			// Doctor fulfilled all requirements: calculate 12% commission and net payout
			const DOCTOR_COMMISSION_RATE = process.env.DOCTOR_COMMISSION_PERCENT
				? (parseFloat(process.env.DOCTOR_COMMISSION_PERCENT) / 100)
				: 0.12;

			const totalPaid = Number(booking.amountPaid) || 0;
			const commissionAmount = Math.round(totalPaid * DOCTOR_COMMISSION_RATE * 100) / 100;
			const netPayout = Math.max(0, Math.round((totalPaid - commissionAmount) * 100) / 100);

			booking.paymentDetails = booking.paymentDetails || {};
			booking.paymentDetails.payoutAmount = netPayout;
			booking.paymentDetails.commissionAmount = commissionAmount;

			// Locate Doctor payout destination (UPI ID or Bank Details)
			const doctor = await Doctor.findById(booking.doctorId);
			const doctorPayoutMethod = (doctor?.bankDetails?.isSubmitted && (doctor.bankDetails.accountNumber || doctor.bankDetails.upiId))
				? {
					type: doctor.bankDetails.upiId ? 'upi' : 'bank_account',
					accountHolderName: doctor.bankDetails.accountHolderName || `${doctor.firstName} ${doctor.lastName}`,
					accountNumber: doctor.bankDetails.accountNumber,
					ifscCode: doctor.bankDetails.ifscCode,
					bankName: doctor.bankDetails.bankName,
					upiId: doctor.bankDetails.upiId
				}
				: (doctor?.upiId ? {
					type: 'upi',
					upiId: doctor.upiId,
					accountHolderName: `${doctor.firstName} ${doctor.lastName}`
				} : null);

			if (doctorPayoutMethod && doctor && netPayout > 0) {
				try {
					const payoutRes = await cashfreeService.processEntityPayout({
						entityType: 'doctor',
						entity: doctor,
						payoutMethod: doctorPayoutMethod,
						amount: netPayout,
						referenceId: `bkg_${booking._id.toString().slice(-8)}`,
						remarks: `JH Payout Bkg ${booking._id.toString().slice(-6)}`
					});

					booking.payoutStatus = "transferred";
					booking.paymentDetails.cashfreeTransferId = payoutRes.cfTransferId || payoutRes.transferId;
					booking.paymentDetails.transferId = payoutRes.transferId;
					booking.paymentDetails.transferredAt = now;
					result.bookingsTransferred += 1;

					const destination = doctorPayoutMethod.type === 'upi'
						? `UPI ID (${doctorPayoutMethod.upiId})`
						: `Bank Account (ending in ${doctorPayoutMethod.accountNumber ? doctorPayoutMethod.accountNumber.slice(-4) : 'XXXX'})`;

					await createNotification(
						doctor._id,
						"doctor",
						booking._id,
						`Payout of ₹${netPayout.toFixed(2)} (Fee: ₹${totalPaid.toFixed(2)} - 12% commission: ₹${commissionAmount.toFixed(2)}) for Appointment #${booking._id.toString().slice(-6)} has been disbursed to your ${destination}. Ref: ${payoutRes.cfTransferId || payoutRes.transferId}`,
						"booking"
					);
				} catch (transferErr) {
					console.error(`Failed to disburse payout for booking ${booking._id}, doctor ${booking.doctorId}:`, transferErr.message);
					booking.payoutStatus = "failed";
					booking.paymentDetails.payoutFailureReason = transferErr.message;
					result.bookingsFailed += 1;
				}
			} else {
				// Doctor has not configured payout destination yet; mark released for manual settlement
				booking.payoutStatus = "released";
				result.bookingsReleased += 1;
			}

			await booking.save();
		}

		// --- 2. Settle Legacy Single-Retailer Orders (if any) ---
		const dueOrders = await Order.find({ payoutStatus: "held", payoutHoldUntil: { $lte: now } });
		for (const order of dueOrders) {
			order.payoutStatus = "released";
			result.ordersReleased += 1;
			await order.save();
		}

		// --- 3. Settle Multi-Vendor Per-Shipment Orders (Retailers) ---
		const dueShipmentOrders = await Order.find({
			paymentMethod: "onlinePayment",
			paymentStatus: "paid",
			"shipments.payout.status": "held",
			"shipments.payout.holdUntil": { $lte: now }
		}).populate("items.medicineId");

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

					const RETAILER_COMMISSION_RATE = process.env.RETAILER_COMMISSION_PERCENT
						? (parseFloat(process.env.RETAILER_COMMISSION_PERCENT) / 100)
						: (process.env.PLATFORM_COMMISSION_PERCENT ? parseFloat(process.env.PLATFORM_COMMISSION_PERCENT) / 100 : 0.02);

					const commissionAmount = Math.round(itemsSubtotal * RETAILER_COMMISSION_RATE * 100) / 100;
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

					if (primaryPayoutMethod && retailer && payoutAmount > 0) {
						try {
							const payoutRes = await cashfreeService.processEntityPayout({
								entityType: 'retailer',
								entity: retailer,
								payoutMethod: primaryPayoutMethod,
								amount: payoutAmount,
								referenceId: `ord_${order._id.toString().slice(-8)}_${retailerId.toString().slice(-6)}`,
								remarks: `JH Payout Order ${order._id.toString().slice(-6)}`
							});

							shipment.payout.cashfreeTransferId = payoutRes.cfTransferId || payoutRes.transferId;
							shipment.payout.status = "transferred";
							shipment.payout.transferredAt = now;
							orderModified = true;
							result.ordersTransferred += 1;

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
								`Payout of ₹${payoutAmount.toFixed(2)}${breakdownText} for Order #${order._id.toString().slice(-6)} has been disbursed to your ${destination}. Ref: ${payoutRes.cfTransferId || payoutRes.transferId}`,
								"order"
							);
						} catch (transferErr) {
							console.error(`Failed to disburse payout for order ${order._id}, retailer ${retailerId}:`, transferErr.message);
							shipment.payout.status = "failed";
							shipment.payout.failureReason = transferErr.message;
							orderModified = true;
							result.ordersFailed += 1;
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
