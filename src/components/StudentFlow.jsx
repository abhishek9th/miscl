import React, { useState } from 'react';
import { ArrowLeft, Check, Search, MapPin, User } from 'lucide-react';
import { INDIAN_STATES } from '../services/locationService';
import { filterStudentSchemes } from '../services/filterService';
import { SCHEMES } from '../data/schemes';
import { getTranslation } from '../data/translations';

export default function StudentFlow({ 
  userState, 
  onComplete, 
  onNoSchemesFound, 
  onBackToHome,
  currentLang
}) {
  const [step, setStep] = useState(1);
  const [criteria, setCriteria] = useState({
    student_type: '',
    education_level: '',
    course_field: '',
    state: userState || 'Uttar Pradesh',
    income: '',
    social_category: '',
    gender: ''
  });

  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [customIncomeInput, setCustomIncomeInput] = useState('');

  const t = (key) => getTranslation(currentLang, key);
  const isHindi = currentLang !== 'en';
  const { pool: matchingPool, lastFilteredFactor } = filterStudentSchemes(SCHEMES, criteria);

  // 1. Student Support Options
  const SUPPORT_TYPES = isHindi ? [
    { id: 'scholarship', label: '🎓 छात्रवृत्ति', desc: 'ट्यूशन शुल्क प्रतिपूर्ति और वार्षिक अध्ययन अनुदान' },
    { id: 'education_loan', label: '💳 शिक्षा ऋण', desc: 'कॉलेज शुल्क और छात्रावास के लिए रियायती बैंक ऋण' },
    { id: 'coaching_support', label: '📚 निःशुल्क कोचिंग सहायता', desc: 'UPSC, NEET, JEE और बैंकिंग के लिए कोचिंग' },
    { id: 'hostel_support', label: '🏠 छात्रावास एवं आवास सहायता', desc: 'रहने और भोजन के खर्च में सहायता' },
    { id: 'overseas', label: '🌍 विदेश में शिक्षा सहायता', desc: 'विदेशी विश्वविद्यालयों में उच्च शिक्षा के लिए सहायता' }
  ] : [
    { id: 'scholarship', label: '🎓 Scholarship', desc: 'Tuition fee reimbursement and annual study grant' },
    { id: 'education_loan', label: '💳 Education Loan', desc: 'Subsidized bank loans for college fees & hostel' },
    { id: 'coaching_support', label: '📚 Free Coaching Support', desc: 'Free coaching for UPSC, NEET, JEE, Banking' },
    { id: 'hostel_support', label: '🏠 Hostel & Accommodation Support', desc: 'Covering living and food expenses' },
    { id: 'overseas', label: '🌍 Overseas Education Support', desc: 'Full funding for master degrees in foreign universities' }
  ];

  // 2. Education Levels
  const EDUCATION_LEVELS = isHindi ? [
    { id: 'school', label: '🏫 स्कूली शिक्षा (कक्षा 1 से 8)' }, { id: 'class_10_12', label: '🎒 कक्षा 9वीं से 12वीं' }, { id: 'undergraduate', label: '🎓 स्नातक (BA, BSc, BCom, BTech, MBBS)' }, { id: 'postgraduate', label: '📜 स्नातकोत्तर (MA, MSc, MTech, MBA)' }, { id: 'professional', label: '🔬 व्यावसायिक पाठ्यक्रम (चिकित्सा, कानून, प्रबंधन)' }, { id: 'phd', label: '📖 डॉक्टरेट / PhD शोध' }, { id: 'overseas', label: '🌍 विदेश में उच्च शिक्षा' }
  ] : [
    { id: 'school', label: '🏫 School Education (Classes 1 to 8)' },
    { id: 'class_10_12', label: '🎒 Classes 9th, 10th, 11th or 12th' },
    { id: 'undergraduate', label: '🎓 Undergraduate (BA, BSc, BCom, BTech, MBBS)' },
    { id: 'postgraduate', label: '📜 Postgraduate (MA, MSc, MTech, MBA)' },
    { id: 'professional', label: '🔬 Professional Course (Medical, Law, Management)' },
    { id: 'phd', label: '📖 Doctorate / PhD Research' },
    { id: 'overseas', label: '🌍 Overseas Higher Education' }
  ];

  // 3. Course Fields
  const COURSE_FIELDS = isHindi ? [
    { id: 'engineering', label: '⚙️ इंजीनियरिंग एवं प्रौद्योगिकी' }, { id: 'medical', label: '🩺 चिकित्सा एवं स्वास्थ्य' }, { id: 'management', label: '📊 प्रबंधन एवं व्यवसाय (MBA)' }, { id: 'arts', label: '🎨 कला एवं मानविकी' }, { id: 'science', label: '🧪 शुद्ध विज्ञान एवं शोध' }, { id: 'law', label: '⚖️ कानून एवं न्यायपालिका' }, { id: 'agriculture', label: '🌾 कृषि एवं संबद्ध विज्ञान' }, { id: 'other', label: '📚 अन्य पाठ्यक्रम / सामान्य अध्ययन' }
  ] : [
    { id: 'engineering', label: '⚙️ Engineering & Technology' },
    { id: 'medical', label: '🩺 Medical & Healthcare' },
    { id: 'management', label: '📊 Management & Business (MBA)' },
    { id: 'arts', label: '🎨 Arts & Humanities' },
    { id: 'science', label: '🧪 Pure Sciences & Research' },
    { id: 'law', label: '⚖️ Law & Judiciary' },
    { id: 'agriculture', label: '🌾 Agriculture & Allied Sciences' },
    { id: 'other', label: '📚 Other Courses / General Studies' }
  ];

  // 6. Social Categories
  const CATEGORIES = isHindi ? [
    { id: 'general', label: 'सामान्य' }, { id: 'obc', label: 'अन्य पिछड़ा वर्ग (OBC)' }, { id: 'sc', label: 'अनुसूचित जाति (SC)' }, { id: 'st', label: 'अनुसूचित जनजाति (ST)' }, { id: 'ews', label: 'आर्थिक रूप से कमजोर वर्ग (EWS)' }, { id: 'minorities', label: 'अल्पसंख्यक समुदाय' }
  ] : [
    { id: 'general', label: 'General' },
    { id: 'obc', label: 'Other Backward Classes (OBC)' },
    { id: 'sc', label: 'Scheduled Caste (SC)' },
    { id: 'st', label: 'Scheduled Tribe (ST)' },
    { id: 'ews', label: 'Economically Weaker Section (EWS)' },
    { id: 'minorities', label: 'Minority Communities' }
  ];

  const handleSelectSupportType = (typeId) => {
    const updated = { ...criteria, student_type: typeId };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterStudentSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(2);
  };

  const handleSelectEduLevel = (levelId) => {
    const updated = { ...criteria, education_level: levelId };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterStudentSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(3);
  };

  const handleSelectCourseField = (fieldId) => {
    const updated = { ...criteria, course_field: fieldId };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterStudentSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(4);
  };

  const handleSelectState = (stateName) => {
    const updated = { ...criteria, state: stateName };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterStudentSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(5);
  };

  const handleSelectIncome = (val) => {
    const updated = { ...criteria, income: val };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterStudentSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(6);
  };

  const handleSelectCategory = (catId) => {
    const updated = { ...criteria, social_category: catId };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterStudentSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(7);
  };

  const handleSelectCategoryType = (genderId) => {
    const updated = { ...criteria, gender: genderId };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterStudentSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else onComplete(pool, updated);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBackToHome();
  };

  const filteredStatesList = INDIAN_STATES.filter(s => 
    s.name.toLowerCase().includes(stateSearchQuery.toLowerCase()) || 
    s.name_hi.includes(stateSearchQuery)
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
      {/* Step Header Bar */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-gov-navy font-extrabold text-base hover:underline"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('back')}</span>
          </button>

          <div className="bg-blue-100 border border-blue-300 text-gov-navy text-sm font-black px-3 py-1 rounded-full">
            {t('step')} {step} {t('of')} 7
          </div>

          <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 text-sm font-black px-3 py-1 rounded-full">
            🟢 {matchingPool.length} {t('matching_schemes')}
          </div>
        </div>

        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-gov-navy h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 7) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* STEP 1: STUDENT SUPPORT TYPE */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('s_step1_title')}
            </h2>
          </div>

          <div className="space-y-3">
            {SUPPORT_TYPES.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectSupportType(item.id)}
                className={`gov-card p-5 w-full text-left flex items-start gap-4 transition-all hover:scale-[1.01] ${
                  criteria.student_type === item.id ? 'gov-card-active' : ''
                }`}
              >
                <div className="text-3xl shrink-0">{item.label.split(' ')[0]}</div>
                <div className="space-y-1 flex-1">
                  <div className="text-xl font-extrabold text-gov-navy">
                    {item.label.substring(item.label.indexOf(' ') + 1)}
                  </div>
                  <div className="text-sm text-slate-600 font-normal">
                    {item.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: EDUCATION LEVEL */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('s_step2_title')}
            </h2>
          </div>

          <div className="space-y-2.5">
            {EDUCATION_LEVELS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectEduLevel(item.id)}
                className={`p-4 rounded-xl border-2 font-extrabold text-lg flex items-center justify-between w-full text-left min-h-[56px] ${
                  criteria.education_level === item.id
                    ? 'bg-blue-50 border-gov-navy text-gov-navy shadow'
                    : 'bg-white border-slate-200 hover:border-gov-navy text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                <Check className="w-5 h-5 opacity-40" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: COURSE / FIELD OF STUDY */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('s_step3_title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COURSE_FIELDS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectCourseField(item.id)}
                className={`p-4 rounded-xl border-2 font-extrabold text-lg flex items-center justify-between text-left min-h-[56px] ${
                  criteria.course_field === item.id
                    ? 'bg-blue-50 border-gov-navy text-gov-navy shadow'
                    : 'bg-white border-slate-200 hover:border-gov-navy text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                <Check className="w-5 h-5 opacity-40" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: STATE SELECTION */}
      {step === 4 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('s_step4_title')}
            </h2>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={isHindi ? 'राज्य खोजें...' : 'Search state...'}
              value={stateSearchQuery}
              onChange={(e) => setStateSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border-2 border-slate-300 rounded-xl font-bold text-lg focus:border-gov-navy focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {filteredStatesList.map((s) => {
              const isSelected = criteria.state === s.name;
              return (
                <button
                  key={s.name}
                  onClick={() => handleSelectState(s.name)}
                  className={`p-3.5 rounded-xl border-2 text-left flex items-center justify-between min-h-[52px] ${
                    isSelected
                      ? 'bg-blue-100 border-gov-navy text-gov-navy font-black shadow'
                      : 'bg-white border-slate-200 text-slate-900 font-bold hover:border-gov-navy'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gov-navy shrink-0" />
                    <span className="text-lg">{isHindi ? s.name_hi : s.name}</span>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-gov-navy font-bold" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 5: ANNUAL FAMILY INCOME */}
      {step === 5 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('s_step5_title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: t('less_than_1lakh'), val: 100000 },
              { label: isHindi ? '₹1–2.5 लाख' : '₹1–2.5 Lakhs', val: 250000 },
              { label: isHindi ? '₹2.5–4.5 लाख' : '₹2.5–4.5 Lakhs', val: 450000 },
              { label: isHindi ? '₹4.5–8 लाख' : '₹4.5–8 Lakhs', val: 800000 },
              { label: t('above_8lakh'), val: 1200000 }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => handleSelectIncome(item.val)}
                className={`p-4 rounded-xl border-2 font-extrabold text-lg flex items-center justify-between min-h-[56px] ${
                  Number(criteria.income) === item.val
                    ? 'bg-blue-100 border-gov-navy text-gov-navy shadow'
                    : 'bg-white border-slate-200 hover:border-gov-navy text-slate-900'
                }`}
              >
                <span>{item.label}</span>
                <Check className="w-5 h-5 opacity-40" />
              </button>
            ))}
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-slate-200 space-y-3">
            <label className="text-sm font-bold text-slate-800">
              {isHindi ? 'सटीक पारिवारिक आय दर्ज करें (₹):' : 'Enter Exact Family Income (₹):'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3 text-lg font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  placeholder={isHindi ? 'उदा. 200000' : 'e.g. 200000'}
                  value={customIncomeInput}
                  onChange={(e) => setCustomIncomeInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border-2 border-slate-300 rounded-lg text-lg font-bold focus:border-gov-navy focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  if (customIncomeInput) handleSelectIncome(Number(customIncomeInput));
                }}
                disabled={!customIncomeInput}
                className="gov-btn-primary px-6 w-full sm:w-auto"
              >
                {isHindi ? 'आगे बढ़ें' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: SOCIAL CATEGORY */}
      {step === 6 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('s_step6_title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectCategory(item.id)}
                className={`p-4 rounded-xl border-2 font-extrabold text-lg flex items-center justify-between text-left min-h-[56px] ${
                  criteria.social_category === item.id
                    ? 'bg-blue-100 border-gov-navy text-gov-navy shadow'
                    : 'bg-white border-slate-200 hover:border-gov-navy text-slate-900'
                }`}
              >
                <span>🏷️ {item.label}</span>
                <Check className="w-5 h-5 opacity-40" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 7: CATEGORY */}
      {step === 7 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('s_step7_title')}
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { id: 'male', label: isHindi ? '👨 छात्र' : '👨 Male Student' },
              { id: 'female', label: isHindi ? '👩 छात्रा' : '👩 Female Student' },
              { id: 'lgbtq', label: '🏳️‍🌈 LGBTQ+' },
              { id: 'pwd', label: isHindi ? '♿ दिव्यांग छात्र/छात्रा (PwD)' : '♿ Student with Disability (PwD)' },
              { id: 'other', label: isHindi ? '⚧ अन्य' : '⚧ Other' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectCategoryType(item.id)}
                className={`gov-card p-5 w-full text-left flex items-center justify-between transition-all hover:scale-[1.01] ${
                  criteria.gender === item.id ? 'gov-card-active' : ''
                }`}
              >
                <div className="text-2xl font-extrabold text-gov-navy flex items-center gap-3">
                  <User className="w-7 h-7 text-gov-saffron" />
                  <span>{item.label}</span>
                </div>
                <Check className="w-6 h-6 text-gov-navy opacity-40" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
