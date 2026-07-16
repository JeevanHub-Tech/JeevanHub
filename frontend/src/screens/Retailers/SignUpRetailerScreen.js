import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { TextField, SelectField, PasswordPairField, PhoneField, FileField } from '../../components/registration/FormFields';
import { DEFAULT_COUNTRY_DIAL } from '../../components/registration/countryCodes';
import {
  required,
  validateEmail,
  validatePhone,
  validateZipCode,
  validateDob,
  validatePassword,
  validateConfirmPassword,
  validateLicenseNumber,
  validateFile,
  ACCEPTED_DOCUMENT_TYPES,
} from '../../components/registration/validation';
import '../../components/registration/RegistrationForm.css';

const GENDER_OPTIONS = ['Male', 'Female', 'Others'];

const INITIAL_STATE = {
  firstName: '',
  lastName: '',
  BusinessName: '',
  email: '',
  countryCode: DEFAULT_COUNTRY_DIAL,
  phone: '',
  dob: '',
  licenseNumber: '',
  gender: '',
  zipCode: '',
  password: '',
  confirmPassword: '',
};

function getErrors(form, licenseDocument) {
  return {
    firstName: required(form.firstName, 'First name is required'),
    lastName: required(form.lastName, 'Last name is required'),
    BusinessName: required(form.BusinessName, 'Business name is required'),
    email: validateEmail(form.email),
    phone: validatePhone(form.phone, form.countryCode),
    dob: validateDob(form.dob),
    licenseNumber: validateLicenseNumber(form.licenseNumber),
    gender: required(form.gender, 'Please select a gender'),
    zipCode: validateZipCode(form.zipCode, form.countryCode),
    licenseDocument: validateFile(licenseDocument, { required: false, allowedTypes: ACCEPTED_DOCUMENT_TYPES, label: 'License document' }),
    password: validatePassword(form.password),
    confirmPassword: validateConfirmPassword(form.confirmPassword, form.password),
  };
}

function SignUpRetailerScreen() {
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [licenseDocument, setLicenseDocument] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = getErrors(formData, licenseDocument);
  const showError = (field) => (touched[field] || submitted) ? errors[field] : null;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleCountryChange = (dial) => {
    setFormData((prev) => ({ ...prev, countryCode: dial }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError('');

    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) return;

    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, value));
      if (licenseDocument) data.append('licenseDocument', licenseDocument);

      const response = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/auth/register/retailer`, {
        method: 'POST',
        credentials: 'include',
        body: data,
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('role', result.user.role);
        setAuth({ token: result.token, user: result.user, role: result.user.role });
        navigate('/retailer-home');
      } else {
        setServerError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setServerError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rf-page">
      <div className="rf-card">
        <h1 className="rf-heading">Sign Up — Retailer</h1>
        <p className="rf-subheading">Bring your store online. Reach patients looking for Ayurvedic products.</p>

        {serverError && <div className="rf-banner rf-banner-error">{serverError}</div>}

        <form className="rf-form" onSubmit={handleSubmit} noValidate autoComplete="off">
          <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} error={showError('firstName')} placeholder="Ram" />
          <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} error={showError('lastName')} placeholder="Singh" />
          <TextField label="Business Name" name="BusinessName" value={formData.BusinessName} onChange={handleChange} onBlur={handleBlur} error={showError('BusinessName')} placeholder="ABC Pharmacy" />
          <TextField label="Email ID" name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={showError('email')} placeholder="abc@gmail.com" />
          <PhoneField
            countryCode={formData.countryCode}
            onCountryChange={handleCountryChange}
            phone={formData.phone}
            onPhoneChange={handleChange}
            onBlur={handleBlur}
            countryError={null}
            phoneError={showError('phone')}
          />
          <TextField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} onBlur={handleBlur} error={showError('dob')} max={new Date().toISOString().split('T')[0]} />
          <TextField label="License Number" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} onBlur={handleBlur} error={showError('licenseNumber')} placeholder="KA-B5-12345" />
          <SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange} onBlur={handleBlur} error={showError('gender')} options={GENDER_OPTIONS} />

          <PasswordPairField
            passwordValue={formData.password}
            onPasswordChange={handleChange}
            passwordError={showError('password')}
            confirmValue={formData.confirmPassword}
            onConfirmChange={handleChange}
            confirmError={showError('confirmPassword')}
            onBlur={handleBlur}
            rightSlot={
              <TextField label="PIN / Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} onBlur={handleBlur} error={showError('zipCode')} placeholder={formData.countryCode === '+91' ? '560001' : 'Postal code'} />
            }
          />

          <div className="rf-field-full">
            <FileField
              label="License Document"
              name="licenseDocument"
              file={licenseDocument}
              onChange={(file) => { setLicenseDocument(file); setTouched((prev) => ({ ...prev, licenseDocument: true })); }}
              error={showError('licenseDocument')}
              helperText="Optional — you can add this later from your profile. PNG, JPG or PDF, up to 5MB."
              accept=".png,.jpg,.jpeg,.pdf"
            />
          </div>

          <div className="rf-submit-row">
            <button type="submit" className="rf-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Sign Up →'}
            </button>
          </div>
          <p className="rf-footer-note">
            Already have an account? <a href="/signin">Log in</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignUpRetailerScreen;
