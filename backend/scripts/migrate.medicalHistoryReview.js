// One-off migration: converts medicalHistory docs from the old schema
// (ocr.text/unclearNotes, doctor-authored review.correctedText) to the new
// patient-verification schema (ocr.rawText + structured fields, doc.patientVerification,
// doc.auditLog). Run once against any environment that has data from before
// the prescription-verification-flow change.
//
// Old docs have no structured `medicines[]` -- OCR was never re-run for them,
// so `patientVerification.medicines` is seeded empty and the old corrected
// text (if any) is carried into `patientVerification.notes` for the patient
// to restructure by hand, or into `ocr.rawText` if it was never reviewed.
//
// Usage (from backend/):
//   node scripts/migrate.medicalHistoryReview.js
//   node scripts/migrate.medicalHistoryReview.js --dryRun

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Patient = require('../models/Patient');

const dryRun = process.argv.includes('--dryRun');

async function migrate() {
	const MDB = process.env.MDB || 'mongodb://localhost:27017/ayurveda';
	await mongoose.connect(MDB);
	console.log('Connected to', MDB, dryRun ? '(dry run)' : '');

	const patients = await Patient.find({ 'medicalHistory.0': { $exists: true } });
	console.log(`Found ${patients.length} patient(s) with medical history documents.`);

	let migratedDocs = 0;
	for (const patient of patients) {
		let changed = false;

		for (const doc of patient.medicalHistory) {
			const raw = doc.toObject ? doc.toObject() : doc;
			const oldOcr = raw.ocr;
			const oldReview = raw.review;

			// Already migrated (has the new shape) -- skip.
			if (oldOcr && (oldOcr.rawText !== undefined || Array.isArray(oldOcr.medicines))) continue;
			if (!oldOcr && !oldReview) continue;

			changed = true;
			migratedDocs++;

			if (oldOcr) {
				doc.ocr = {
					status: oldOcr.status || 'pending',
					medicines: [],
					doctorName: '',
					doctorRegistrationNumber: '',
					prescriptionDate: '',
					patientNameOnDocument: '',
					rawText: oldOcr.text || '',
					unclearNotes: oldOcr.unclearNotes || '',
					model: oldOcr.model,
					error: oldOcr.error,
					analyzedAt: oldOcr.analyzedAt,
				};
			}

			if (oldReview?.correctedText) {
				// A doctor had already reviewed this under the old flow -- treat it
				// as already patient-final so it keeps showing up on the doctor
				// dashboard instead of disappearing behind a new verification step.
				doc.patientVerification = {
					status: 'submitted',
					medicines: [],
					doctorName: '',
					doctorRegistrationNumber: '',
					prescriptionDate: '',
					patientNameOnDocument: '',
					notes: oldReview.correctedText,
					submittedAt: oldReview.reviewedAt || new Date(),
				};
				doc.auditLog = doc.auditLog || [];
				doc.auditLog.push({
					stage: 'patient_submitted',
					snapshot: doc.patientVerification.toObject ? doc.patientVerification.toObject() : doc.patientVerification,
					actorModel: 'Patient',
					at: oldReview.reviewedAt || new Date(),
				});
			} else if (oldOcr?.status === 'done') {
				doc.patientVerification = {
					status: 'pending',
					medicines: [],
					doctorName: '',
					doctorRegistrationNumber: '',
					prescriptionDate: '',
					patientNameOnDocument: '',
					notes: '',
				};
			}

			doc.set('review', undefined);
		}

		if (changed && !dryRun) {
			await patient.save();
		}
	}

	console.log(`${dryRun ? 'Would migrate' : 'Migrated'} ${migratedDocs} document(s) across ${patients.length} patient(s).`);
	await mongoose.disconnect();
}

migrate().catch((err) => {
	console.error(err);
	process.exit(1);
});
