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

/**
 * Detect user location using Browser Geolocation API
 */
export async function detectUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Attempt Nominatim reverse geocoding API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          const data = await response.json();

          let stateName = data?.address?.state || data?.address?.region || "Uttar Pradesh";
          
          // Match with our standard state list
          const matchedState = INDIAN_STATES.find(s => 
            stateName.toLowerCase().includes(s.name.toLowerCase()) || 
            s.name.toLowerCase().includes(stateName.toLowerCase())
          ) || INDIAN_STATES.find(s => s.name === "Uttar Pradesh");

          resolve({
            state: matchedState.name,
            state_hi: matchedState.name_hi,
            suggestedLang: matchedState.lang,
            lat,
            lon
          });
        } catch (err) {
          // Default fallback state (e.g. Uttar Pradesh)
          resolve({
            state: "Uttar Pradesh",
            state_hi: "उत्तर प्रदेश",
            suggestedLang: "en"
          });
        }
      },
      (error) => {
        reject(error);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  });
}
