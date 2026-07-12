/**
 * One-shot image optimizer for public/images.
 *
 * Why: source images are 8K-resolution, 10-20MB each. Cards only ever show them
 * a few hundred px wide, so we downscale + re-encode. Typically 20MB -> ~150KB.
 *
 * Safe & idempotent:
 *   - Pristine originals are copied ONCE to public/images_original/ (gitignored).
 *   - Every run re-optimizes FROM that backup, so repeated runs never degrade.
 *   - Restore anytime by copying images_original/* back over images/.
 *
 * Run:  node scripts/optimize-images.js
 *
 * Needs `sharp` (dev-only): npm install sharp --no-save
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const IMAGES_DIR = path.join(__dirname, "..", "public", "images");
const BACKUP_DIR = path.join(__dirname, "..", "public", "images_original");

const MAX_WIDTH = 1400; // plenty for a card even on 2x retina
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;

const RASTER = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function fmtMB(bytes) {
	return (bytes / 1048576).toFixed(2) + " MB";
}

async function optimizeOne(name) {
	const srcInImages = path.join(IMAGES_DIR, name);
	const backup = path.join(BACKUP_DIR, name);

	const stat = fs.statSync(srcInImages);
	if (!stat.isFile() || stat.size === 0) return null;

	// Back up pristine original exactly once.
	if (!fs.existsSync(backup)) {
		fs.copyFileSync(srcInImages, backup);
	}

	// Always optimize FROM the pristine backup.
	const input = fs.readFileSync(backup);
	const beforeSize = input.length;

	const ext = path.extname(name).toLowerCase();
	let pipeline = sharp(input).rotate(); // respect EXIF orientation
	const meta = await pipeline.metadata();

	if (meta.width && meta.width > MAX_WIDTH) {
		pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
	}

	if (ext === ".png") {
		pipeline = pipeline.png({ quality: PNG_QUALITY, compressionLevel: 9, palette: true });
	} else if (ext === ".webp") {
		pipeline = pipeline.webp({ quality: JPEG_QUALITY });
	} else if (ext === ".avif") {
		pipeline = pipeline.avif({ quality: JPEG_QUALITY });
	} else {
		// jpg / jpeg
		pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true });
	}

	const output = await pipeline.toBuffer();

	// Only write if we actually shrank it.
	if (output.length < beforeSize) {
		fs.writeFileSync(srcInImages, output);
	}

	return { name, before: beforeSize, after: Math.min(output.length, beforeSize) };
}

async function main() {
	if (!fs.existsSync(IMAGES_DIR)) {
		console.error("No images dir:", IMAGES_DIR);
		process.exit(1);
	}
	if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

	const entries = fs
		.readdirSync(IMAGES_DIR)
		.filter((n) => RASTER.has(path.extname(n).toLowerCase()));

	console.log(`Optimizing ${entries.length} images (max ${MAX_WIDTH}px, q${JPEG_QUALITY})...\n`);

	let totalBefore = 0;
	let totalAfter = 0;
	let done = 0;

	for (const name of entries) {
		try {
			const r = await optimizeOne(name);
			if (!r) continue;
			totalBefore += r.before;
			totalAfter += r.after;
			done++;
			const pct = ((1 - r.after / r.before) * 100).toFixed(0);
			if (r.before - r.after > 100 * 1024) {
				console.log(`  ${r.name.padEnd(40)} ${fmtMB(r.before)} -> ${fmtMB(r.after)}  (-${pct}%)`);
			}
		} catch (e) {
			console.warn(`  SKIP ${name}: ${e.message}`);
		}
	}

	console.log(
		`\nDone. ${done} files.  Total ${fmtMB(totalBefore)} -> ${fmtMB(totalAfter)} ` +
			`(saved ${fmtMB(totalBefore - totalAfter)}, -${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`
	);
	console.log("Originals backed up in public/images_original/ (gitignored).");
}

main();
