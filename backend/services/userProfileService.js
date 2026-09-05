import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const getGroqClient = () => {
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const userProfileService = {
  analyzeProfile: async (queryText, currentProfile = {}, language = 'hi') => {
    try {
      const groq = getGroqClient();
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are SchemeSetu's careful government-scheme assistant. Extract only facts explicitly stated by the citizen. Never infer missing values. Merge new facts with currentProfile, preserving known values unless the user explicitly corrects them. Reply in ${language === 'en' ? 'simple English' : 'simple Hindi'}.

Return ONLY this valid JSON shape:
{
  "extractedData": {
    "category": "business" | "student" | "skill_employment" | null,
    "businessField": "agriculture_allied" | "manufacturing" | "retail_trading" | "food_processing" | "tech_it" | "transport" | "tourism" | "handicrafts" | "healthcare" | "services" | null,
    "businessSubField": string | null,
    "state": string | null,
    "annualFamilyIncome": number | null,
    "fundingRequirement": number | null,
    "businessStatus": "new" | "existing" | "expansion" | null,
    "gender": "male" | "female" | "other" | null,
    "socialCategory": "general" | "obc" | "sc" | "st" | "minorities" | "ews" | null,
    "studentType": "scholarship" | "education_loan" | "coaching_support" | "hostel_support" | "overseas" | null,
    "educationLevel": "school" | "class_10_12" | "undergraduate" | "postgraduate" | "professional" | "phd" | "overseas" | null,
    "course": "engineering" | "medical" | "management" | "arts" | "science" | "law" | "agriculture" | "other" | null
  },
  "newInformationFound": [string],
  "missingInformation": [string],
  "nextQuestion": string,
  "shouldFilterSchemes": boolean
}

Ask at most one short nextQuestion. Only ask for a field that materially helps the current deterministic filters. A category alone is enough to filter, but for business ask field before filtering if unknown; for student ask studentType before filtering if unknown. Set shouldFilterSchemes true once that minimum information is known, even if other optional fields remain null. Current profile: ${JSON.stringify(currentProfile)}`
          },
          { role: "user", content: queryText }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      throw error;
    }
  }
};

export default userProfileService;
