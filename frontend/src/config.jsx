// Central place for all Vite env vars (import.meta.env.VITE_*) used across the app.
// Import from here instead of reading import.meta.env directly, so env var
// names only need to change in one place.

export const BACKEND_URL = import.meta.env.VITE_AYURVEDA_BACKEND_URL || 'http://localhost:8080';
export const NLP_URL = import.meta.env.VITE_AYURVEDA_NLP_URL;
export const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY;
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
