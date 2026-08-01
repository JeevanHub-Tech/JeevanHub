// Medical-history document storage. Uses Cloudinary (authenticated, signed
// URLs) when real credentials are configured; falls back to local disk under
// uploads/medical-history (served via the existing `/uploads` static mount)
// when they're not, so the feature is demoable without a Cloudinary account.
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('./cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const isPlaceholder = (v) => !v || v.startsWith('your_');
const CLOUDINARY_CONFIGURED = !isPlaceholder(process.env.CLOUDINARY_CLOUD_NAME) &&
	!isPlaceholder(process.env.CLOUDINARY_API_KEY) &&
	!isPlaceholder(process.env.CLOUDINARY_API_SECRET);

const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'medical-history');

let storage;
if (CLOUDINARY_CONFIGURED) {
	storage = new CloudinaryStorage({
		cloudinary: cloudinary,
		params: async (req, file) => ({
			folder: 'jeevanhub/patients/medical-history',
			resource_type: 'auto', // handles pdf, jpg, png, etc.
			type: 'authenticated',
			public_id: Date.now() + '-' + file.originalname.split('.')[0]
		}),
	});
} else {
	fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
	storage = multer.diskStorage({
		destination: LOCAL_UPLOAD_DIR,
		filename: (req, file, cb) => {
			const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
			cb(null, `${Date.now()}-${safeName}`);
		},
	});
}

const medicalHistoryUpload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const allowed = /jpeg|jpg|png|pdf/;
		if (allowed.test(file.mimetype)) return cb(null, true);
		cb(new Error('Only jpeg, jpg, png, and pdf files are allowed'));
	}
});

module.exports = { medicalHistoryUpload, CLOUDINARY_CONFIGURED };
