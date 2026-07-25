// One-off: Medicine.diseasesTreated is empty on every existing document (old
// and newly-imported alike) — the disease fuzzy-search relies on it and has
// nothing to match against. Source data never had a Uses/Indications column,
// so this derives diseasesTreated by keyword-matching name+description
// against a fixed condition dictionary. Rows with only marketing boilerplate
// ("Buy X online, 60% off") legitimately get nothing — that's correct, not a
// bug, there's no disease signal in that text.
//
// Safe to re-run: only touches docs where diseasesTreated is currently empty.
//
// Run (from backend/, needs backend/.env with MDB set):
//   node scripts/catalog-import/backfillDiseasesTreated.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dns').setServers(['1.1.1.1', '1.0.0.1']);
const mongoose = require('mongoose');
const Medicine = require('../../models/Medicine');

const MDB = process.env.MDB || 'mongodb://localhost:27017/ayurveda';

// canonical disease/condition name -> regexes matched against "name description" (lowercased)
const CONDITIONS = [
	['Diabetes', [/diabet/i, /blood sugar/i]],
	['Heart Disease', [/\bcardiac\b/i, /\bheart\b/i, /cholesterol/i]],
	['Blood Pressure', [/blood pressure/i, /hypertension/i, /\bbp\b/i]],
	['Indigestion', [/indigestion/i, /digesti(on|ve)/i, /dyspepsia/i]],
	['Acidity', [/acidity/i, /acid reflux/i, /heartburn/i, /\bgerd\b/i]],
	['Constipation', [/constipation/i]],
	['Diarrhea', [/diarrh(o|e)a/i, /dysentery/i, /loose motion/i]],
	['Gas & Bloating', [/\bgas\b/i, /flatulence/i, /bloating/i]],
	['Piles', [/piles/i, /h(a)?emorrhoid/i, /fissure/i]],
	['Cough & Cold', [/\bcough\b/i, /common cold/i, /\bcold\b/i]],
	['Fever', [/\bfever\b/i]],
	['Respiratory / Asthma', [/asthma/i, /respiratory/i, /bronch/i]],
	['Skin Disorders', [/\bskin\b/i, /eczema/i, /psoriasis/i, /\backne\b/i, /pimple/i]],
	['Hair Fall / Dandruff', [/hair\s?fall/i, /dandruff/i, /hair loss/i, /hair growth/i]],
	['Joint Pain / Arthritis', [/joint pain/i, /arthritis/i, /rheumat/i]],
	['Muscle & Body Pain', [/muscle pain/i, /body pain/i, /back pain/i, /pain relief/i]],
	['Liver Disorders', [/\bliver\b/i, /hepat/i, /jaundice/i]],
	['Kidney Disorders', [/\bkidney\b/i, /\brenal\b/i, /kidney stone/i]],
	['Immunity', [/immun/i]],
	['Stress & Anxiety', [/\bstress\b/i, /anxiety/i]],
	['Insomnia', [/insomnia/i, /sleep disorder/i]],
	['Obesity / Weight Management', [/obesity/i, /weight (loss|management|gain)/i]],
	['Anemia', [/an(a|e)emia/i]],
	['Menstrual Health', [/menstrua/i, /period pain/i, /\bpcos\b/i]],
	['Sexual Health / Vitality', [/vitality/i, /\bvigou?r\b/i, /aphrodisiac/i, /sexual (health|wellness)/i]],
	['Ulcer', [/\bulcer\b/i]],
	['Worm Infestation', [/\bworm/i, /parasit/i, /krimi/i]],
	['Headache / Migraine', [/headache/i, /migraine/i]],
	['Thyroid Disorders', [/thyroid/i]],
	['Urinary Disorders', [/urinary/i, /\butis?\b/i, /urine/i]],
	['Eye Disorders', [/\beye\b/i, /vision/i]],
	['Wound Healing', [/wound heal/i, /\bwound\b/i]],
	['Allergy', [/allerg/i]],
];

function detectDiseases(text) {
	const matched = [];
	for (const [label, patterns] of CONDITIONS) {
		if (patterns.some((re) => re.test(text))) matched.push(label);
		if (matched.length >= 5) break;
	}
	return matched;
}

async function main() {
	await mongoose.connect(MDB);
	console.log('Connected to', MDB);

	const cursor = Medicine.find({
		$or: [{ diseasesTreated: { $exists: false } }, { diseasesTreated: { $size: 0 } }],
	})
		.select('name description')
		.cursor();

	let scanned = 0, matched = 0, updated = 0;
	const ops = [];

	for await (const doc of cursor) {
		scanned++;
		const text = `${doc.name} ${doc.description || ''}`;
		const diseases = detectDiseases(text);
		if (diseases.length > 0) {
			matched++;
			ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: { diseasesTreated: diseases } } } });
		}
		if (ops.length >= 500) {
			const res = await Medicine.bulkWrite(ops, { ordered: false });
			updated += res.modifiedCount;
			ops.length = 0;
			console.log(`Scanned ${scanned}, matched ${matched}, updated ${updated}`);
		}
	}
	if (ops.length > 0) {
		const res = await Medicine.bulkWrite(ops, { ordered: false });
		updated += res.modifiedCount;
	}

	console.log(`\nDone. Scanned ${scanned} medicines with empty diseasesTreated, matched ${matched}, updated ${updated}.`);
	await mongoose.disconnect();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
