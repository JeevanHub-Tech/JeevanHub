// One-off: import the Master_Catalog_Final.xlsx catalog (8061 rows) into the
// Medicine collection, uploading each row's optimized image (see
// optimizeImages.js — run that first) to Cloudinary and storing the
// resulting secure_url.
//
// Every imported row is attached to a single system "Catalog Import"
// retailer (created/upserted here) since the source data has no retailer
// info. Swap ownership later with, e.g.:
//   db.medicines.updateMany({ retailerId: <catalogImportId> }, { $set: { retailerId: <realRetailerId> } })
//
// Fields absent from the source data get fixed defaults (agreed with repo owner):
//   category: "Ayurvedic Medicine", quantity: 100, prescription: false
//
// Resumable: uploaded image URLs are cached in upload-cache.json (by relative
// image path) so a re-run doesn't re-upload anything. Medicine insertion
// re-run is guarded by a unique-ish check on (name, retailerId) — rows
// already imported are skipped.
//
// Run (from backend/, needs backend/.env with MDB + CLOUDINARY_* set):
//   node scripts/catalog-import/optimizeImages.js   (run first)
//   node scripts/catalog-import/uploadAndImportMedicines.js

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const fs = require('fs');
// Node's built-in resolver can't reach the local VPN/WARP DNS service for SRV
// lookups (mongodb+srv://) even though the OS resolver can — point Node at
// Cloudflare's resolver directly for this process only.
require('dns').setServers(['1.1.1.1', '1.0.0.1']);
const crypto = require('crypto');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cloudinary = require('../../config/cloudinary');

const Retailer = require('../../models/Retailer');
const Medicine = require('../../models/Medicine');

const MDB = process.env.MDB || 'mongodb://localhost:27017/ayurveda';
const CATALOG_XLSX = path.join(__dirname, '..', '..', '..', 'temp', 'Image-Extraction-Tool', 'data', 'processed', 'Master_Catalog_Final.xlsx');
const OPTIMIZED_ROOT = path.join(__dirname, '..', '..', '..', 'temp', 'Image-Extraction-Tool', 'data', 'optimized');
const CACHE_FILE = path.join(__dirname, 'upload-cache.json');
const REPORT_FILE = path.join(__dirname, 'import-report.json');

const CATALOG_IMPORT_RETAILER_EMAIL = 'catalog-import@system.local';
const DEFAULT_CATEGORY = 'Ayurvedic Medicine';
const DEFAULT_QUANTITY = 100;
const UPLOAD_CONCURRENCY = 6;

function relImagePathFromRow(row) {
	const lp = row['Local Image Path'];
	if (!lp || lp === 'IMAGE MISSING') return null;
	const marker = '/data/images/';
	const idx = lp.indexOf(marker);
	if (idx < 0) return null;
	return lp.slice(idx + marker.length).replace(/\\/g, '/').replace(/\.[^./]+$/, '.webp');
}

function loadCache() {
	if (!fs.existsSync(CACHE_FILE)) return {};
	return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
}
function saveCache(cache) {
	fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function ensureCatalogImportRetailer() {
	const hashedPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);
	const retailer = await Retailer.findOneAndUpdate(
		{ email: CATALOG_IMPORT_RETAILER_EMAIL },
		{
			$setOnInsert: {
				firstName: 'Catalog', lastName: 'Import', BusinessName: 'Catalog Import (system)',
				email: CATALOG_IMPORT_RETAILER_EMAIL, countryCode: '+91', phone: '9000000000',
				dob: new Date('1990-01-01'), licenseNumber: 'CATALOG-IMPORT-SYSTEM',
				gender: 'Others', zipCode: '110001', password: hashedPassword,
				status: 'inactive', role: 'retailer',
			},
		},
		{ new: true, upsert: true, setDefaultsOnInsert: true }
	);
	return retailer;
}

async function pool(items, limit, worker) {
	let i = 0;
	async function next() {
		while (i < items.length) {
			const idx = i++;
			await worker(items[idx], idx);
		}
	}
	await Promise.all(Array.from({ length: limit }, next));
}

