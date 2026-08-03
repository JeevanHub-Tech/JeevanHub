const cron = require('node-cron');
const mongoose = require('mongoose');

// Models
const Booking = require('./models/Booking');
const DietYoga = require('./models/DietYoga');

const { createNotification } = require('./controllers/notificationController');
const { sendWhatsAppMessage } = require('./controllers/whatsappController');

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
	sendOTPWhatsApp
};