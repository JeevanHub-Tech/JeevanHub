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
			if (booking.doctorJoinedAt) {
				booking.payoutStatus = "released";
				result.bookingsReleased += 1;
			} else {
				booking.payoutStatus = "disputed";
				booking.dispute = {
					reason: "Auto-flagged: the doctor never opened the video call room for this appointment.",
					raisedAt: now,
				};
				result.bookingsFlaggedNoShow += 1;
			}
			await booking.save();
		}

		const dueOrders = await Order.find({ payoutStatus: "held", payoutHoldUntil: { $lte: now } });
		for (const order of dueOrders) {
			order.payoutStatus = "released";
			result.ordersReleased += 1;
			await order.save();

			// Release Razorpay Route transfers from hold
			const getRazorpay = require('../services/razorpayService');
			const razorpay = getRazorpay();
			const transferIds = [...new Set(order.items.map(i => i.razorpayTransferId).filter(Boolean))];
			for (const tId of transferIds) {
				try {
					await razorpay.transfers.edit(tId, { on_hold: false });
				} catch (e) {
					console.error("Error releasing Razorpay transfer hold for:", tId, e);
				}
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
