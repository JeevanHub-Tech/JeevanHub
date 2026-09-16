const cron = require('node-cron');
const mongoose = require('mongoose');

// Models
const Booking = require('./models/Booking');
const DietYoga = require('./models/DietYoga');
const Order = require('./models/Order');

const { createNotification } = require('./controllers/notificationController');
const { sendWhatsAppMessage } = require('./controllers/whatsappController');
const delhiveryService = require('./services/delhiveryService');
const { applyTrackingToOrder } = require('./services/shipmentSync');

// Best-effort reminder dispatch: in-app notification always saved, WhatsApp
// send is fire-and-forget since no verified WhatsApp Business templates exist yet.
async function dispatchReminder({ userId, role, refId, type, message, phone, whatsappTemplate, whatsappComponents }) {
	try {
		await createNotification(userId, role, refId, message, type);
	} catch (error) {
		console.error(`   -> ❌ In-app notification failed:`, error.message);
	}

	if (phone) {
		try {
			await sendWhatsAppMessage(phone, whatsappTemplate, whatsappComponents);
		} catch (error) {
			console.error(`   -> ❌ WhatsApp send failed:`, error.message);
		}
	}
}

// ==========================================
// ⚙️ CONFIGURATION
// ==========================================
const NOTIFICATION_TIME = '31 13 * * *';

// Delhivery polling: every 6 hours (00:00, 06:00, 12:00, 18:00 IST). Scans land
// a few times a day at most, so anything tighter just burns the 750-req/5-min
// rate limit. Retailers on the webhook method are skipped -- Delhivery pushes
// to /api/webhooks/delhivery for them in real time.
const DELIVERY_POLL_TIME = process.env.DELIVERY_POLL_CRON || '0 */6 * * *';

const startScheduler = () => {
	console.log(`📅 Scheduler active. Running at: ${NOTIFICATION_TIME}`);

	cron.schedule(NOTIFICATION_TIME, async () => {
		console.log('\n🔔 --- SCHEDULER TRIGGER START ---');

		// Calculate Tomorrow's date range
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);

		const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
		const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

		try {
			await sendAppointmentReminders(startOfTomorrow, endOfTomorrow);
			await sendDietPlans(tomorrow);
			await sendYogaPlans();
			console.log('✅ All notifications processed.');
		} catch (error) {
			console.error('❌ Global Scheduler Error:', error);
		}

		console.log('🔔 --- SCHEDULER TRIGGER END ---\n');

	}, { scheduled: true, timezone: "Asia/Kolkata" });

	console.log(`📦 Delivery polling active. Running at: ${DELIVERY_POLL_TIME}`);
	cron.schedule(DELIVERY_POLL_TIME, async () => {
		console.log('\n📦 --- DELIVERY POLLING START ---');
		try {
			await pollDeliveryStatuses();
		} catch (error) {
			console.error('❌ Delivery polling error:', error);
		}
		console.log('📦 --- DELIVERY POLLING END ---\n');
	}, { scheduled: true, timezone: "Asia/Kolkata" });
};

// ==========================================
// 1. APPOINTMENT REMINDERS (Using Patient & Doctor Tables)
// ==========================================
async function sendAppointmentReminders(start, end) {
	console.log('👉 Checking Appointments...');

	const bookings = await Booking.find({
		dateOfAppointment: { $gte: start, $lte: end },
		requestAccept: 'accepted'
	})
		.populate('patientId') // Joins with Patient Table
		.populate('doctorId'); // Joins with DoctorData Table

	for (const booking of bookings) {
		// Check if patient and doctor data exist after populate
		if (booking.patientId && booking.patientId.phone && booking.doctorId) {

			// Extract Names from the LINKED tables, not the Booking table string
			const realPatientName = `${booking.patientId.firstName} ${booking.patientId.lastName}`;
			const realDoctorName = `${booking.doctorId.firstname} ${booking.doctorId.lastname}`; // Note: lowercase keys in DoctorData schema

			console.log(`   -> Reminding ${realPatientName} with ${realDoctorName}...`);

			const linkToSend = (booking.meetLink && booking.meetLink !== "no")
				? booking.meetLink
				: "Link will be shared shortly";

			await dispatchReminder({
				userId: booking.patientId._id,
				role: 'patient',
				refId: booking._id.toString(),
				type: 'appointment',
				message: `Reminder: you have an appointment with ${realDoctorName} tomorrow. ${linkToSend}`,
				phone: booking.patientId.phone,
				whatsappTemplate: 'appointment_reminder',
				whatsappComponents: [{
					type: 'body',
					parameters: [
						{ type: 'text', text: realPatientName },
						{ type: 'text', text: realDoctorName },
						{ type: 'text', text: linkToSend }
					]
				}]
			});
		}
	}
}

