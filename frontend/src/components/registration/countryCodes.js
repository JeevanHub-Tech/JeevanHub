// Dial codes for the registration forms' country picker. India is listed
// first since it's the default/most common case for this app's userbase.
const RAW_COUNTRIES = [
  ['India', 'IN', '+91'],
  ['United States', 'US', '+1'],
  ['United Kingdom', 'GB', '+44'],
  ['United Arab Emirates', 'AE', '+971'],
  ['Australia', 'AU', '+61'],
  ['Canada', 'CA', '+1'],
  ['Singapore', 'SG', '+65'],
  ['Saudi Arabia', 'SA', '+966'],
  ['Qatar', 'QA', '+974'],
  ['Kuwait', 'KW', '+965'],
  ['Oman', 'OM', '+968'],
  ['Bahrain', 'BH', '+973'],
  ['Nepal', 'NP', '+977'],
  ['Bangladesh', 'BD', '+880'],
  ['Sri Lanka', 'LK', '+94'],
  ['Pakistan', 'PK', '+92'],
  ['China', 'CN', '+86'],
  ['Japan', 'JP', '+81'],
  ['South Korea', 'KR', '+82'],
  ['Germany', 'DE', '+49'],
  ['France', 'FR', '+33'],
  ['Italy', 'IT', '+39'],
  ['Spain', 'ES', '+34'],
  ['Netherlands', 'NL', '+31'],
  ['Switzerland', 'CH', '+41'],
  ['Sweden', 'SE', '+46'],
  ['Norway', 'NO', '+47'],
  ['Ireland', 'IE', '+353'],
  ['New Zealand', 'NZ', '+64'],
  ['South Africa', 'ZA', '+27'],
  ['Nigeria', 'NG', '+234'],
  ['Kenya', 'KE', '+254'],
  ['Egypt', 'EG', '+20'],
  ['Malaysia', 'MY', '+60'],
  ['Thailand', 'TH', '+66'],
  ['Indonesia', 'ID', '+62'],
  ['Philippines', 'PH', '+63'],
  ['Vietnam', 'VN', '+84'],
  ['Brazil', 'BR', '+55'],
  ['Mexico', 'MX', '+52'],
  ['Russia', 'RU', '+7'],
];

// Derives a flag emoji from the ISO 3166-1 alpha-2 code (regional indicator
// symbols) instead of shipping flag image assets.
const flagEmoji = (iso) =>
  String.fromCodePoint(...[...iso].map((c) => 127397 + c.charCodeAt(0)));

export const COUNTRY_CODES = RAW_COUNTRIES.map(([name, iso, dial]) => ({
  name,
  iso,
  dial,
  flag: flagEmoji(iso),
  label: `${flagEmoji(iso)} ${name} (${dial})`,
}));

export const DEFAULT_COUNTRY_DIAL = '+91';
