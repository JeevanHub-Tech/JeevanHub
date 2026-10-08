import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { TextField, SelectField, PasswordPairField, PhoneField } from '../../components/registration/FormFields';
import { DEFAULT_COUNTRY_DIAL } from '../../components/registration/countryCodes';
import { required, validateEmail, validatePhone, validateZipCode, validateDob, validatePassword, validateConfirmPassword } from '../../components/registration/validation';
import { BACKEND_URL } from '../../config';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

function getErrors(form, t) {
  return {
    firstName: required(form.firstName, t('auth.signUpForms.errors.firstNameRequired')),
    lastName: required(form.lastName, t('auth.signUpForms.errors.lastNameRequired')),
    email: validateEmail(form.email),
    phone: validatePhone(form.phone, form.countryCode),
    dob: validateDob(form.dob),
    gender: required(form.gender, t('auth.signUpForms.errors.genderRequired')),
    zipCode: validateZipCode(form.zipCode, form.countryCode),
    password: validatePassword(form.password),
    confirmPassword: validateConfirmPassword(form.confirmPassword, form.password),
  };
}

function SignUpPatientScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useContext(AuthContext);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const genderOptions = [
    { value: 'Male', label: t('auth.signUpForms.genders.Male') },
    { value: 'Female', label: t('auth.signUpForms.genders.Female') },
    { value: 'Others', label: t('auth.signUpForms.genders.Others') },
  ];

  const errors = getErrors(formData, t);
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
      const response = await fetch(`${BACKEND_URL}/api/auth/register/patient`, {
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
        setServerError(result.error || t('auth.signUpForms.errors.serverErrorDefault'));
      }
    } catch (error) {
      setServerError(t('auth.signUpForms.errors.serverUnreachable'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <Card className="mx-auto max-w-4xl p-7 sm:p-11">
        <h1 className="font-display text-3xl text-foreground">{t('auth.signUpForms.patientTitle')}</h1>
        <p className="mb-8 text-muted-foreground">{t('auth.signUpForms.patientSubtitle')}</p>

        {serverError ? (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <form className="grid grid-cols-1 gap-x-7 sm:grid-cols-2" onSubmit={handleSubmit} noValidate autoComplete="off">
          <TextField label={t('auth.signUpForms.firstName')} name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} error={showError('firstName')} placeholder="Ram" />
          <TextField label={t('auth.signUpForms.lastName')} name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} error={showError('lastName')} placeholder="Singh" />
          <TextField label={t('auth.signUpForms.email')} name="email" type="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={showError('email')} placeholder="abc@gmail.com" />
          <PhoneField
            label={t('auth.signUpForms.phone')}
            countryCode={formData.countryCode}
            onCountryChange={handleCountryChange}
            phone={formData.phone}
            onPhoneChange={handleChange}
            onBlur={handleBlur}
            countryError={null}
            phoneError={showError('phone')}
          />
          <TextField label={t('auth.signUpForms.dob')} name="dob" type="date" value={formData.dob} onChange={handleChange} onBlur={handleBlur} error={showError('dob')} max={new Date().toISOString().split('T')[0]} />
          <SelectField label={t('auth.signUpForms.gender')} name="gender" value={formData.gender} onChange={handleChange} onBlur={handleBlur} error={showError('gender')} options={genderOptions} placeholder={t('auth.signUpForms.selectGender')} />

          <PasswordPairField
            passwordLabel={t('auth.signUpForms.password')}
            confirmLabel={t('auth.signUpForms.confirmPassword')}
            passwordValue={formData.password}
            onPasswordChange={handleChange}
            passwordError={showError('password')}
            confirmValue={formData.confirmPassword}
            onConfirmChange={handleChange}
            confirmError={showError('confirmPassword')}
            onBlur={handleBlur}
            rightSlot={
              <TextField label={t('auth.signUpForms.zipCode')} name="zipCode" value={formData.zipCode} onChange={handleChange} onBlur={handleBlur} error={showError('zipCode')} placeholder={formData.countryCode === '+91' ? '560001' : 'Postal code'} />
            }
          />

          <div className="col-span-full mt-6 flex justify-center">
            <Button type="submit" size="lg" className="rounded-full px-12" disabled={isSubmitting}>
              {isSubmitting ? t('auth.signUpForms.registering') : t('auth.signUpForms.submitBtn')}
            </Button>
          </div>
          <p className="col-span-full mt-3.5 text-center text-sm text-muted-foreground">
            {t('auth.signUpForms.alreadyHaveAccount')} <a href="/signin" className="font-semibold text-primary hover:underline">{t('auth.signUpForms.logIn')}</a>
          </p>
        </form>
      </Card>
    </DashboardShell>
  );
}

export default SignUpPatientScreen;