// ==========================================
// 2. DIET PLANS (Using Patient Table for Name)
// ==========================================
async function sendDietPlans(tomorrowDate) {
	console.log('👉 Checking Diet Plans...');

	const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	const tomorrowDayName = daysOfWeek[tomorrowDate.getDay()];

	const allPlans = await DietYoga.find({}).populate('patient'); // Joins with Patient Table

	for (const plan of allPlans) {
		if (plan.patient && plan.patient.phone) {

			const dailyDiet = plan.diet.weekly[tomorrowDayName];
			if (!dailyDiet) continue;

			const dietSummary = `Breakfast: ${dailyDiet.breakfast || '-'}, Lunch: ${dailyDiet.lunch || '-'}, Dinner: ${dailyDiet.dinner || '-'}`;

			// Use Name from Patient Table
			const realPatientName = `${plan.patient.firstName} ${plan.patient.lastName}`;

			console.log(`   -> Sending ${tomorrowDayName} diet to ${realPatientName}...`);

			await dispatchReminder({
				userId: plan.patient._id,
				role: 'patient',
				refId: plan._id.toString(),
				type: 'diet',
				message: `Your ${tomorrowDayName} diet plan: ${dietSummary}`,
				phone: plan.patient.phone,
				whatsappTemplate: 'diet_plan_reminder',
				whatsappComponents: [{
					type: 'body',
					parameters: [
						{ type: 'text', text: realPatientName },
						{ type: 'text', text: dietSummary }
					]
				}]
			});
		}
	}
}

// ==========================================
// 3. YOGA PLANS (Using Patient Table for Name)
// ==========================================
async function sendYogaPlans() {
	console.log('👉 Checking Yoga Routines...');

	const allPlans = await DietYoga.find({}).populate('patient'); // Joins with Patient Table

	for (const plan of allPlans) {
		if (plan.patient && plan.patient.phone) {

			if ((!plan.yoga.morning || plan.yoga.morning.length === 0) &&
				(!plan.yoga.evening || plan.yoga.evening.length === 0)) {
				continue;
			}

			let yogaMessage = "";
			if (plan.yoga.morning && plan.yoga.morning.length > 0) {
				yogaMessage += "☀️ Morning: ";
				const morningDetails = plan.yoga.morning.map(item => {
					return item.link ? `${item.name} (${item.link})` : item.name;
				}).join(", ");
				yogaMessage += morningDetails + ". ";
			}

			if (plan.yoga.evening && plan.yoga.evening.length > 0) {
				yogaMessage += "🌙 Evening: ";
				const eveningDetails = plan.yoga.evening.map(item => {
					return item.link ? `${item.name} (${item.link})` : item.name;
				}).join(", ");
				yogaMessage += eveningDetails;
			}

			// Use Name from Patient Table
			const realPatientName = `${plan.patient.firstName} ${plan.patient.lastName}`;
			console.log(`   -> Sending Yoga routine to ${realPatientName}...`);

			await dispatchReminder({
				userId: plan.patient._id,
				role: 'patient',
				refId: plan._id.toString(),
				type: 'yoga',
				message: `Your yoga routine for tomorrow: ${yogaMessage}`,
				phone: plan.patient.phone,
				whatsappTemplate: 'yoga_plan_reminder',
				whatsappComponents: [{
					type: 'body',
					parameters: [
						{ type: 'text', text: realPatientName },
						{ type: 'text', text: yogaMessage }
					]
				}]
			});
		}
	}
}

