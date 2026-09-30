import { markDocumentAvailability, getDocumentAvailability } from './readinessService';

// PROTOTYPE ONLY — no real DigiLocker / NeSL account is contacted. "Linking"
// simulates the consent step and records document availability, tagged with the
// provider in document_availability.note so the UI can show where data came from.
export const PROVIDERS = {
  digilocker: { note: 'digilocker_demo', en: 'DigiLocker', hi: 'डिजिलॉकर', fetchedEn: 'Fetched from DigiLocker', fetchedHi: 'डिजिलॉकर से प्राप्त' },
  nesl: { note: 'nesl_demo', en: 'NeSL', hi: 'NeSL', fetchedEn: 'Fetched from NeSL', fetchedHi: 'NeSL से प्राप्त' },
};

// `keys` are real scheme requirement keys, so linking genuinely raises the
// readiness / completion %. Documents with no key (ration card, Form 16, ABHA,
// APAAR…) are shown as fetched but no scheme requires them yet, so they don't
// change any score. Every document also gets a `demo_<id>` marker row so the
// profile can list it even when it has no requirement key.
export const DEMO_DOCS = [
  { id: 'aadhaar', provider: 'digilocker', en: 'Aadhaar Card', hi: 'आधार कार्ड', issuer: 'UIDAI', keys: ['aadhaar', 'identity_proof', 'address_proof', 'age_proof'], value: 'XXXX XXXX 4821 · Issued 2016' },
  { id: 'ration', provider: 'digilocker', en: 'Ration Card', hi: 'राशन कार्ड', issuer: 'Food & Civil Supplies Dept.', keys: [], value: 'Card No. 2000 0471 2385 · Priority Household (PHH) · 4 members' },
  { id: 'dl', provider: 'digilocker', en: 'Driving Licence', hi: 'ड्राइविंग लाइसेंस', issuer: 'Transport Dept. (Parivahan)', keys: ['business_registration'], value: 'DL No. JH05 20190012345 · LMV, MCWG · Valid till 14 Mar 2039' },
  { id: 'marksheet', provider: 'digilocker', en: 'Class 12 Marksheet', hi: 'कक्षा 12 अंकतालिका', issuer: 'CBSE', keys: ['academic_marksheet', 'education_certificate', 'min_education'], value: 'Roll No. 24051873 · 82.4% · Passed 2023' },
  { id: 'caste', provider: 'digilocker', en: 'Caste Certificate', hi: 'जाति प्रमाण पत्र', issuer: 'State Revenue Dept.', keys: ['caste_certificate'], value: 'Cert. No. JH/CST/2022/08841 · Issued 12 Aug 2022' },
  { id: 'income', provider: 'digilocker', en: 'Income Certificate', hi: 'आय प्रमाण पत्र', issuer: 'State Revenue Dept.', keys: ['income_certificate'], value: 'Cert. No. JH/INC/2025/03317 · Annual income ₹1,80,000 · Valid till 31 Mar 2027' },
  { id: 'domicile', provider: 'digilocker', en: 'Domicile Certificate', hi: 'निवास प्रमाण पत्र', issuer: 'State Revenue Dept.', keys: [], value: 'Cert. No. JH/DOM/2021/15520 · Resident of Jharkhand · Issued 3 Feb 2021' },
  { id: 'abha', provider: 'digilocker', en: 'ABHA ID (Health ID)', hi: 'आभा आईडी (हेल्थ आईडी)', issuer: 'National Health Authority', keys: [], value: 'ABHA No. 91-2745-8830-6152 · Address: user@abdm' },
  { id: 'apaar', provider: 'digilocker', en: 'APAAR ID', hi: 'अपार आईडी', issuer: 'Ministry of Education', keys: [], value: 'APAAR ID 4B2F 71D9 03A6 · Linked to academic records' },
  { id: 'pan', provider: 'nesl', en: 'PAN Card', hi: 'पैन कार्ड', issuer: 'Income Tax Dept.', keys: ['pan_card'], value: 'ABCPX••34K · Individual · Aadhaar-linked' },
  { id: 'form16', provider: 'nesl', en: 'Form 16', hi: 'फ़ॉर्म 16', issuer: 'Income Tax Dept.', keys: [], value: 'FY 2024-25 · Gross salary ₹3,60,000 · TDS deducted ₹0' },
  { id: 'bank', provider: 'nesl', en: 'Bank Account Details', hi: 'बैंक खाता विवरण', issuer: 'Linked bank', keys: ['bank_account'], value: 'State Bank of India · A/c XXXXXX4562 · IFSC SBIN0001234' },
];

export const markerKey = (docId) => `demo_${docId}`;
const providerOfNote = (note) => Object.keys(PROVIDERS).find((p) => PROVIDERS[p].note === note) || null;

// Simulated consent + fetch for one provider. Needs a signed-in session.
export async function linkProvider(provider) {
  await new Promise((r) => setTimeout(r, 1400));
  const docs = DEMO_DOCS.filter((d) => d.provider === provider);
  const keys = [...new Set([...docs.flatMap((d) => d.keys), ...docs.map((d) => markerKey(d.id))])];
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

// The demo documents that have actually been fetched for the signed-in user.
export async function getFetchedDocs() {
  const sources = await getFetchedSources();
  return DEMO_DOCS.filter((d) => sources[markerKey(d.id)] === d.provider);
}
