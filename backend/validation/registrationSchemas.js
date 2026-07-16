const Joi = require('joi');

// Matches a dial code like "+91", "+1", "+44" - the exact country isn't
// validated here (that's the frontend's searchable country picker's job),
// just that it looks like a dial code.
const COUNTRY_CODE_PATTERN = /^\+\d{1,4}$/;

// Strict Indian format is only enforced when countryCode is +91; any other
// (or missing) country code just requires a non-empty value. This mirrors
// the indianPhoneValidator/indianZipCodeValidator on the Mongoose models.
const INDIAN_PHONE_PATTERN = /^\d{10}$/;
const INDIAN_ZIP_PATTERN = /^\d{6}$/;

// Minimum 8 characters, at least one letter and one number.
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const LICENSE_NUMBER_PATTERN = /^[A-Za-z0-9\-/. ]{3,50}$/;

// Matches the existing upiId validator on backend/models/Doctor.js
const UPI_ID_PATTERN = /^[a-zA-Z0-9.\-_]{1,256}@[a-zA-Z0-9.\-_]{1,64}$/;

const sharedFields = {
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  email: Joi.string().trim().email().required(),
  countryCode: Joi.string().trim().pattern(COUNTRY_CODE_PATTERN).required()
    .messages({ 'string.pattern.base': 'Country code must be a valid dial code, e.g. +91' }),
  phone: Joi.string().trim().required().when('countryCode', {
    is: '+91',
    then: Joi.string().pattern(INDIAN_PHONE_PATTERN)
      .messages({ 'string.pattern.base': 'Phone number must be exactly 10 digits for India (+91)' })
  }),
  dob: Joi.date().less('now').required()
    .messages({ 'date.less': 'Date of birth must be in the past', 'date.base': 'Date of birth must be a valid date' }),
  gender: Joi.string().valid('Male', 'Female', 'Others').required(),
  zipCode: Joi.string().trim().required().when('countryCode', {
    is: '+91',
    then: Joi.string().pattern(INDIAN_ZIP_PATTERN)
      .messages({ 'string.pattern.base': 'PIN code must be exactly 6 digits for India (+91)' })
  }),
  password: Joi.string().pattern(PASSWORD_PATTERN).required()
    .messages({ 'string.pattern.base': 'Password must be at least 8 characters and include a letter and a number' }),
  confirmPassword: Joi.any().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
};

const patientRegistrationSchema = Joi.object({ ...sharedFields });

const doctorRegistrationSchema = Joi.object({
  ...sharedFields,
  registrationNumber: Joi.string().trim().min(1).max(50).required(),
  specialization: Joi.string().trim().min(1).required(), // comma-separated free text, split into an array server-side
  experience: Joi.number().min(0).required(),
  price: Joi.number().min(0).required(),
  education: Joi.string().trim().min(1).max(100).required(),
  designation: Joi.string().trim().min(1).max(100).required(),
  upiId: Joi.string().trim().pattern(UPI_ID_PATTERN).allow('').optional()
    .messages({ 'string.pattern.base': 'Enter a valid UPI ID, e.g. yourname@bank' }),
});

const retailerRegistrationSchema = Joi.object({
  ...sharedFields,
  BusinessName: Joi.string().trim().min(1).max(100).required(),
  licenseNumber: Joi.string().trim().pattern(LICENSE_NUMBER_PATTERN).required()
    .messages({ 'string.pattern.base': 'License number must be 3-50 characters (letters, numbers, spaces, - / . allowed)' }),
});

// Runs a schema against req.body; returns a single joined error string (or
// null) to match this codebase's existing `{ error: '<message>' }` response
// shape, and the validated/coerced payload to use in place of the raw body.
function validateRegistration(schema, body) {
  const { error, value } = schema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return { error: error.details.map((d) => d.message).join(', '), value: null };
  }
  return { error: null, value };
}

module.exports = {
  patientRegistrationSchema,
  doctorRegistrationSchema,
  retailerRegistrationSchema,
  validateRegistration,
};
