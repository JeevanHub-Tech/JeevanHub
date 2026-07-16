// Shared Mongoose helpers used by Patient, Doctor and Retailer schemas so the
// same field-format rules (dob parsing, phone/zip format, computed age) don't
// have to be duplicated three times.

// Doctor records created via the admin Excel bulk-import flow store dob as a
// "DD/MM/YYYY" string (see calculateAge in controllers/doctorController.js).
// This setter accepts that legacy format, ISO date strings, and native Date
// objects, and always stores a real Date.
function parseDob(value) {
  if (!value) return value;
  if (value instanceof Date) return value;
  if (typeof value === 'string' && value.includes('/')) {
    const parts = value.split('/');
    if (parts.length === 3) {
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
  }
  return new Date(value);
}

// Only enforce the strict Indian format when a countryCode is actually set to
// +91. No countryCode yet (older callers, admin bulk-import) or any other
// country skips the format check entirely.
function indianPhoneValidator(value) {
  if (!value) return true;
  if (this.countryCode === '+91') {
    return /^\d{10}$/.test(value);
  }
  return true;
}

function indianZipCodeValidator(value) {
  if (!value) return true;
  if (this.countryCode === '+91') {
    return /^\d{6}$/.test(value);
  }
  return true;
}

// Replaces a stored `age` field, which goes stale as time passes. Attaches a
// computed virtual instead and makes it show up in JSON/object output.
function attachAgeVirtual(schema, dobField = 'dob') {
  schema.virtual('age').get(function () {
    const dob = this[dobField];
    if (!dob) return null;
    const birthDate = dob instanceof Date ? dob : new Date(dob);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  });
  schema.set('toJSON', { virtuals: true });
  schema.set('toObject', { virtuals: true });
}

module.exports = { parseDob, indianPhoneValidator, indianZipCodeValidator, attachAgeVirtual };
