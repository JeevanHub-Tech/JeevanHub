// One-off: shrink the ~469MB raw catalog image dump before it ever touches
// Cloudinary storage/bandwidth. Resizes to a max 1000px edge and re-encodes
// as webp (q=78) — good enough for product thumbnails/detail views.
//
// Idempotent/resumable: skips any output file that already exists, so it's
// safe to re-run after an interruption.
//
// Run (from backend/):
//   node scripts/catalog-import/optimizeImages.js

const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const sharp = require('sharp');

const CATALOG_XLSX = path.join(__dirname, '..', '..', '..', 'temp', 'Image-Extraction-Tool', 'data', 'processed', 'Master_Catalog_Final.xlsx');
const IMAGES_ROOT = path.join(__dirname, '..', '..', '..', 'temp', 'Image-Extraction-Tool', 'data', 'images');
const OUTPUT_ROOT = path.join(__dirname, '..', '..', '..', 'temp', 'Image-Extraction-Tool', 'data', 'optimized');

const MAX_EDGE = 1000;
const WEBP_QUALITY = 78;
const CONCURRENCY = 8;

function relImagePathFromRow(row) {
	const lp = row['Local Image Path'];
	if (!lp || lp === 'IMAGE MISSING') return null;
	const marker = '/data/images/';
	const idx = lp.indexOf(marker);
	if (idx < 0) return null;
	return lp.slice(idx + marker.length).replace(/\\/g, '/');
}

async function pool(items, limit, worker) {
	let i = 0;
	let ok = 0, skipped = 0, failed = 0;
	async function next() {
		while (i < items.length) {
			const idx = i++;
			try {
				const res = await worker(items[idx]);
				if (res === 'skipped') skipped++; else ok++;
			} catch (err) {
				failed++;
				console.error('FAILED', items[idx], '-', err.message);
			}
		}
	}
	await Promise.all(Array.from({ length: limit }, next));
	return { ok, skipped, failed };
}

async function main() {
	const wb = XLSX.readFile(CATALOG_XLSX);
	const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

	const relPaths = new Set();
	for (const row of rows) {
		const rel = relImagePathFromRow(row);
		if (rel) relPaths.add(rel);
	}
	const list = Array.from(relPaths);
	console.log(`Found ${list.length} unique source images referenced in catalog.`);

	const { ok, skipped, failed } = await pool(list, CONCURRENCY, async (rel) => {
		const src = path.join(IMAGES_ROOT, rel);
		if (!fs.existsSync(src)) throw new Error('source file missing: ' + src);

		const outRel = rel.replace(/\.[^./]+$/, '.webp');
		const out = path.join(OUTPUT_ROOT, outRel);
		if (fs.existsSync(out)) return 'skipped';

		fs.mkdirSync(path.dirname(out), { recursive: true });
		await sharp(src)
			.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
			.webp({ quality: WEBP_QUALITY })
			.toFile(out + '.tmp');
		fs.renameSync(out + '.tmp', out);
		return 'ok';
	});

	console.log(`Done. optimized: ${ok}, already-done: ${skipped}, failed: ${failed}`);

	let srcBytes = 0, outBytes = 0;
	for (const rel of list) {
		const src = path.join(IMAGES_ROOT, rel);
		const out = path.join(OUTPUT_ROOT, rel.replace(/\.[^./]+$/, '.webp'));
		if (fs.existsSync(src)) srcBytes += fs.statSync(src).size;
		if (fs.existsSync(out)) outBytes += fs.statSync(out).size;
	}
	console.log(`Size: ${(srcBytes / 1024 / 1024).toFixed(1)}MB -> ${(outBytes / 1024 / 1024).toFixed(1)}MB (${(100 - (outBytes / srcBytes) * 100).toFixed(1)}% smaller)`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
