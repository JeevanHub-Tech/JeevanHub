import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { TextField, SelectField, PasswordPairField, PhoneField } from '../../components/registration/FormFields';
import { DEFAULT_COUNTRY_DIAL } from '../../components/registration/countryCodes';
import { required, validateEmail, validatePhone, validateZipCode, validateDob, validatePassword, validateConfirmPassword } from '../../components/registration/validation';
import '../../components/registration/RegistrationForm.css';

const GENDER_OPTIONS = ['Male', 'Female', 'Others'];

const INITIAL_STATE = {
  firstName: '',
  lastName: '',
  email: '',
  countryCode: DEFAULT_COUNTRY_DIAL,
  phone: '',
  dob: '',
  gender: '',
  zipCode: '',
  password: '',
  confirmPassword: '',
};

function getErrors(form) {
  return {
    firstName: required(form.firstName, 'First name is required'),
    lastName: required(form.lastName, 'Last name is required'),
    email: validateEmail(form.email),
    phone: validatePhone(form.phone, form.countryCode),
    dob: validateDob(form.dob),
    gender: required(form.gender, 'Please select a gender'),
    zipCode: validateZipCode(form.zipCode, form.countryCode),
    password: validatePassword(form.password),
    confirmPassword: validateConfirmPassword(form.confirmPassword, form.password),
  };
}

function SignUpPatientScreen() {
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = getErrors(formData);
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
      const response = await fetch(`${process.env.REACT_APP_AYURVEDA_BACKEND_URL}/api/auth/register/patient`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('role', result.user.role);
        setAuth({ token: result.token, user: result.user, role: result.user.role });
        navigate('/patient-home');
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
        <h1 className="rf-heading">Sign Up — Patient</h1>
        <p className="rf-subheading">Unlock your inner balance. Start your Ayurvedic journey today.</p>

        {serverError && <div className="rf-banner rf-banner-error">{serverError}</div>}

        <form className="rf-form" onSubmit={handleSubmit} noValidate autoComplete="off">
          <TextField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} error={showError('firstName')} placeholder="Ram" />
          <TextField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} error={showError('lastName')} placeholder="Singh" />
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

export default SignUpPatientScreen;
