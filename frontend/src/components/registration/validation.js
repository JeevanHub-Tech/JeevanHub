// Client-side mirror of backend/validation/registrationSchemas.js so users see
// the same rules before submitting instead of only finding out from a 400.
// The backend remains the source of truth / last word on all of this.

export const INDIAN_PHONE_PATTERN = /^\d{10}$/;
export const INDIAN_ZIP_PATTERN = /^\d{6}$/;
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const LICENSE_NUMBER_PATTERN = /^[A-Za-z0-9\-/. ]{3,50}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Matches backend/models/Doctor.js's upiId validator
export const UPI_ID_PATTERN = /^[a-zA-Z0-9.\-_]{1,256}@[a-zA-Z0-9.\-_]{1,64}$/;

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, matches the backend multer limit
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg'];
export const ACCEPTED_DOCUMENT_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];

export function required(value, message = 'This field is required') {
  if (value === undefined || value === null) return message;
  if (typeof value === 'string' && value.trim() === '') return message;
  return null;
}

export function validatePhone(phone, countryCode) {
  const missing = required(phone, 'Phone number is required');
  if (missing) return missing;
  if (countryCode === '+91' && !INDIAN_PHONE_PATTERN.test(phone.trim())) {
    return 'Phone number must be exactly 10 digits for India (+91)';
  }
  return null;
}

export function validateZipCode(zipCode, countryCode) {
  const missing = required(zipCode, 'PIN/Zip code is required');
  if (missing) return missing;
  if (countryCode === '+91' && !INDIAN_ZIP_PATTERN.test(zipCode.trim())) {
    return 'PIN code must be exactly 6 digits for India (+91)';
  }
  return null;
}

export function validateEmail(email) {
  const missing = required(email, 'Email is required');
  if (missing) return missing;
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address';
  return null;
}

export function validateDob(dob) {
  const missing = required(dob, 'Date of birth is required');
  if (missing) return missing;
  const date = new Date(dob);
  if (isNaN(date.getTime())) return 'Enter a valid date';
  if (date.getTime() > Date.now()) return 'Date of birth must be in the past';
  return null;
}

export function validatePassword(password) {
  const missing = required(password, 'Password is required');
  if (missing) return missing;
  if (!PASSWORD_PATTERN.test(password)) {
    return 'Password must be at least 8 characters and include a letter and a number';
  }
  return null;
}

export function validateConfirmPassword(confirmPassword, password) {
  const missing = required(confirmPassword, 'Please confirm your password');
  if (missing) return missing;
  if (confirmPassword !== password) return 'Passwords do not match';
  return null;
}

export function validateUpiId(upiId) {
  if (!upiId || upiId.trim() === '') return null; // optional field
  if (!UPI_ID_PATTERN.test(upiId.trim())) return 'Enter a valid UPI ID, e.g. yourname@bank';
  return null;
}

export function validateLicenseNumber(licenseNumber) {
  const missing = required(licenseNumber, 'License number is required');
  if (missing) return missing;
  if (!LICENSE_NUMBER_PATTERN.test(licenseNumber.trim())) {
    return 'License number must be 3-50 characters (letters, numbers, spaces, - / . allowed)';
  }
  return null;
}

export function validateFile(file, { required: isRequired = false, allowedTypes = ACCEPTED_DOCUMENT_TYPES, label = 'File' } = {}) {
  if (!file) return isRequired ? `${label} is required` : null;
  if (file.size > MAX_FILE_SIZE_BYTES) return `${label} must be under 5MB`;
  if (allowedTypes.length && !allowedTypes.includes(file.type)) {
    return `${label} must be one of: ${allowedTypes.map((t) => t.split('/')[1]).join(', ')}`;
  }
  return null;
}
