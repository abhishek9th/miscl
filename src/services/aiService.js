/**
 * AI Assistant Service for SchemeSetu
 * Sends text only to the app backend. The Groq key never enters the browser bundle.
 */

export async function processNaturalLanguageQuery(queryText, currentProfile = {}, language = 'hi') {
  const response = await fetch('/api/analyze-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: queryText, currentProfile, language })
  });
  if (!response.ok) throw new Error('Profile analysis unavailable');
  return response.json();
}

function fallbackLocalNLP(queryText) {
  const text = queryText.toLowerCase();

  // Student checks
  if (text.includes("स्कॉलरशिप") || text.includes("छात्रवृत्ति") || text.includes("scholarship") ||
      text.includes("फीस") || text.includes("पढ़ाई") || text.includes("इंजीनियरिंग") || 
      text.includes("कोचिंग") || text.includes("लोन") && (text.includes("कॉलेज") || text.includes("स्कूल"))) {
    
    let studentType = "scholarship";
    if (text.includes("लोन") || text.includes("ऋण") || text.includes("loan")) studentType = "education_loan";
    if (text.includes("कोचिंग") || text.includes("upsc") || text.includes("neet")) studentType = "coaching_support";
    if (text.includes("विदेश") || text.includes("abroad") || text.includes("foreign")) studentType = "overseas";

    let eduLevel = "undergraduate";
    if (text.includes("स्कूल") || text.includes("9वीं") || text.includes("10वीं") || text.includes("12वीं")) eduLevel = "school";
    if (text.includes("मास्टर्स") || text.includes("pg")) eduLevel = "postgraduate";

    return {
      user_type: "student",
      student_type: studentType,
      education_level: eduLevel,
      summary_hi: "हमें समझ आया कि आप छात्र सहायता (छात्रवृत्ति / शिक्षा ऋण) की तलाश में हैं।"
    };
  }

  // Skill / Employment checks
  if (text.includes("ट्रेनिंग") || text.includes("प्रशिक्षण") || text.includes("सिखना") || text.includes("नौकरी") || text.includes("सिलाई") || text.includes("कोडिंग")) {
    return {
      user_type: "skill_employment",
      summary_hi: "हमें समझ आया कि आप मुफ़्त कौशल विकास प्रशिक्षण या रोजगार सहायता खोज रहे हैं।"
    };
  }

  // Default Business Flow
  let field = "services";
  if (text.includes("डेयरी") || text.includes("गाय") || text.includes("भैंस") || text.includes("खेती") || text.includes("कृषि") || text.includes("पशु")) field = "agriculture_allied";
  if (text.includes("दुकान") || text.includes("व्यापार") || text.includes("स्टोर") || text.includes("बेचना")) field = "retail_trading";
  if (text.includes("आचार") || text.includes("पापड़") || text.includes("जूस") || text.includes("खाद्य") || text.includes("फूड")) field = "food_processing";
  if (text.includes("कारीगर") || text.includes("दर्जी") || text.includes("बढ़ई") || text.includes("हस्तशिल्प") || text.includes("औजार")) field = "handicrafts";
  if (text.includes("फैक्ट्री") || text.includes("प्लांट") || text.includes("मशीन")) field = "manufacturing";

  return {
    user_type: "business",
    field: field,
    summary_hi: "हमें समझ आया कि आप नया व्यवसाय या उद्योग शुरू करने के लिए सरकारी लोन सहायता खोज रहे हैं।"
  };
}
