import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { COUNTRY_CODES } from './countryCodes';

// Searchable dial-code picker: typing "+91" or "india" both filter to India.
function CountryCodeSelect({ value, onChange, onBlur, hasError }) {
  const listboxId = useId();
  const selected = useMemo(
    () => COUNTRY_CODES.find((c) => c.dial === value) || null,
    [value]
  );
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.dial.replace('+', '').includes(q)
    );
  }, [query]);

  const handleSelect = (country) => {
    onChange(country.dial);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="rf-country-select" ref={wrapRef}>
      <input
        type="text"
        className={`rf-input rf-country-input${hasError ? ' rf-input-error' : ''}`}
        value={isOpen ? query : selected ? selected.label : ''}
        placeholder="Search country or dial code"
        onFocus={() => {
          setIsOpen(true);
          setQuery('');
        }}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={onBlur}
        // Chrome frequently ignores a literal autocomplete="off" on text
        // inputs and shows its own field-value-history suggestions list on
        // top of our dropdown anyway. A nonsense token isn't a recognized
        // autofill category, which reliably suppresses it where "off" alone
        // doesn't.
        autoComplete="jh-country-search-no-autofill"
        name="jh-country-search"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={listboxId}
      />
      {isOpen && (
        <ul className="rf-country-dropdown" role="listbox" id={listboxId}>
          {filtered.length === 0 && <li className="rf-country-empty">No matches</li>}
          {filtered.map((country) => (
            <li
              key={country.iso}
              role="option"
              aria-selected={country.dial === value}
              className={`rf-country-option${country.dial === value ? ' rf-country-option-active' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); // keep focus so onBlur doesn't fire before the click registers
                handleSelect(country);
              }}
            >
              <span>{country.flag}</span>
              <span className="rf-country-name">{country.name}</span>
              <span className="rf-country-dial">{country.dial}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CountryCodeSelect;
