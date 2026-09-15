import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { filterStudentSchemes } from '../services/filterService';
import { SCHEMES } from '../data/schemes';
import { useI18n } from '../i18n';
import IncompleteProfileNotice from './IncompleteProfileNotice';
import { ScholarshipCapIcon, EducationLoanIcon, CoachingBooksIcon, HostelHomeIcon, OverseasGlobeIcon } from './icons/SketchIcons';

// Demographic details (state, income, social category, gender) are no longer
// asked here — they are read from the signed-in user's saved profile. This flow
// only collects the student-specific choices: support type, education level,
// and field of study.
export default function StudentFlow({
  userState,
  userProfile,
  onComplete,
  onNoSchemesFound,
  onBackToHome,
  onOpenProfile,
}) {
  const { t, tr } = useI18n();
  const [step, setStep] = useState(1);
  const TOTAL = 3;

  // Seed the profile-derived criteria once from the database-backed profile.
  const [criteria, setCriteria] = useState({
    student_type: '',
    education_level: '',
    course_field: '',
    // from profile / DB:
    state: userProfile?.state || userState || 'Uttar Pradesh',
    income: userProfile?.annual_income ?? '',
    social_category: userProfile?.social_category || '',
    gender: userProfile?.gender || '',
  });

  const { pool: matchingPool } = filterStudentSchemes(SCHEMES, criteria);

  // Fields matching relies on but the profile doesn't have — flagged instead of
  // silently matching against a blank value (which can over- or under-match).
  const missingProfileFields = [
    !userProfile?.annual_income && { key: 'income', en: 'Annual family income', hi: 'वार्षिक पारिवारिक आय' },
    !userProfile?.social_category && { key: 'social_category', en: 'Social category', hi: 'सामाजिक श्रेणी' },
    !userProfile?.gender && { key: 'gender', en: 'Gender', hi: 'लिंग' },
    !userProfile?.state && !userState && { key: 'state', en: 'State', hi: 'राज्य' },
  ].filter(Boolean);

  const SUPPORT_TYPES = [
    { id: 'scholarship', Icon: ScholarshipCapIcon, label: tr('Scholarship', 'छात्रवृत्ति'), desc: tr('Tuition fee reimbursement and annual study grant', 'ट्यूशन शुल्क प्रतिपूर्ति और वार्षिक अध्ययन अनुदान') },
    { id: 'education_loan', Icon: EducationLoanIcon, label: tr('Education Loan', 'शिक्षा ऋण'), desc: tr('Subsidized bank loans for college fees & hostel', 'कॉलेज शुल्क और छात्रावास के लिए रियायती बैंक ऋण') },
    { id: 'coaching_support', Icon: CoachingBooksIcon, label: tr('Free Coaching Support', 'निःशुल्क कोचिंग सहायता'), desc: tr('Free coaching for UPSC, NEET, JEE, Banking', 'UPSC, NEET, JEE और बैंकिंग के लिए कोचिंग') },
    { id: 'hostel_support', Icon: HostelHomeIcon, label: tr('Hostel & Accommodation Support', 'छात्रावास एवं आवास सहायता'), desc: tr('Covering living and food expenses', 'रहने और भोजन के खर्च में सहायता') },
    { id: 'overseas', Icon: OverseasGlobeIcon, label: tr('Overseas Education Support', 'विदेश में शिक्षा सहायता'), desc: tr('Full funding for master degrees in foreign universities', 'विदेशी विश्वविद्यालयों में उच्च शिक्षा के लिए सहायता') },
  ];

  const EDUCATION_LEVELS = [
    { id: 'school', label: '🏫 ' + tr('School Education (Classes 1 to 8)', 'स्कूली शिक्षा (कक्षा 1 से 8)') },
    { id: 'class_10_12', label: '🎒 ' + tr('Classes 9th, 10th, 11th or 12th', 'कक्षा 9वीं से 12वीं') },
    { id: 'undergraduate', label: '🎓 ' + tr('Undergraduate (BA, BSc, BCom, BTech, MBBS)', 'स्नातक (BA, BSc, BCom, BTech, MBBS)') },
    { id: 'postgraduate', label: '📜 ' + tr('Postgraduate (MA, MSc, MTech, MBA)', 'स्नातकोत्तर (MA, MSc, MTech, MBA)') },
    { id: 'professional', label: '🔬 ' + tr('Professional Course (Medical, Law, Management)', 'व्यावसायिक पाठ्यक्रम (चिकित्सा, कानून, प्रबंधन)') },
    { id: 'phd', label: '📖 ' + tr('Doctorate / PhD Research', 'डॉक्टरेट / PhD शोध') },
    { id: 'overseas', label: '🌍 ' + tr('Overseas Higher Education', 'विदेश में उच्च शिक्षा') },
  ];

  const COURSE_FIELDS = [
    { id: 'engineering', label: '⚙️ ' + tr('Engineering & Technology', 'इंजीनियरिंग एवं प्रौद्योगिकी') },
    { id: 'medical', label: '🩺 ' + tr('Medical & Healthcare', 'चिकित्सा एवं स्वास्थ्य') },
    { id: 'management', label: '📊 ' + tr('Management & Business (MBA)', 'प्रबंधन एवं व्यवसाय (MBA)') },
    { id: 'arts', label: '🎨 ' + tr('Arts & Humanities', 'कला एवं मानविकी') },
    { id: 'science', label: '🧪 ' + tr('Pure Sciences & Research', 'शुद्ध विज्ञान एवं शोध') },
    { id: 'law', label: '⚖️ ' + tr('Law & Judiciary', 'कानून एवं न्यायपालिका') },
    { id: 'agriculture', label: '🌾 ' + tr('Agriculture & Allied Sciences', 'कृषि एवं संबद्ध विज्ञान') },
    { id: 'other', label: '📚 ' + tr('Other Courses / General Studies', 'अन्य पाठ्यक्रम / सामान्य अध्ययन') },
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
    else onComplete(pool, updated);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBackToHome();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
      {/* Step Header Bar */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-gov-navy font-extrabold text-base hover:underline">
            <ArrowLeft className="w-5 h-5" />
            <span>{t('back')}</span>
          </button>

          <div className="bg-blue-100 border border-blue-300 text-gov-navy text-sm font-black px-3 py-1 rounded-full">
            {t('step')} {step} {t('of')} {TOTAL}
          </div>

          <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 text-sm font-black px-3 py-1 rounded-full">
            🟢 {matchingPool.length} {t('matching_schemes')}
          </div>
        </div>

        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div className="bg-gov-navy h-full transition-all duration-300 rounded-full" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>
      </div>

      {missingProfileFields.length > 0 && (
        <IncompleteProfileNotice fields={missingProfileFields} onOpenProfile={onOpenProfile} />
      )}

      {/* STEP 1: STUDENT SUPPORT TYPE */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">{t('s_step1_title')}</h2>
          <div className="space-y-3">
            {SUPPORT_TYPES.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectSupportType(item.id)}
                className={`gov-card p-5 w-full text-left flex items-start gap-4 transition-all hover:scale-[1.01] ${criteria.student_type === item.id ? 'gov-card-active' : ''}`}
              >
                <div className="shrink-0 w-10 h-10 text-gov-navy"><item.Icon className="w-full h-full" /></div>
                <div className="space-y-1 flex-1">
                  <div className="text-xl font-extrabold text-gov-navy">{item.label}</div>
                  <div className="text-sm text-slate-600 font-normal">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: EDUCATION LEVEL */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">{t('s_step2_title')}</h2>
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">{t('s_step3_title')}</h2>
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
    </div>
  );
}
