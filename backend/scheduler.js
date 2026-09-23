const cron = require('node-cron');
const mongoose = require('mongoose');

// Models
const Booking = require('./models/Booking');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const DietYoga = require('./models/DietYoga');
const Order = require('./models/Order');
const AyurvedaDietPlan = require('./models/AyurvedaDietPlan');
const AyurvedaYogaPlan = require('./models/AyurvedaYogaPlan');
const Notification = require('./models/Notification');

const { createNotification } = require('./controllers/notificationController');
const { sendWhatsAppMessage } = require('./controllers/whatsappController');
const delhiveryService = require('./services/delhiveryService');
const { applyTrackingToOrder } = require('./services/shipmentSync');

// Best-effort reminder dispatch: in-app notification always saved, WhatsApp
// send is fire-and-forget since no verified WhatsApp Business templates exist yet.
async function dispatchReminder({ userId, role, refId, type, message, phone, whatsappTemplate, whatsappComponents }) {
	// For daily routine reminders ('diet' / 'yoga'), auto-archive prior unread reminders
	// so the patient's inbox only keeps the fresh active routine rather than accumulating daily spam.
	if (type === 'diet' || type === 'yoga') {
		try {
			await Notification.updateMany(
				{ userId, role, type, isRead: false },
				{ $set: { isRead: true } }
			);
		} catch (e) {
			console.error(`   -> ⚠️ Failed to archive old ${type} reminders:`, e.message);
		}
	}

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
// ⚙️ CONFIGURATION & TIMERS
// ==========================================
// Morning routines (Yoga + Diet): 4:00 AM IST
const MORNING_ROUTINE_TIME = process.env.MORNING_ROUTINE_TIME || '0 4 * * *';
// Evening appointment reminders for tomorrow: 8:00 PM IST
const APPOINTMENT_REMINDER_TIME = process.env.APPOINTMENT_REMINDER_TIME || '0 20 * * *';

// Delhivery polling: every 6 hours (00:00, 06:00, 12:00, 18:00 IST). Scans land
// a few times a day at most, so anything tighter just burns the 750-req/5-min
// rate limit. Retailers on the webhook method are skipped -- Delhivery pushes
// to /api/webhooks/delhivery for them in real time.
const DELIVERY_POLL_TIME = process.env.DELIVERY_POLL_CRON || '0 */6 * * *';

const startScheduler = () => {
	console.log(`📅 Schedulers active:`);
	console.log(`   - Morning Routines (Diet & Yoga): ${MORNING_ROUTINE_TIME} (Asia/Kolkata)`);
	console.log(`   - Evening Appointment Reminders: ${APPOINTMENT_REMINDER_TIME} (Asia/Kolkata)`);

	// 1. Morning Cron: Same-Day Diet & Yoga Routines (4:00 AM)
	cron.schedule(MORNING_ROUTINE_TIME, async () => {
		console.log('\n☀️ --- MORNING ROUTINES SCHEDULER START ---');
		const today = new Date();
		try {
			await sendDietPlans(today);
			await sendYogaPlans();
			console.log('✅ Morning routine notifications processed.');
		} catch (error) {
			console.error('❌ Morning Routines Error:', error);
		}
		console.log('☀️ --- MORNING ROUTINES SCHEDULER END ---\n');
	}, { scheduled: true, timezone: "Asia/Kolkata" });

	// 2. Evening Cron: Next-Day Appointment Reminders (8:00 PM)
	cron.schedule(APPOINTMENT_REMINDER_TIME, async () => {
		console.log('\n🌙 --- APPOINTMENT REMINDERS SCHEDULER START ---');
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);

		const startOfTomorrow = new Date(new Date(tomorrow).setHours(0, 0, 0, 0));
		const endOfTomorrow = new Date(new Date(tomorrow).setHours(23, 59, 59, 999));

		try {
			await sendAppointmentReminders(startOfTomorrow, endOfTomorrow);
			console.log('✅ Appointment reminders processed.');
		} catch (error) {
			console.error('❌ Appointment Reminders Error:', error);
		}
		console.log('🌙 --- APPOINTMENT REMINDERS SCHEDULER END ---\n');
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
		.populate('doctorId'); // Joins with Doctor Table

	for (const booking of bookings) {
		// Check if patient and doctor data exist after populate
		if (booking.patientId && booking.doctorId) {
			const doctorFirst = booking.doctorId.firstName || booking.doctorId.firstname || '';
			const doctorLast = booking.doctorId.lastName || booking.doctorId.lastname || '';
			let rawDocName = [doctorFirst, doctorLast].filter(Boolean).join(' ').trim() || booking.doctorName || 'your doctor';
			const realDoctorName = rawDocName.toLowerCase().startsWith('dr.') || rawDocName.toLowerCase().startsWith('dr ')
				? rawDocName
				: `Dr. ${rawDocName}`;

			const patientFirst = booking.patientId.firstName || '';
			const patientLast = booking.patientId.lastName || '';
			const realPatientName = [patientFirst, patientLast].filter(Boolean).join(' ').trim() || booking.patientName || 'Patient';

			console.log(`   -> Reminding ${realPatientName} with ${realDoctorName}...`);

			const meetUrl = (booking.dailyRoomUrl && booking.dailyRoomUrl !== 'no')
				? booking.dailyRoomUrl
				: (booking.meetLink && booking.meetLink !== 'no' ? booking.meetLink : '');

			const linkToSend = meetUrl || 'Link will be shared shortly';
			const appointmentMessage = meetUrl
				? `Reminder: you have an appointment with ${realDoctorName} tomorrow. Join link: ${meetUrl}`
				: `Reminder: you have an appointment with ${realDoctorName} tomorrow. Link will be shared shortly.`;

			await dispatchReminder({
				userId: booking.patientId._id,
				role: 'patient',
				refId: booking._id.toString(),
				type: 'appointment',
				message: appointmentMessage,
				phone: booking.patientId.phone || null,
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
// 2. DIET PLANS (Same-Day Morning Dispatch with Deduplication)
// ==========================================
async function sendDietPlans(targetDate = new Date()) {
	console.log('👉 Checking Diet Plans...');

	const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	const dayName = daysOfWeek[targetDate.getDay()];
	const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

	const processedPatients = new Set();

	// 1. Primary: Check modern AyurvedaDietPlan collection
	const modernPlans = await AyurvedaDietPlan.find({}).populate('patientId');
	for (const plan of modernPlans) {
		if (!plan.patientId || processedPatients.has(plan.patientId._id.toString())) continue;

		const activeWeeklyPlan = (plan.doctorReview?.published && plan.doctorReview?.weeklyPlan?.length)
			? plan.doctorReview.weeklyPlan
			: plan.weeklyPlan;

		const dayPlan = activeWeeklyPlan?.find(d => d.day?.toLowerCase() === dayName);
		if (!dayPlan) continue;

		const b = (dayPlan.breakfast?.items || []).join(', ') || dayPlan.breakfast?.portion || '-';
		const l = (dayPlan.lunch?.items || []).join(', ') || dayPlan.lunch?.portion || '-';
		const d = (dayPlan.dinner?.items || []).join(', ') || dayPlan.dinner?.portion || '-';
		const dietSummary = `Breakfast: ${b}, Lunch: ${l}, Dinner: ${d}`;

		const realPatientName = [plan.patientId.firstName, plan.patientId.lastName].filter(Boolean).join(' ').trim() || 'Patient';
		processedPatients.add(plan.patientId._id.toString());

		console.log(`   -> Sending today's (${capitalizedDay}) diet to ${realPatientName}...`);

		await dispatchReminder({
			userId: plan.patientId._id,
			role: 'patient',
			refId: plan._id.toString(),
			type: 'diet',
			message: `🌿 Today's diet plan (${capitalizedDay}): ${dietSummary}`,
			phone: plan.patientId.phone || null,
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

	// 2. Fallback: Legacy DietYoga collection (for patients not yet in AyurvedaDietPlan)
	const legacyPlans = await DietYoga.find({}).populate('patient');
	for (const plan of legacyPlans) {
		if (!plan.patient || processedPatients.has(plan.patient._id.toString())) continue;

		const dailyDiet = plan.diet?.weekly?.[dayName];
		if (!dailyDiet) continue;

		const dietSummary = `Breakfast: ${dailyDiet.breakfast || '-'}, Lunch: ${dailyDiet.lunch || '-'}, Dinner: ${dailyDiet.dinner || '-'}`;
		const realPatientName = [plan.patient.firstName, plan.patient.lastName].filter(Boolean).join(' ').trim() || 'Patient';
		processedPatients.add(plan.patient._id.toString());

		console.log(`   -> Sending today's (${capitalizedDay}) legacy diet to ${realPatientName}...`);

		await dispatchReminder({
			userId: plan.patient._id,
			role: 'patient',
			refId: plan._id.toString(),
			type: 'diet',
			message: `🌿 Today's diet plan (${capitalizedDay}): ${dietSummary}`,
			phone: plan.patient.phone || null,
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

// ==========================================
// 3. YOGA PLANS (Same-Day Morning Dispatch with Deduplication)
// ==========================================
async function sendYogaPlans() {
	console.log('👉 Checking Yoga Routines...');

	const processedPatients = new Set();

	// 1. Primary: Check modern AyurvedaYogaPlan collection
	const modernPlans = await AyurvedaYogaPlan.find({}).populate('patientId');
	for (const plan of modernPlans) {
		if (!plan.patientId || processedPatients.has(plan.patientId._id.toString())) continue;

		const morningList = (plan.doctorReview?.published && plan.doctorReview?.morning?.length)
			? plan.doctorReview.morning
			: plan.morning;
		const eveningList = (plan.doctorReview?.published && plan.doctorReview?.evening?.length)
			? plan.doctorReview.evening
			: plan.evening;

		if ((!morningList || morningList.length === 0) && (!eveningList || eveningList.length === 0)) {
			continue;
		}

		let yogaMessage = "";
		if (morningList && morningList.length > 0) {
			yogaMessage += "☀️ Morning: " + morningList.map(item => item.name).join(", ") + ". ";
		}
		if (eveningList && eveningList.length > 0) {
			yogaMessage += "🌙 Evening: " + eveningList.map(item => item.name).join(", ");
		}

		const realPatientName = [plan.patientId.firstName, plan.patientId.lastName].filter(Boolean).join(' ').trim() || 'Patient';
		processedPatients.add(plan.patientId._id.toString());

		console.log(`   -> Sending today's Yoga routine to ${realPatientName}...`);

		await dispatchReminder({
			userId: plan.patientId._id,
			role: 'patient',
			refId: plan._id.toString(),
			type: 'yoga',
			message: `🧘 Today's yoga routine: ${yogaMessage}`,
			phone: plan.patientId.phone || null,
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

	// 2. Fallback: Legacy DietYoga collection (for patients not yet in AyurvedaYogaPlan)
	const legacyPlans = await DietYoga.find({}).populate('patient');
	for (const plan of legacyPlans) {
		if (!plan.patient || processedPatients.has(plan.patient._id.toString())) continue;

		const morningList = plan.yoga?.morning;
		const eveningList = plan.yoga?.evening;

		if ((!morningList || morningList.length === 0) && (!eveningList || eveningList.length === 0)) {
			continue;
		}

		let yogaMessage = "";
		if (morningList && morningList.length > 0) {
			yogaMessage += "☀️ Morning: " + morningList.map(item => item.name).join(", ") + ". ";
		}
		if (eveningList && eveningList.length > 0) {
			yogaMessage += "🌙 Evening: " + eveningList.map(item => item.name).join(", ");
		}

		const realPatientName = [plan.patient.firstName, plan.patient.lastName].filter(Boolean).join(' ').trim() || 'Patient';
		processedPatients.add(plan.patient._id.toString());

		console.log(`   -> Sending today's legacy Yoga routine to ${realPatientName}...`);

		await dispatchReminder({
			userId: plan.patient._id,
			role: 'patient',
			refId: plan._id.toString(),
			type: 'yoga',
			message: `🧘 Today's yoga routine: ${yogaMessage}`,
			phone: plan.patient.phone || null,
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