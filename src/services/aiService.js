/**
 * AI Assistant Service for SchemeSetu
 * Sends text only to the app backend. The Groq key never enters the browser bundle.
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function processNaturalLanguageQuery(queryText, currentProfile = {}, language = 'hi') {
  let lastError;
  
  // Retry logic with exponential backoff
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch('/api/analyze-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, currentProfile, language }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        if (response.status === 502 || response.status === 503) {
          lastError = new Error('Backend service temporarily unavailable. Retrying...');
          if (attempt < MAX_RETRIES - 1) {
            await sleep(RETRY_DELAY * Math.pow(2, attempt));
            continue;
          }
        } else if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          lastError = new Error(errorData.error || 'Server error while analyzing profile');
        } else {
          lastError = new Error('Profile analysis unavailable');
        }
        throw lastError;
      }
      
      return await response.json();
    } catch (error) {
      lastError = error;
      
      // If it's a network error and we haven't exhausted retries, try again
      if (attempt < MAX_RETRIES - 1 && 
          (error instanceof TypeError || error.name === 'AbortError')) {
        await sleep(RETRY_DELAY * Math.pow(2, attempt));
        continue;
      }
      
      // Last attempt failed, throw the error
      throw lastError;
    }
  }
  
  throw lastError || new Error('Profile analysis unavailable');
}

export function fallbackLocalNLP(queryText) {
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
    extractedData: {
      category: "business",
      businessField: field
    },
    newInformationFound: [],
    missingInformation: [],
    nextQuestion: language === 'en' ? 'What state are you in?' : 'आप किस राज्य में हैं?',
    shouldFilterSchemes: false
  };
}

// Fallback handler if backend fails completely
export async function processNaturalLanguageQueryWithFallback(queryText, currentProfile = {}, language = 'hi') {
  try {
    return await processNaturalLanguageQuery(queryText, currentProfile, language);
  } catch (error) {
    console.warn('Backend failed, using local NLP fallback:', error.message);
    // Try local fallback as last resort
    return {
      extractedData: {
        category: currentProfile.category || null,
        businessField: currentProfile.businessField || null
      },
      newInformationFound: [],
      missingInformation: language === 'en' 
        ? ['Please tell us your state, income, and what support you need']
        : ['कृपया अपना राज्य, आय, और क्या सहायता चाहिए, यह बताइए'],
      nextQuestion: language === 'en'
        ? 'We had trouble understanding. Could you share your state and what business or support you need?'
        : 'हमें समझने में परेशानी हुई। कृपया अपना राज्य और आप किस व्यवसाय या सहायता की चाहत रखते हैं, बताइए?',
      shouldFilterSchemes: false
    };
  }
}