// ==========================================
// 4. DELHIVERY DELIVERY STATUS POLLING
// ==========================================
//
// Safety net for retailers on the apiToken/oauth2 methods: even if nobody opens
// the tracking dialog, delivery gets detected (and the 48h payout hold starts)
// within 6 hours of the carrier scan. Webhook-method retailers are skipped --
// Delhivery pushes their scans to /api/webhooks/delhivery in real time, and we
// hold no outbound credentials for them anyway.
async function pollDeliveryStatuses() {
	const orders = await Order.find({
		orderStatus: { $in: ['shipped', 'processing'] },
		'shipments.platform': 'delhivery',
		'shipments.trackingId': { $ne: null }
	}).populate('items.medicineId');

	if (orders.length === 0) {
		console.log('👉 No in-flight Delhivery shipments to poll.');
		return { polled: 0, updated: 0, delivered: 0, skipped: 0, errors: 0 };
	}

	console.log(`👉 Polling ${orders.length} in-flight Delhivery order(s)...`);

	// One retailer usually owns many in-flight orders, so cache the credential
	// lookup per run instead of re-reading (and re-decrypting) the same doc.
	const retailerCache = new Map();
	const stats = { polled: 0, updated: 0, delivered: 0, skipped: 0, errors: 0 };

	for (const order of orders) {
		let orderChanged = false;

		for (const shipment of order.shipments || []) {
			if (shipment.platform !== 'delhivery' || !shipment.trackingId) continue;

			const retailerId = shipment.retailerId;
			if (!retailerId) {
				// Pre-integration order, or the AWB was attached before we started
				// recording who shipped it. Nothing to authenticate with.
				stats.skipped += 1;
				continue;
			}

			const cacheKey = String(retailerId);
			if (!retailerCache.has(cacheKey)) {
				try {
					retailerCache.set(cacheKey, await delhiveryService.findRetailerWithCredentials(retailerId));
				} catch (error) {
					console.error(`   -> ❌ Could not load retailer ${cacheKey}:`, error.message);
					retailerCache.set(cacheKey, null);
				}
			}
			const retailer = retailerCache.get(cacheKey);

			if (!delhiveryService.canPoll(retailer)) {
				stats.skipped += 1;
				continue;
			}

			stats.polled += 1;
			let tracking;
			try {
				tracking = await delhiveryService.trackShipment(retailer, shipment.trackingId);
			} catch (error) {
				stats.errors += 1;
				console.error(`   -> ❌ AWB ${shipment.trackingId}:`, error.message);
				// Surface the failure on the order so the retailer sees why tracking
				// looks stale, without wiping the last good timeline.
				shipment.lastPollError = error.message;
				shipment.lastPolledAt = new Date();
				orderChanged = true;
				continue;
			}

			try {
				const result = applyTrackingToOrder(order, shipment, tracking);
				orderChanged = true;

				if (result.statusChanged) stats.updated += 1;
				if (result.becameDelivered) stats.delivered += 1;

				if (result.becameDelivered || result.becameCancelled) {
					const shortId = order._id.toString().slice(-6);
					await dispatchReminder({
						userId: order.buyer.buyerId,
						role: order.buyer.type.toLowerCase(),
						refId: order._id.toString(),
						type: 'order',
						message: result.becameDelivered
							? `Your order #${shortId} has been delivered.`
							: `Your order #${shortId} is being returned to the seller by the courier.`
					});
					console.log(`   -> 📦 Order #${shortId}: ${result.previousStatus} -> ${order.orderStatus}${result.payoutHeld ? ' (payout hold started)' : ''}`);
				}
			} catch (error) {
				stats.errors += 1;
				console.error(`   -> ❌ Could not apply tracking to order ${order._id}:`, error.message);
			}
		}

		if (orderChanged) {
			try {
				await order.save();
			} catch (saveError) {
				console.error(`   -> ❌ Could not save order ${order._id}:`, saveError.message);
			}
		}
	}

	console.log(`✅ Delivery poll done. polled=${stats.polled} updated=${stats.updated} delivered=${stats.delivered} skipped=${stats.skipped} errors=${stats.errors}`);
	return stats;
}

// ==========================================
// Password Reset OTP
// ==========================================
async function sendOTPWhatsApp(phone, firstName, otp) {
	try {
		const components = [
			{
				type: "body",
				parameters: [
					{ type: "text", text: firstName }, // {{1}} User's Name
					{ type: "text", text: otp }       // {{2}} The 5-digit OTP
				]
			}
		];

		const { sendWhatsAppMessage } = require('./controllers/whatsappController');
		
		await sendWhatsAppMessage(
			phone,
			"password_reset_otp", 
			components
		);
		console.log(`✅ OTP sent to ${phone}`);
	} catch (error) {
		console.error("❌ WhatsApp OTP Error:", error);
		throw new Error("Failed to send WhatsApp message");
	}
}


module.exports = {
	startScheduler,
	sendOTPWhatsApp,
	// Exported so it can also be triggered on demand (see cronController.pollDeliveries),
	// which is how you test it without waiting for the 6-hourly tick.
	pollDeliveryStatuses
};