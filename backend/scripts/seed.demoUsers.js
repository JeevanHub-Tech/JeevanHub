// Seed/upsert one demo patient + one demo doctor for local testing.
//
// Usage (from backend/):
//   node scripts/seed.demoUsers.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Booking = require('../models/Booking');
const DietYoga = require('../models/DietYoga');
const Retailer = require('../models/Retailer');
const Medicine = require('../models/Medicine');

const PATIENT = {
	email: 'patient2@demo.com',
	password: 'Patient@123',
	firstName: 'Demo',
	lastName: 'Patient',
	phone: '9876543211',
	dob: '1995-01-01',
	gender: 'Male',
	zipCode: '110001',
	address: 'Demo Address, New Delhi',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOT_TIMES = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

function buildAvailableSlots() {
	const availableSlots = {};
	for (const day of DAYS) {
		availableSlots[day] = SLOT_TIMES.map((startTime) => ({
			startTime,
			duration: 30,
			fee: 500,
			consultationType: 'Online',
			sessionType: '1-to-1',
			maxCapacity: 1,
			isDisabled: false,
		}));
	}
	return availableSlots;
}

const DOCTOR = {
	email: 'doctor2@demo.com',
	password: 'Doctor@123',
	firstName: 'Anjali',
	lastName: 'Sharma',
	registrationNumber: 'DEMO67890',
	phone: '9123456781',
	dob: '1985-01-01',
	gender: 'Female',
	zipCode: '110002',
	address: 'Demo Clinic, New Delhi',
	specialization: ['Ayurveda', 'General Medicine'],
	experience: 10,
	price: 500,
	education: 'BAMS, MD (Ayurveda)',
	approvalStatus: 'Approved',
	availableSlots: buildAvailableSlots(),
};

async function seed() {
	const MDB = process.env.MDB || 'mongodb://localhost:27017/ayurveda';
	await mongoose.connect(MDB);
	console.log('Connected to', MDB);

	const patientHash = await bcrypt.hash(PATIENT.password, 10);
	const patient = await Patient.findOneAndUpdate(
		{ email: PATIENT.email },
		{
			$set: {
				firstName: PATIENT.firstName,
				lastName: PATIENT.lastName,
				email: PATIENT.email,
				phone: PATIENT.phone,
				dob: PATIENT.dob,
				gender: PATIENT.gender,
				zipCode: PATIENT.zipCode,
				address: PATIENT.address,
				password: patientHash,
				role: 'patient',
			},
		},
		{ new: true, upsert: true, setDefaultsOnInsert: true }
	);
	console.log(`Patient upserted: ${patient.email} (id: ${patient._id})`);

	const doctorHash = await bcrypt.hash(DOCTOR.password, 10);
	const doctor = await Doctor.findOneAndUpdate(
		{ email: DOCTOR.email },
		{
			$set: {
				firstName: DOCTOR.firstName,
				lastName: DOCTOR.lastName,
				email: DOCTOR.email,
				registrationNumber: DOCTOR.registrationNumber,
				phone: DOCTOR.phone,
				dob: DOCTOR.dob,
				gender: DOCTOR.gender,
				zipCode: DOCTOR.zipCode,
				address: DOCTOR.address,
				specialization: DOCTOR.specialization,
				experience: DOCTOR.experience,
				price: DOCTOR.price,
				education: DOCTOR.education,
				approvalStatus: DOCTOR.approvalStatus,
				availableSlots: DOCTOR.availableSlots,
				password: doctorHash,
				role: 'doctor',
			},
		},
		{ new: true, upsert: true, setDefaultsOnInsert: true }
	);
	console.log(`Doctor upserted: ${doctor.email} (id: ${doctor._id})`);

	// Retailer + store medicines, so recommendedSupplements can reference a
	// real medicineId (image/price show up wherever the app resolves one).
	const retailerHash = await bcrypt.hash('Retailer@123', 10);
	const retailer = await Retailer.findOneAndUpdate(
		{ email: 'retailer2@demo.com' },
		{
			$set: {
				firstName: 'Demo',
				lastName: 'Retailer',
				BusinessName: 'JeevanHub Ayurveda Store',
				email: 'retailer2@demo.com',
				phone: '9988776655',
				dob: '1980-01-01',
				licenseNumber: 'DL-AY-10001',
				gender: 'Male',
				zipCode: '110003',
				address: 'Demo Warehouse, New Delhi',
				password: retailerHash,
				role: 'retailer',
				status: 'active',
			},
		},
		{ new: true, upsert: true, setDefaultsOnInsert: true }
	);
	console.log(`Retailer upserted: ${retailer.email} (id: ${retailer._id})`);

	// First two are the ones actually prescribed on the demo booking below; the
	// rest just fill out the store catalog so search/browse has real variety
	// beyond what's been prescribed.
	const MEDICINES = [
		{
			name: 'Triphala Churna',
			price: 180,
			quantity: 100,
			category: 'Digestive Health',
			description: 'Classic Ayurvedic herbal blend of three fruits, supports digestion and gentle detox.',
			diseasesTreated: ['Indigestion', 'Constipation'],
			prescription: false,
		},
		{
			name: 'Ashwagandha Capsules',
			price: 320,
			quantity: 100,
			category: 'Immunity & Stress',
			description: 'Adaptogenic herb capsules that support stress response and vitality.',
			diseasesTreated: ['Stress', 'Fatigue'],
			prescription: false,
		},
		{
			name: 'Chyawanprash',
			price: 250,
			quantity: 80,
			category: 'Immunity & Stress',
			description: 'Herbal jam rich in amla, traditionally taken daily to build immunity.',
			diseasesTreated: ['Low immunity', 'Cold & cough'],
			prescription: false,
		},
		{
			name: 'Brahmi Tablets',
			price: 210,
			quantity: 100,
			category: 'Mind & Memory',
			description: 'Supports memory, focus, and calm mental clarity.',
			diseasesTreated: ['Poor concentration', 'Anxiety'],
			prescription: false,
		},
		{
			name: 'Neem Capsules',
			price: 150,
			quantity: 120,
			category: 'Skin Care',
			description: 'Blood-purifying herb capsules used for skin health.',
			diseasesTreated: ['Acne', 'Skin allergies'],
			prescription: false,
		},
		{
			name: 'Giloy Tablets',
			price: 190,
			quantity: 100,
			category: 'Immunity & Stress',
			description: 'Immunity-boosting herb, commonly used for fever recovery.',
			diseasesTreated: ['Fever', 'Low immunity'],
			prescription: false,
		},
		{
			name: 'Karela Jamun Juice',
			price: 220,
			quantity: 60,
			category: 'Diabetes Care',
			description: 'Bitter gourd and jamun blend traditionally used to support healthy blood sugar.',
			diseasesTreated: ['Diabetes'],
			prescription: false,
		},
		{
			name: 'Ashoka Tablets',
			price: 240,
			quantity: 80,
			category: "Women's Health",
			description: "Herbal support for women's menstrual health.",
			diseasesTreated: ['Irregular periods'],
			prescription: false,
		},
	];

	const medicineDocs = [];
	for (const med of MEDICINES) {
		const doc = await Medicine.findOneAndUpdate(
			{ name: med.name, retailerId: retailer._id },
			{ $set: { ...med, retailerId: retailer._id, isActive: true } },
			{ new: true, upsert: true, setDefaultsOnInsert: true }
		);
		medicineDocs.push(doc);
		console.log(`Medicine upserted: ${doc.name} (id: ${doc._id})`);
	}

	// Fill in a prescription (diagnosis + medicines referencing the store items
	// above) on every existing booking between this doctor and patient, so
	// whichever appointment the demo accounts already have shows it -- on both
	// the patient's "Prescribed" panel and the doctor's Prescribe screen.
	const existingBookings = await Booking.find({ doctorId: doctor._id, patientId: patient._id });

	const recommendedSupplements = medicineDocs.slice(0, 2).map((m, i) => ({
		medicineId: m._id,
		medicineName: m.name,
		dosage: i === 0 ? '1 tsp' : '2 capsules',
		instructions: i === 0 ? 'With warm water, before bed' : 'After breakfast and dinner',
	}));

	let bookings = existingBookings;
	if (bookings.length === 0) {
		const pastAppointmentDate = new Date();
		pastAppointmentDate.setDate(pastAppointmentDate.getDate() - 3);
		const pastSlot = doctor.availableSlots.Monday[0];
		const created = await Booking.create({
			doctorId: doctor._id,
			doctorName: `${doctor.firstName} ${doctor.lastName}`,
			doctorEmail: doctor.email,
			slotId: pastSlot._id,
			dateOfAppointment: pastAppointmentDate,
			patientId: patient._id,
			patientEmail: patient.email,
			patientName: `${patient.firstName} ${patient.lastName}`,
			patientGender: patient.gender,
			patientAge: 30,
			patientIllness: 'Seeded demo visit',
			requestAccept: 'accepted',
			amountPaid: pastSlot.fee || 500,
			paymentStatus: 'Completed',
		});
		bookings = [created];
	}

	for (const booking of bookings) {
		booking.diagnosis = 'Vata-Pitta imbalance with mild indigestion';
		booking.recommendedSupplements = recommendedSupplements;
		await booking.save();
		console.log(`Booking prescribed: ${booking._id} (${booking.dateOfAppointment.toISOString().slice(0, 10)})`);
	}
	const booking = bookings[0];

	const dietPlan = {
		weekly: {
			monday: { breakfast: 'Warm oats with soaked almonds', lunch: 'Moong dal khichdi with ghee', dinner: 'Steamed vegetables with light soup', juices: 'Aloe vera juice' },
			tuesday: { breakfast: 'Vegetable poha', lunch: 'Rice, dal, sautéed greens', dinner: 'Vegetable soup with millet roti', juices: 'Coriander-mint juice' },
			wednesday: { breakfast: 'Stewed fruits with cinnamon', lunch: 'Khichdi with ghee', dinner: 'Light vegetable stew', juices: 'Amla juice' },
			thursday: { breakfast: 'Idli with coconut chutney', lunch: 'Rice, dal, cooked vegetables', dinner: 'Moong soup', juices: 'Cucumber juice' },
			friday: { breakfast: 'Upma with vegetables', lunch: 'Khichdi with ghee', dinner: 'Steamed vegetables', juices: 'Pomegranate juice' },
			saturday: { breakfast: 'Vegetable dalia', lunch: 'Rice, dal, sabzi', dinner: 'Light soup with roti', juices: 'Beetroot juice' },
			sunday: { breakfast: 'Fruit bowl with nuts', lunch: 'Khichdi with ghee', dinner: 'Vegetable stew', juices: 'Ginger-lemon water' },
		},
		herbs: ['Triphala', 'Ashwagandha', 'Tulsi'],
	};

	const yogaPlan = {
		morning: [
			{ name: 'Surya Namaskar (Sun Salutation)', link: '' },
			{ name: 'Pranayama (Anulom Vilom)', link: '' },
		],
		evening: [
			{ name: 'Shavasana', link: '' },
			{ name: 'Vajrasana', link: '' },
		],
	};

	let dietYoga = await DietYoga.findOne({ bookingId: booking._id });
	if (dietYoga) {
		dietYoga.diet = dietPlan;
		dietYoga.yoga = yogaPlan;
		dietYoga.doctor = doctor._id;
		dietYoga.patient = patient._id;
		dietYoga.updatedAt = new Date();
		await dietYoga.save();
	} else {
		dietYoga = await DietYoga.create({
			bookingId: booking._id,
			patient: patient._id,
			doctor: doctor._id,
			diet: dietPlan,
			yoga: yogaPlan,
		});
	}
	console.log(`Diet & yoga plan upserted: ${dietYoga._id}`);

	await mongoose.disconnect();
	console.log('Done.');

	console.log('\n--- Login credentials ---');
	console.log(`Patient -> email: ${PATIENT.email}  password: ${PATIENT.password}`);
	console.log(`Doctor  -> email: ${DOCTOR.email}  password: ${DOCTOR.password}`);
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
