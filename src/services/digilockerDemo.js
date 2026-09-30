import { markDocumentAvailability, getDocumentAvailability } from './readinessService';

// PROTOTYPE ONLY — no real DigiLocker / NeSL account is contacted. "Linking"
// simulates the consent step and records document availability, tagged with the
// provider in document_availability.note so the UI can show where data came from.
export const PROVIDERS = {
  digilocker: { note: 'digilocker_demo', en: 'DigiLocker', hi: 'डिजिलॉकर', fetchedEn: 'Fetched from DigiLocker', fetchedHi: 'डिजिलॉकर से प्राप्त' },
  nesl: { note: 'nesl_demo', en: 'NeSL', hi: 'NeSL', fetchedEn: 'Fetched from NeSL', fetchedHi: 'NeSL से प्राप्त' },
};

// `keys` are real scheme requirement keys, so linking genuinely raises the
// readiness / completion %. PAN and Form 16A aren't scheme requirement keys, so
// they show as fetched without changing the score.
export const DEMO_DOCS = [
  { id: 'aadhaar', provider: 'digilocker', en: 'Aadhaar Card', hi: 'आधार कार्ड', issuer: 'UIDAI', keys: ['identity_proof', 'address_proof'] },
  { id: 'income', provider: 'digilocker', en: 'Income Certificate', hi: 'आय प्रमाण पत्र', issuer: 'State Revenue Dept.', keys: ['income_certificate'] },
  { id: 'marksheet', provider: 'digilocker', en: 'Class 12 Marksheet', hi: 'कक्षा 12 अंकतालिका', issuer: 'CBSE', keys: ['education_certificate'] },
  { id: 'pan', provider: 'nesl', en: 'PAN Card', hi: 'पैन कार्ड', issuer: 'Income Tax Dept.', keys: [] },
  { id: 'form16a', provider: 'nesl', en: 'Form 16A (TDS Certificate)', hi: 'फ़ॉर्म 16A (टीडीएस प्रमाणपत्र)', issuer: 'Income Tax Dept.', keys: [] },
  { id: 'bank', provider: 'nesl', en: 'Bank Account Details', hi: 'बैंक खाता विवरण', issuer: 'Linked bank', keys: ['bank_account'] },
];

const providerOfNote = (note) => Object.keys(PROVIDERS).find((p) => PROVIDERS[p].note === note) || null;

// Simulated consent + fetch for one provider. Needs a signed-in session.
export async function linkProvider(provider) {
  await new Promise((r) => setTimeout(r, 1400));
  const keys = [...new Set(DEMO_DOCS.filter((d) => d.provider === provider).flatMap((d) => d.keys))];
  await Promise.all(keys.map((k) => markDocumentAvailability(k, 'available_online', PROVIDERS[provider].note)));
}

// requirement_key -> 'digilocker' | 'nesl' for everything fetched via a provider.
export async function getFetchedSources() {
  const avail = await getDocumentAvailability();
  const map = {};
  for (const a of avail) {
    const p = providerOfNote(a.note);
    if (p) map[a.document_type] = p;
  }
  return map;
}