async function uploadImages(rows, cache) {
	const relPaths = new Set();
	for (const row of rows) {
		const rel = relImagePathFromRow(row);
		if (rel) relPaths.add(rel);
	}
	const toUpload = Array.from(relPaths).filter((rel) => !cache[rel]);
	console.log(`Images referenced: ${relPaths.size}, already uploaded: ${relPaths.size - toUpload.length}, to upload: ${toUpload.length}`);

	let done = 0, failed = 0;
	await pool(toUpload, UPLOAD_CONCURRENCY, async (rel) => {
		const filePath = path.join(OPTIMIZED_ROOT, rel);
		if (!fs.existsSync(filePath)) {
			failed++;
			return;
		}
		const publicId = 'jeevanhub/medicines/' + rel.replace(/\.webp$/, '').replace(/[^a-zA-Z0-9/_-]/g, '_');
		try {
			const res = await cloudinary.uploader.upload(filePath, {
				public_id: publicId,
				overwrite: false,
				resource_type: 'image',
			});
			cache[rel] = res.secure_url;
			done++;
			if (done % 100 === 0) {
				console.log(`Uploaded ${done}/${toUpload.length}`);
				saveCache(cache);
			}
		} catch (err) {
			failed++;
			console.error('Upload failed for', rel, '-', err.message);
		}
	});
	saveCache(cache);
	console.log(`Upload pass done. ok: ${done}, failed: ${failed}`);
}

async function importMedicines(rows, cache, retailerId) {
	const existingNames = new Set(
		(await Medicine.find({ retailerId }, 'name')).map((m) => m.name)
	);

	const docs = [];
	const skipped = [];
	for (const row of rows) {
		const name = String(row['Product Name']).trim();
		if (!name) { skipped.push({ row: row['Search Name'], reason: 'no name' }); continue; }
		if (existingNames.has(name)) continue; // already imported in a previous run

		const price = Number(row['MRP']);
		if (!Number.isFinite(price) || price <= 0) { skipped.push({ row: name, reason: 'bad MRP' }); continue; }

		const rel = relImagePathFromRow(row);
		const imageUrl = rel ? cache[rel] : null;

		docs.push({
			name,
			price,
			quantity: DEFAULT_QUANTITY,
			category: DEFAULT_CATEGORY,
			description: String(row['Description']).trim() || name,
			diseasesTreated: [],
			prescription: false,
			images: imageUrl ? [imageUrl] : [],
			retailerId,
			isActive: true,
		});
		existingNames.add(name);
	}

	console.log(`Prepared ${docs.length} new medicine docs (${skipped.length} skipped).`);

	let inserted = 0;
	const BATCH = 500;
	for (let i = 0; i < docs.length; i += BATCH) {
		const batch = docs.slice(i, i + BATCH);
		try {
			const res = await Medicine.insertMany(batch, { ordered: false });
			inserted += res.length;
		} catch (err) {
			// insertMany with ordered:false still throws after partial success; count what landed.
			inserted += err.insertedDocs ? err.insertedDocs.length : 0;
			console.error('Batch insert error (some docs may still have inserted):', err.message);
		}
		console.log(`Inserted ${Math.min(i + BATCH, docs.length)}/${docs.length}`);
	}

	fs.writeFileSync(REPORT_FILE, JSON.stringify({
		totalRows: rows.length,
		inserted,
		skipped,
		withImage: docs.filter((d) => d.images.length > 0).length,
		withoutImage: docs.filter((d) => d.images.length === 0).length,
	}, null, 2));

	return { inserted, skippedCount: skipped.length };
}

async function main() {
	await mongoose.connect(MDB);
	console.log('Connected to', MDB);

	const retailer = await ensureCatalogImportRetailer();
	console.log('Catalog import retailer:', retailer._id.toString());

	const wb = XLSX.readFile(CATALOG_XLSX);
	const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
	console.log(`Loaded ${rows.length} catalog rows.`);

	const cache = loadCache();
	await uploadImages(rows, cache);

	const { inserted, skippedCount } = await importMedicines(rows, cache, retailer._id);
	console.log(`\nDone. Inserted ${inserted} medicines, skipped ${skippedCount}. Report: ${REPORT_FILE}`);

	await mongoose.disconnect();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
