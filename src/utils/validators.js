// Shared, lightweight validation helpers for the onboarding wizard and any
// other form that collects the same reusable fields. Each returns an error
// message string (bilingual via the caller's tr()) or null when valid.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PINCODE_RE = /^[0-9]{6}$/;
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const AADHAAR_RE = /^[0-9]{12}$/;
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const MOBILE_RE = /^[6-9][0-9]{9}$/; // Indian mobile numbers

export function isValidEmail(v) { return !v || EMAIL_RE.test(String(v).trim()); }
export function isValidPincode(v) { return !v || PINCODE_RE.test(String(v).trim()); }
export function isValidIfsc(v) { return !v || IFSC_RE.test(String(v).trim().toUpperCase()); }
export function isValidAadhaar(v) { return !v || AADHAAR_RE.test(String(v).replace(/\s/g, '')); }
export function isValidPan(v) { return !v || PAN_RE.test(String(v).trim().toUpperCase()); }
export function isValidMobile(v) { return !v || MOBILE_RE.test(String(v).replace(/\D/g, '')); }

// Basic sanity check for a date string (YYYY-MM-DD from an <input type="date">):
// not in the future, and not absurdly old (>120 years).
export function isValidPastDate(v) {
  if (!v) return true;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
  return d <= now && d >= minDate;
}

// Whole-years age as of today from a YYYY-MM-DD date-of-birth string.
export function ageFromDob(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : '';
}

export function isValidPercentage(v) {
  if (v === '' || v === null || v === undefined) return true;
  const n = Number(v);
  return !Number.isNaN(n) && n >= 0 && n <= 100;
}
