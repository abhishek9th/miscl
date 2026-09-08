import { SCHEMES } from '../data/schemes';

/**
 * Filter business schemes step-by-step
 */
export function filterBusinessSchemes(schemes = SCHEMES, criteria = {}) {
  let pool = schemes.filter(s => s.type === 'business');
  let lastFilteredFactor = null;

  // 1. Business Field Filter
  if (criteria.field) {
    const prevCount = pool.length;
    pool = pool.filter(s => s.fields.includes(criteria.field) || s.fields.includes('all'));
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `इस क्षेत्र (${getFieldLabel(criteria.field)}) में वर्तमान में कोई योजना नहीं मिली।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 2. State Filter (Central schemes remain valid across ALL states)
  if (criteria.state) {
    const prevCount = pool.length;
    pool = pool.filter(s => {
      if (s.scope === 'central' || (s.states && s.states.includes('all'))) return true;
      return s.states && s.states.includes(criteria.state);
    });
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `${criteria.state} राज्य में इस क्षेत्र हेतु वर्तमान में कोई विशेष योजना नहीं मिली।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 3. Income Filter
  if (criteria.income !== undefined && criteria.income !== null && criteria.income !== '') {
    const userIncome = Number(criteria.income);
    const prevCount = pool.length;
    pool = pool.filter(s => {
      if (s.income_limit === null || s.income_limit === undefined) return true;
      return userIncome <= s.income_limit;
    });
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `पारिवारिक आय (₹${userIncome.toLocaleString('en-IN')}) इस श्रेणी की योजनाओं की पात्रता आय सीमा से अधिक है।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 4. Business Status Filter
  if (criteria.business_status) {
    const prevCount = pool.length;
    pool = pool.filter(s => {
      if (!s.business_status || s.business_status.includes('all')) return true;
      return s.business_status.includes(criteria.business_status);
    });
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `चुनी गई व्यवसाय स्थिति (${getStatusLabel(criteria.business_status)}) के लिए उपयुक्त योजना उपलब्ध नहीं है।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 5. Required Financial Assistance Filter
  if (criteria.financial_need) {
    const userNeed = Number(criteria.financial_need);
    const prevCount = pool.length;
    
    // Tag partial funding instead of immediately dropping if scheme offers >= 20% of required funding
    pool = pool.map(s => {
      const isPartial = s.max_financial_assistance < userNeed;
      return {
        ...s,
        isPartialMatch: isPartial
      };
    });

    // Only drop if scheme maximum assistance is way below needed (e.g. less than 10% of requirement)
    pool = pool.filter(s => s.max_financial_assistance >= userNeed * 0.1);

    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `मांगी गई वित्तीय सहायता (₹${userNeed.toLocaleString('en-IN')}) के लिए कोई संबंधित योजना नहीं मिली।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 6. Reservation / Social Category Filter
  if (criteria.social_category) {
    const prevCount = pool.length;
    pool = pool.filter(s => {
      if (!s.eligible_categories || s.eligible_categories.includes('all')) return true;
      return s.eligible_categories.includes(criteria.social_category);
    });
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `चुनी गई आरक्षण श्रेणी (${criteria.social_category.toUpperCase()}) के लिए वर्तमान में उपयुक्त योजना नहीं मिली।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 7. Category Filter
  if (criteria.gender) {
    const prevCount = pool.length;
    pool = pool.filter(s => {
      if (!s.eligible_genders || s.eligible_genders.includes('all')) return true;
      return s.eligible_genders.includes(criteria.gender);
    });
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `चुनी गई श्रेणी के लिए इस क्षेत्र में कोई सीमित योजना नहीं मिली।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  return { pool, lastFilteredFactor };
}

/**
 * Filter student schemes step-by-step
 */
export function filterStudentSchemes(schemes = SCHEMES, criteria = {}) {
  let pool = schemes.filter(s => s.type === 'student');
  let lastFilteredFactor = null;

  // 1. Student Support Type
  if (criteria.student_type) {
    const prevCount = pool.length;
    pool = pool.filter(s => s.student_type === criteria.student_type || s.student_type === 'all');
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `छात्र सहायता प्रकार (${getStudentTypeLabel(criteria.student_type)}) के लिए वर्तमान में योजना उपलब्ध नहीं है।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 2. Education Level
  if (criteria.education_level) {
    const prevCount = pool.length;
    pool = pool.filter(s => s.education_levels.includes(criteria.education_level) || s.education_levels.includes('all'));
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `इस शिक्षा स्तर (${criteria.education_level}) के लिए योजनाएं उपलब्ध नहीं हैं।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 3. Course / Field of Study
  if (criteria.course_field) {
    const prevCount = pool.length;
    pool = pool.filter(s => s.course_fields.includes(criteria.course_field) || s.course_fields.includes('all'));
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `इस अध्ययन क्षेत्र (${criteria.course_field}) के लिए उपयुक्त स्कॉलरशिप / लोन योजना नहीं मिली।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 4. State
  if (criteria.state) {
    const prevCount = pool.length;
    pool = pool.filter(s => {
      if (s.scope === 'central' || (s.states && s.states.includes('all'))) return true;
      return s.states && s.states.includes(criteria.state);
    });
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `${criteria.state} राज्य में इस छात्र श्रेणी के लिए कोई राज्य-विशिष्ट योजना नहीं मिली।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 5. Income
  if (criteria.income !== undefined && criteria.income !== null && criteria.income !== '') {
    const userIncome = Number(criteria.income);
    const prevCount = pool.length;
    pool = pool.filter(s => {
      if (s.income_limit === null || s.income_limit === undefined) return true;
      return userIncome <= s.income_limit;
    });
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `पारिवारिक आय (₹${userIncome.toLocaleString('en-IN')}) इस स्कॉलरशिप योजना की अधिकतम आय सीमा (₹2.5 - 4.5 लाख) से अधिक है।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 6. Social Category
  if (criteria.social_category) {
    const prevCount = pool.length;
    pool = pool.filter(s => {
      if (!s.eligible_categories || s.eligible_categories.includes('all')) return true;
      return s.eligible_categories.includes(criteria.social_category);
    });
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `चुनी गई सामाजिक श्रेणी (${criteria.social_category.toUpperCase()}) के लिए वर्तमान में उपयुक्त योजना नहीं मिली।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  // 7. Category
  if (criteria.gender) {
    const prevCount = pool.length;
    pool = pool.filter(s => {
      if (!s.eligible_genders || s.eligible_genders.includes('all')) return true;
      return s.eligible_genders.includes(criteria.gender);
    });
    if (pool.length === 0 && prevCount > 0) {
      lastFilteredFactor = `चुनी गई श्रेणी के लिए इस स्कॉलरशिप श्रेणी में कोई सीमित योजना नहीं मिली।`;
      return { pool: [], lastFilteredFactor };
    }
  }

  return { pool, lastFilteredFactor };
}

/**
 * Filter Skill & Employment schemes
 */
export function filterSkillSchemes(schemes = SCHEMES, criteria = {}) {
  let pool = schemes.filter(s => s.type === 'skill_employment');
  if (criteria.state) {
    pool = pool.filter(s => s.scope === 'central' || (s.states && s.states.includes(criteria.state)));
  }
  return { pool, lastFilteredFactor: null };
}

// Helpers for human-readable labels in Hindi
function getFieldLabel(key) {
  const map = {
    agriculture_allied: 'कृषि एवं पशुपालन',
    manufacturing: 'विनिर्माण / मैन्युफैक्चरिंग',
    retail_trading: 'दुकान व खुदरा व्यापार',
    food_processing: 'खाद्य प्रसंस्करण (Food Processing)',
    tech_it: 'प्रौद्योगिकी / आईटी',
    transport: 'परिवहन व लॉजिस्टिक्स',
    tourism: 'पर्यटन व होटल',
    handicrafts: 'हस्तशिल्प व पारंपरिक कारीगरी',
    healthcare: 'स्वास्थ्य सेवा',
    services: 'अन्य सेवा कार्य'
  };
  return map[key] || key;
}

function getStatusLabel(key) {
  const map = {
    new: 'नया व्यवसाय शुरू करना',
    existing: 'मौजूदा व्यवसाय चलाना',
    expansion: 'व्यवसाय बढ़ाना'
  };
  return map[key] || key;
}

function getStudentTypeLabel(key) {
  const map = {
    scholarship: 'छात्रवृत्ति (Scholarship)',
    education_loan: 'शिक्षा ऋण (Education Loan)',
    coaching_support: 'निःशुल्क कोचिंग सहायता',
    hostel_support: 'छात्रावास सहायता',
    overseas: 'विदेश अध्ययन छात्रवृत्ति'
  };
  return map[key] || key;
}
