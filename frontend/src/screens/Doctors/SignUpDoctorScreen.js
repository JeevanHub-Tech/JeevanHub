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
  validateUpiId,
  validateFile,
  ACCEPTED_DOCUMENT_TYPES,
} from '../../components/registration/validation';
import '../../components/registration/RegistrationForm.css';

const GENDER_OPTIONS = ['Male', 'Female', 'Others'];

const INITIAL_STATE = {
  firstName: '',
  lastName: '',
  registrationNumber: '',
  email: '',
  countryCode: DEFAULT_COUNTRY_DIAL,
  phone: '',
  dob: '',
  gender: '',
  zipCode: '',
  education: '',
  designation: '',
  specialization: '',
  experience: '',
  price: '',
  upiId: '',
  password: '',
  confirmPassword: '',
};

function getErrors(form, certificate) {
  return {
    firstName: required(form.firstName, 'First name is required'),
    lastName: required(form.lastName, 'Last name is required'),
    registrationNumber: required(form.registrationNumber, 'Registration number is required'),
    email: validateEmail(form.email),
    phone: validatePhone(form.phone, form.countryCode),
    dob: validateDob(form.dob),
    gender: required(form.gender, 'Please select a gender'),
    zipCode: validateZipCode(form.zipCode, form.countryCode),
    education: required(form.education, 'Education is required'),
    designation: required(form.designation, 'Designation is required'),
    specialization: required(form.specialization, 'Specialization is required'),
    experience: required(form.experience, 'Experience is required'),
    price: required(form.price, 'Appointment fee is required'),
    upiId: validateUpiId(form.upiId),
    certificate: validateFile(certificate, { required: true, allowedTypes: ACCEPTED_DOCUMENT_TYPES, label: 'Certificate' }),
    password: validatePassword(form.password),
    confirmPassword: validateConfirmPassword(form.confirmPassword, form.password),
  };
}

function SignUpDoctorScreen() {
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [certificate, setCertificate] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = getErrors(formData, certificate);
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
      if (certificate) data.append('certificate', certificate);

      const response = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/auth/register/doctor`, {
        method: 'POST',
        credentials: 'include',
        body: data,
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('role', result.user.role);
        setAuth({ token: result.token, user: result.user, role: result.user.role });
        navigate('/doctor-home');
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
        <h1 className="rf-heading">Sign Up — Doctor</h1>
        <p className="rf-subheading">Expand your practice. Reach new patients seeking Ayurvedic care.</p>

        {serverError && <div className="rf-banner rf-banner-error">{serverError}</div>}

        <form className="rf-form" onSubmit={handleSubmit} noValidate autoComplete="off">
          <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} error={showError('firstName')} placeholder="Ram" />
          <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} error={showError('lastName')} placeholder="Singh" />
          <TextField label="Registration Number" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} onBlur={handleBlur} error={showError('registrationNumber')} placeholder="AYU123456" />
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
          <SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange} onBlur={handleBlur} error={showError('gender')} options={GENDER_OPTIONS} />
          <TextField label="PIN / Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} onBlur={handleBlur} error={showError('zipCode')} placeholder={formData.countryCode === '+91' ? '560001' : 'Postal code'} />

          <div className="rf-section-title">Professional details</div>
          <TextField label="Education (College)" name="education" value={formData.education} onChange={handleChange} onBlur={handleBlur} error={showError('education')} placeholder="Ayurvedic College" />
          <TextField label="Designation" name="designation" value={formData.designation} onChange={handleChange} onBlur={handleBlur} error={showError('designation')} placeholder="Vaidya" />
          <TextField label="Specialization" name="specialization" value={formData.specialization} onChange={handleChange} onBlur={handleBlur} error={showError('specialization')} placeholder="Dermatology, Cardiology" />
          <TextField label="Experience (years)" name="experience" type="number" min="0" value={formData.experience} onChange={handleChange} onBlur={handleBlur} error={showError('experience')} placeholder="5" />
          <TextField label="Appointment Fee (₹)" name="price" type="number" min="0" value={formData.price} onChange={handleChange} onBlur={handleBlur} error={showError('price')} placeholder="500" />
          <TextField label="UPI ID" name="upiId" value={formData.upiId} onChange={handleChange} onBlur={handleBlur} error={showError('upiId')} placeholder="yourname@bank" />

          <PasswordPairField
            passwordValue={formData.password}
            onPasswordChange={handleChange}
            passwordError={showError('password')}
            confirmValue={formData.confirmPassword}
            onConfirmChange={handleChange}
            confirmError={showError('confirmPassword')}
            onBlur={handleBlur}
            layout="row"
          />

          <div className="rf-field-full">
            <FileField
              label="Ayurvedic Degree Certificate"
              name="certificate"
              file={certificate}
              onChange={(file) => { setCertificate(file); setTouched((prev) => ({ ...prev, certificate: true })); }}
              error={showError('certificate')}
              helperText="Required. PNG, JPG or PDF, up to 5MB."
              required
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

export default SignUpDoctorScreen;
