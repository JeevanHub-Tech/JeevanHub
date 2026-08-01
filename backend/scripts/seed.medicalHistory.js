// Seed a patient's medicalHistory with the demo prescription images in
// scripts/demo_images/, optionally running Gemini OCR (and a sample review)
// on a subset -- reproduces the manual demo setup from this session so it
// can be re-run against any environment (local, or a deployed backend's DB).
// Not tied to any one environment -- point MDB at whichever DB you mean to seed.
//
// Usage (from backend/):
//   node scripts/seed.medicalHistory.js --email patient@test.com
//   node scripts/seed.medicalHistory.js --email patient@test.com --ocrCount 6 --reviewCount 2
//
// Uses Cloudinary if real CLOUDINARY_* creds are set in .env, otherwise falls
// back to local disk (uploads/medical-history) same as the live upload route.

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const Patient = require('../models/Patient');
const cloudinary = require('../config/cloudinary');
const { CLOUDINARY_CONFIGURED } = require('../config/medicalHistoryStorage');
const { transcribeDocument } = require('../services/prescriptionOcr/ocrService');
const { PRESCRIPTION_OCR_MODEL } = require('../services/prescriptionOcr/config');

const DEMO_IMAGES_DIR = path.join(__dirname, 'demo_images');
const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'medical-history');

function parseArgs(argv) {
	const args = {};
	for (let i = 0; i < argv.length; i++) {
		const cur = argv[i];
		if (!cur.startsWith('--')) continue;
		const key = cur.slice(2);
		const next = argv[i + 1];
		if (next === undefined || next.startsWith('--')) args[key] = true;
		else { args[key] = next; i++; }
	}
	return args;
}

async function storeFile(localPath, fileName) {
	if (CLOUDINARY_CONFIGURED) {
		const result = await cloudinary.uploader.upload(localPath, {
			folder: 'jeevanhub/patients/medical-history',
			resource_type: 'auto',
			type: 'authenticated',
			public_id: Date.now() + '-' + fileName.split('.')[0],
		});
		return { url: result.secure_url, publicId: result.public_id };
	}

	fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
	const storedName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
	fs.copyFileSync(localPath, path.join(LOCAL_UPLOAD_DIR, storedName));
	const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
	return { url: `${baseUrl}/uploads/medical-history/${storedName}`, publicId: undefined };
}

async function seed() {
	const args = parseArgs(process.argv.slice(2));
	const email = args.email || 'patient@test.com';
	const ocrCount = Number(args.ocrCount ?? 6);
	const reviewCount = Number(args.reviewCount ?? 2);

	const MDB = process.env.MDB || 'mongodb://localhost:27017/ayurveda';
	await mongoose.connect(MDB);
	console.log('Connected to', MDB);

	const patient = await Patient.findOne({ email });
	if (!patient) throw new Error(`No patient found with email ${email}`);

	const files = fs.readdirSync(DEMO_IMAGES_DIR).filter((f) => /\.(jpe?g|png|pdf)$/i.test(f));
	if (files.length === 0) throw new Error(`No image files found in ${DEMO_IMAGES_DIR}`);

	console.log(`Uploading ${files.length} document(s) to ${email} (${CLOUDINARY_CONFIGURED ? 'Cloudinary' : 'local disk'})...`);
	for (const fileName of files) {
		const localPath = path.join(DEMO_IMAGES_DIR, fileName);
		const { url, publicId } = await storeFile(localPath, fileName);
		patient.medicalHistory.push({
			fileName,
			url,
			publicId,
			mimeType: 'image/jpeg',
			uploadedAt: new Date(),
		});
	}
	await patient.save();
	console.log(`Uploaded ${files.length} document(s).`);

	const pending = patient.medicalHistory.slice(-files.length);
	const toOcr = pending.slice(0, ocrCount);
	console.log(`Running OCR on ${toOcr.length} document(s)...`);
	for (const doc of toOcr) {
		try {
			const fileResp = await require('axios').get(doc.url, { responseType: 'arraybuffer' });
			const base64 = Buffer.from(fileResp.data).toString('base64');
			const result = await transcribeDocument({ fileBytesBase64: base64, mimeType: doc.mimeType });
			doc.ocr = {
				status: 'done',
				medicines: result.medicines,
				doctorName: result.doctorName,
				doctorRegistrationNumber: result.doctorRegistrationNumber,
				prescriptionDate: result.prescriptionDate,
				patientNameOnDocument: result.patientNameOnDocument,
				rawText: result.rawText,
				unclearNotes: result.unclearNotes,
				model: PRESCRIPTION_OCR_MODEL,
				analyzedAt: new Date(),
			};
			doc.patientVerification = {
				status: 'pending',
				medicines: result.medicines,
				doctorName: result.doctorName,
				doctorRegistrationNumber: result.doctorRegistrationNumber,
				prescriptionDate: result.prescriptionDate,
				patientNameOnDocument: result.patientNameOnDocument,
				notes: '',
			};
			console.log(`  OCR done: ${doc.fileName}`);
		} catch (err) {
			doc.ocr = { status: 'failed', error: err.message };
			console.error(`  OCR failed: ${doc.fileName} - ${err.message}`);
		}
	}
	await patient.save();

	// Simulate the patient reviewing and submitting a subset, as a demo of the
	// "doctor only sees submitted" state.
	const toSubmit = toOcr.filter((d) => d.ocr?.status === 'done').slice(0, reviewCount);
	for (const doc of toSubmit) {
		doc.patientVerification.status = 'submitted';
		doc.patientVerification.submittedAt = new Date();
		doc.auditLog.push({ stage: 'patient_submitted', snapshot: doc.patientVerification.toObject ? doc.patientVerification.toObject() : doc.patientVerification, actorModel: 'Patient', at: new Date() });
	}
	if (toSubmit.length) {
		await patient.save();
		console.log(`Submitted ${toSubmit.length} sample verified prescription(s).`);
	}

	console.log('Done.');
	await mongoose.disconnect();
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
