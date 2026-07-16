import React from 'react';
import PasswordInput from './PasswordInput';
import CountryCodeSelect from './CountryCodeSelect';

const ErrorText = ({ error }) => (error ? <span className="rf-error-text">{error}</span> : null);

export function TextField({ label, name, value, onChange, onBlur, error, type = 'text', placeholder, ...rest }) {
  return (
    <div className="rf-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`rf-input${error ? ' rf-input-error' : ''}`}
        {...rest}
      />
      <ErrorText error={error} />
    </div>
  );
}

export function SelectField({ label, name, value, onChange, onBlur, error, options, placeholder = 'Select...' }) {
  return (
    <div className="rf-field">
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`rf-input rf-select${error ? ' rf-input-error' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ErrorText error={error} />
    </div>
  );
}

export function PasswordField({ label, name, value, onChange, onBlur, error }) {
  return (
    <div className="rf-field">
      <label htmlFor={name}>{label}</label>
      <PasswordInput name={name} value={value} onChange={onChange} onBlur={onBlur} hasError={!!error} />
      <ErrorText error={error} />
    </div>
  );
}

// Password + Confirm Password, laid out as an explicit single grid row
// instead of wherever the 2-column auto-flow happens to land them.
// layout="row" (Doctor): the two fields sit side by side, one per column.
// layout="stacked" (Patient/Retailer, default): they stack in the left
// column, and `rightSlot` - typically the zip/PIN field - fills the right
// column instead of leaving it blank.
export function PasswordPairField({
  passwordValue,
  onPasswordChange,
  passwordError,
  confirmValue,
  onConfirmChange,
  confirmError,
  onBlur,
  layout = 'stacked',
  rightSlot,
}) {
  if (layout === 'row') {
    return (
      <div className="rf-password-pair">
        <PasswordField label="Password" name="password" value={passwordValue} onChange={onPasswordChange} onBlur={onBlur} error={passwordError} />
        <PasswordField label="Confirm Password" name="confirmPassword" value={confirmValue} onChange={onConfirmChange} onBlur={onBlur} error={confirmError} />
      </div>
    );
  }

  return (
    <div className="rf-password-pair">
      <div className="rf-password-pair-col">
        <PasswordField label="Password" name="password" value={passwordValue} onChange={onPasswordChange} onBlur={onBlur} error={passwordError} />
        <PasswordField label="Confirm Password" name="confirmPassword" value={confirmValue} onChange={onConfirmChange} onBlur={onBlur} error={confirmError} />
      </div>
      {rightSlot && <div className="rf-password-pair-right">{rightSlot}</div>}
    </div>
  );
}

export function PhoneField({ countryCode, onCountryChange, phone, onPhoneChange, onBlur, countryError, phoneError }) {
  return (
    <div className="rf-field">
      <label htmlFor="phone">Phone Number</label>
      <div className="rf-phone-row">
        <CountryCodeSelect value={countryCode} onChange={onCountryChange} onBlur={onBlur} hasError={!!countryError} />
        <input
          id="phone"
          type="tel"
          name="phone"
          value={phone}
          onChange={onPhoneChange}
          onBlur={onBlur}
          placeholder={countryCode === '+91' ? '10-digit number' : 'Phone number'}
          className={`rf-input rf-phone-input${phoneError ? ' rf-input-error' : ''}`}
        />
      </div>
      <ErrorText error={countryError || phoneError} />
    </div>
  );
}

export function FileField({ label, name, file, onChange, error, helperText, required: isRequired, accept }) {
  return (
    <div className="rf-field rf-field-file">
      <label htmlFor={name}>
        {label}
        {!isRequired && <span className="rf-optional-tag"> (optional)</span>}
      </label>
      <input
        id={name}
        type="file"
        name={name}
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className={`rf-file-input${error ? ' rf-input-error' : ''}`}
      />
      {file && <p className="rf-file-selected">Selected: {file.name}</p>}
      {helperText && <p className="rf-file-info">{helperText}</p>}
      <ErrorText error={error} />
    </div>
  );
}
