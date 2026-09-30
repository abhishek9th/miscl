// List of Indian States & Union Territories with their primary local language
export const INDIAN_STATES = [
  { name: "Andhra Pradesh", name_hi: "आंध्र प्रदेश", lang: "te" },
  { name: "Arunachal Pradesh", name_hi: "अरुणाचल प्रदेश", lang: "hi" },
  { name: "Assam", name_hi: "असम", lang: "bn" },
  { name: "Bihar", name_hi: "बिहार", lang: "hi" },
  { name: "Chhattisgarh", name_hi: "छत्तीसगढ़", lang: "hi" },
  { name: "Goa", name_hi: "गोवा", lang: "mr" },
  { name: "Gujarat", name_hi: "गुजरात", lang: "gu" },
  { name: "Haryana", name_hi: "हरियाणा", lang: "hi" },
  { name: "Himachal Pradesh", name_hi: "हिमाचल प्रदेश", lang: "hi" },
  { name: "Jharkhand", name_hi: "झारखंड", lang: "hi" },
  { name: "Karnataka", name_hi: "कर्नाटक", lang: "kn" },
  { name: "Kerala", name_hi: "केरल", lang: "ml" },
  { name: "Madhya Pradesh", name_hi: "मध्य प्रदेश", lang: "hi" },
  { name: "Maharashtra", name_hi: "महाराष्ट्र", lang: "mr" },
  { name: "Manipur", name_hi: "मणिपुर", lang: "hi" },
  { name: "Meghalaya", name_hi: "मेघालय", lang: "en" },
  { name: "Mizoram", name_hi: "मिजोरम", lang: "en" },
  { name: "Nagaland", name_hi: "नागालैंड", lang: "en" },
  { name: "Odisha", name_hi: "ओडिशा", lang: "or" },
  { name: "Punjab", name_hi: "पंजाब", lang: "pa" },
  { name: "Rajasthan", name_hi: "राजस्थान", lang: "hi" },
  { name: "Sikkim", name_hi: "सिक्किम", lang: "hi" },
  { name: "Tamil Nadu", name_hi: "तमिलनाडु", lang: "ta" },
  { name: "Telangana", name_hi: "तेलंगाना", lang: "te" },
  { name: "Tripura", name_hi: "त्रिपुरा", lang: "bn" },
  { name: "Uttar Pradesh", name_hi: "उत्तर प्रदेश", lang: "hi" },
  { name: "Uttarakhand", name_hi: "उत्तराखंड", lang: "hi" },
  { name: "West Bengal", name_hi: "पश्चिम बंगाल", lang: "bn" },
  { name: "Delhi (NCT)", name_hi: "दिल्ली", lang: "hi" },
  { name: "Jammu & Kashmir", name_hi: "जम्मू और कश्मीर", lang: "ur" },
  { name: "Ladakh", name_hi: "लद्दाख", lang: "hi" }
];


const norm = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/\(.*?\)/g, '').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

function matchState(name) {
  const n = norm(name);
  if (!n) return null;
  return INDIAN_STATES.find((s) => { const m = norm(s.name); return n === m || n.includes(m) || m.includes(n); }) || null;
}

// Reverse-geocode to an Indian state name. Tries Nominatim, then a second free
// provider, so one being rate-limited/blocked doesn't break location detection.
async function reverseGeocodeState(lat, lon) {
  const attempts = [
    async () => {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=5&accept-language=en`);
      if (!r.ok) throw new Error('nominatim ' + r.status);
      const d = await r.json();
      return d?.address?.state || d?.address?.region || d?.address?.state_district;
    },
    async () => {
      const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      if (!r.ok) throw new Error('bigdatacloud ' + r.status);
      const d = await r.json();
      return d?.principalSubdivision;
    },
  ];
  for (const attempt of attempts) {
    try {
      const st = matchState(await attempt());
      if (st) return st;
    } catch { /* try next provider */ }
  }
  return null;
}

// 'granted' | 'denied' | 'prompt' | 'unknown'
export async function getLocationPermission() {
  try {
    if (!navigator.permissions?.query) return 'unknown';
    return (await navigator.permissions.query({ name: 'geolocation' })).state;
  } catch { return 'unknown'; }
}

/**
 * Detect user location using Browser Geolocation API. Rejects (rather than
 * guessing a state) if the position or the state can't be determined, so the
 * caller can fall back to manual selection.
 */
export function detectUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const st = await reverseGeocodeState(lat, lon);
        if (!st) { reject(new Error('Could not work out your state from your location.')); return; }
        resolve({ state: st.name, state_hi: st.name_hi, suggestedLang: st.lang, lat, lon });
      },
      (error) => reject(error),
      { timeout: 15000, maximumAge: 300000 }
    );
  });
}
