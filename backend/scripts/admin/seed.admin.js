// Seed/upsert an admin account with a caller-supplied email + password.
// Not tied to any one environment — point MDB at whichever DB you mean to seed.
//
// Usage (from backend/):
//   node scripts/admin/seed.admin.js --email admin@example.com --password 'StrongPass123!'
//   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='StrongPass123!' node scripts/admin/seed.admin.js
//
// Optional: --firstName --lastName --phone --full-access (grants all permissions)

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('../../models/Admin');

function parseArgs(argv) {
	const args = {};
	for (let i = 0; i < argv.length; i++) {
		const cur = argv[i];
		if (!cur.startsWith('--')) continue;
		const key = cur.slice(2);
		const next = argv[i + 1];
		if (next === undefined || next.startsWith('--')) {
			args[key] = true;
		} else {
			args[key] = next;
			i++;
		}
	}
	return args;
}

async function seed() {
	const args = parseArgs(process.argv.slice(2));

	const email = args.email || process.env.ADMIN_EMAIL;
	const password = args.password || process.env.ADMIN_PASSWORD;

	if (!email || !password) {
		console.error('Missing email/password. Pass --email & --password, or set ADMIN_EMAIL/ADMIN_PASSWORD.');
		process.exit(1);
	}
	if (password.length < 8) {
		console.error('Password too short (min 8 chars).');
		process.exit(1);
	}

	const MDB = process.env.MDB || 'mongodb://localhost:27017/ayurveda';

	const firstName = args.firstName || 'Super';
	const lastName = args.lastName || 'Admin';
	const phone = args.phone || '9999999999';

	const permissions = args['full-access']
		? {
			manageAdmins: true,
			manageUsers: true,
			manageDoctors: true,
			manageRetailers: true,
			manageTransactions: true,
			manageBlogs: true,
		}
		: undefined;

	await mongoose.connect(MDB);
	console.log('Connected to', MDB);

	const hashedPassword = await bcrypt.hash(password, 10);
	const update = {
		firstName,
		lastName,
		email,
		phone,
		password: hashedPassword,
		role: 'admin',
		isActive: true,
	};
	if (permissions) update.permissions = permissions;

	const admin = await Admin.findOneAndUpdate(
		{ email },
		{ $set: update },
		{ new: true, upsert: true, setDefaultsOnInsert: true }
	);

	console.log(`Admin upserted: ${admin.email} (id: ${admin._id})`);

	await mongoose.disconnect();
	console.log('Done.');
}

seed().catch((err) => {
	console.error(err);
	process.exit(1);
});
