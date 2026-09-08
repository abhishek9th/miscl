import React, { useState } from 'react';
import { ArrowLeft, Check, Search, MapPin, User } from 'lucide-react';
import { INDIAN_STATES } from '../services/locationService';
import { filterBusinessSchemes } from '../services/filterService';
import { SCHEMES } from '../data/schemes';
import { useI18n } from '../i18n';

export default function BusinessFlow({
  userState,
  onComplete,
  onNoSchemesFound,
  onBackToHome
}) {
  const { t, tr } = useI18n();
  const [step, setStep] = useState(1);
  const [criteria, setCriteria] = useState({
    field: '',
    state: userState || 'Uttar Pradesh',
    income: '',
    business_status: '',
    financial_need: '',
    social_category: '',
    gender: ''
  });

  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [customIncomeInput, setCustomIncomeInput] = useState('');
  const [customNeedInput, setCustomNeedInput] = useState('');

  const { pool: matchingPool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, criteria);

  // Business Field Options (English source + Hindi original; other languages via runtime translation)
  const BUSINESS_FIELDS = [
    { id: 'agriculture_allied', emoji: '🌾', label: tr('Agriculture & Allied Activities', 'कृषि एवं संबद्ध गतिविधियाँ'), desc: tr('Dairy, Poultry, Fisheries, Horticulture', 'डेयरी, पोल्ट्री, मत्स्य पालन, बागवानी') },
    { id: 'manufacturing', emoji: '🏭', label: tr('Manufacturing', 'विनिर्माण'), desc: tr('Factory, Product Fabrication, Processing Unit', 'कारखाना, उत्पाद निर्माण, प्रसंस्करण इकाई') },
    { id: 'retail_trading', emoji: '🛒', label: tr('Retail & Trading', 'खुदरा एवं व्यापार'), desc: tr('Grocery Shop, Garments Store, Retail Store', 'किराना, वस्त्र दुकान, खुदरा स्टोर') },
    { id: 'food_processing', emoji: '🍲', label: tr('Food Processing', 'खाद्य प्रसंस्करण'), desc: tr('Pickle, Papad, Bakery, Packaged Food, Juice', 'अचार, पापड़, बेकरी, पैकेज्ड खाद्य') },
    { id: 'tech_it', emoji: '💻', label: tr('Technology / IT', 'तकनीक एवं आईटी'), desc: tr('Software, Mobile Repair, Digital Services', 'सॉफ्टवेयर, मोबाइल मरम्मत, डिजिटल सेवाएँ') },
    { id: 'transport', emoji: '🚚', label: tr('Transport & Logistics', 'परिवहन एवं लॉजिस्टिक्स'), desc: tr('Auto, Commercial Vehicle, Delivery Services', 'ऑटो, वाणिज्यिक वाहन, डिलीवरी सेवाएँ') },
    { id: 'tourism', emoji: '🏨', label: tr('Tourism & Hospitality', 'पर्यटन एवं आतिथ्य'), desc: tr('Homestay, Restaurant, Travel Agency', 'होमस्टे, रेस्टोरेंट, ट्रैवल एजेंसी') },
    { id: 'handicrafts', emoji: '🧵', label: tr('Handicrafts & Artisan Work', 'हस्तशिल्प एवं कारीगरी'), desc: tr('Tailor, Carpenter, Blacksmith, Weaver', 'दर्जी, बढ़ई, लोहार, बुनकर') },
    { id: 'healthcare', emoji: '🩺', label: tr('Healthcare Services', 'स्वास्थ्य सेवाएँ'), desc: tr('Clinic, Pharmacy, Diagnostic Lab, Therapy', 'क्लिनिक, फार्मेसी, जाँच प्रयोगशाला') },
    { id: 'services', emoji: '🛠️', label: tr('Other Services', 'अन्य सेवाएँ'), desc: tr('Salon, Service Center, Beauty Parlor, Other', 'सैलून, सेवा केंद्र और अन्य कार्य') }
  ];

  // Business Status Options
  const BUSINESS_STATUS_OPTIONS = [
    { id: 'new', emoji: '💡', label: tr('Want to start a new business', 'नया व्यवसाय शुरू करना है'), desc: tr('Initial idea or setting up a new enterprise', 'नया उद्यम शुरू करने की योजना') },
    { id: 'existing', emoji: '🏪', label: tr('I have an existing business', 'मेरा व्यवसाय पहले से है'), desc: tr('Running an established shop or factory unit', 'चल रही दुकान या उत्पादन इकाई') },
    { id: 'expansion', emoji: '📈', label: tr('Want to expand my business', 'व्यवसाय का विस्तार करना है'), desc: tr('New machinery, new branch, or working capital', 'नई मशीनरी, शाखा या कार्यशील पूंजी') }
  ];

  // Reservation / Social Category Options
  const SOCIAL_CATEGORIES = [
    { id: 'general', label: tr('General', 'सामान्य') },
    { id: 'obc', label: tr('Other Backward Classes (OBC)', 'अन्य पिछड़ा वर्ग (OBC)') },
    { id: 'sc', label: tr('Scheduled Caste (SC)', 'अनुसूचित जाति (SC)') },
    { id: 'st', label: tr('Scheduled Tribe (ST)', 'अनुसूचित जनजाति (ST)') },
    { id: 'ews', label: tr('Economically Weaker Section (EWS)', 'आर्थिक रूप से कमजोर वर्ग (EWS)') },
    { id: 'minorities', label: tr('Minority Communities', 'अल्पसंख्यक समुदाय') }
  ];

  // Category Options
  const CATEGORY_OPTIONS = [
    { id: 'male', emoji: '👨', label: tr('Male', 'पुरुष') },
    { id: 'female', emoji: '👩', label: tr('Female', 'महिला') },
    { id: 'lgbtq', emoji: '🏳️‍🌈', label: 'LGBTQ+' },
    { id: 'pwd', emoji: '♿', label: tr('Person with Disability (PwD)', 'दिव्यांगजन (PwD)') },
    { id: 'other', emoji: '⚧', label: tr('Other', 'अन्य') }
  ];

  const handleSelectField = (fieldId) => {
    const updated = { ...criteria, field: fieldId };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(2);
  };

  const handleSelectState = (stateName) => {
    const updated = { ...criteria, state: stateName };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(3);
  };

  const handleSelectIncome = (val) => {
    const updated = { ...criteria, income: val };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(4);
  };

  const handleSelectStatus = (statusId) => {
    const updated = { ...criteria, business_status: statusId };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(5);
  };

  const handleSelectFinancialNeed = (needVal) => {
    const updated = { ...criteria, financial_need: needVal };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(6);
  };

  const handleSelectSocialCategory = (catId) => {
    const updated = { ...criteria, social_category: catId };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(7);
  };

  const handleSelectGender = (genderId) => {
    const updated = { ...criteria, gender: genderId };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, updated);
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
      {/* Top Step Progress Bar */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-gov-navy font-extrabold text-base hover:underline"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('back')}</span>
          </button>
          
          <div className="bg-amber-100 border border-amber-300 text-gov-navy text-sm font-black px-3 py-1 rounded-full flex items-center gap-1.5">
            <span>{t('step')} {step} {t('of')} 7</span>
          </div>

          <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 text-sm font-black px-3 py-1 rounded-full">
            🟢 {matchingPool.length} {t('matching_schemes')}
          </div>
        </div>

        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-gov-saffron h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 7) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* STEP 1: BUSINESS FIELD */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('b_step1_title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BUSINESS_FIELDS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectField(item.id)}
                className={`gov-card p-4 text-left flex items-start gap-3 transition-all hover:scale-[1.01] ${
                  criteria.field === item.id ? 'gov-card-active' : ''
                }`}
              >
                <div className="text-3xl shrink-0 mt-0.5">{item.emoji}</div>
                <div className="space-y-1">
                  <div className="text-lg font-extrabold text-gov-navy leading-snug">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-600 font-normal">
                    {item.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: STATE SELECTION */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('b_step2_title')}
            </h2>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={tr('Search state...', 'राज्य खोजें...')}
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
                      ? 'bg-amber-50 border-gov-saffron text-gov-navy font-black shadow'
                      : 'bg-white border-slate-200 text-slate-900 font-bold hover:border-gov-navy'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gov-saffron shrink-0" />
                    <span className="text-lg">{tr(s.name, s.name_hi)}</span>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-gov-saffron font-bold" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: ANNUAL FAMILY INCOME */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('b_step3_title')}
            </h2>
            <p className="text-sm text-slate-700 font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              {t('b_step3_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: t('less_than_1lakh'), val: 100000 },
              { label: t('between_1_3lakh'), val: 300000 },
              { label: t('between_3_5lakh'), val: 500000 },
              { label: t('between_5_8lakh'), val: 800000 },
              { label: t('above_8lakh'), val: 1500000 }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => handleSelectIncome(item.val)}
                className={`p-4 rounded-xl border-2 font-extrabold text-lg flex items-center justify-between min-h-[56px] ${
                  Number(criteria.income) === item.val
                    ? 'bg-amber-100 border-gov-saffron text-gov-navy shadow'
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
              {tr('Enter Exact Amount (₹):', 'सटीक वार्षिक आय दर्ज करें (₹):')}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3 text-lg font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  placeholder={tr('e.g. 250000', 'उदा. 250000')}
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
                {tr('Next', 'आगे बढ़ें')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: BUSINESS STATUS */}
      {step === 4 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('b_step4_title')}
            </h2>
          </div>

          <div className="space-y-3">
            {BUSINESS_STATUS_OPTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectStatus(item.id)}
                className={`gov-card p-5 w-full text-left flex items-start gap-4 transition-all hover:scale-[1.01] ${
                  criteria.business_status === item.id ? 'gov-card-active' : ''
                }`}
              >
                <div className="text-3xl shrink-0">{item.emoji}</div>
                <div className="space-y-1 flex-1">
                  <div className="text-xl font-extrabold text-gov-navy">
                    {item.label}
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

      {/* STEP 5: REQUIRED FINANCIAL ASSISTANCE */}
      {step === 5 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('b_step5_title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: tr('Up to ₹1 Lakh', '₹1 लाख तक'), val: 100000 },
              { label: tr('₹1–5 Lakhs', '₹1–5 लाख'), val: 500000 },
              { label: tr('₹5–10 Lakhs', '₹5–10 लाख'), val: 1000000 },
              { label: tr('₹10–25 Lakhs', '₹10–25 लाख'), val: 2500000 },
              { label: tr('Above ₹25 Lakhs', '₹25 लाख से अधिक'), val: 5000000 }
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => handleSelectFinancialNeed(item.val)}
                className={`p-4 rounded-xl border-2 font-extrabold text-lg flex items-center justify-between min-h-[56px] ${
                  Number(criteria.financial_need) === item.val
                    ? 'bg-amber-100 border-gov-saffron text-gov-navy shadow'
                    : 'bg-white border-slate-200 hover:border-gov-navy text-slate-900'
                }`}
              >
                <span>💰 {item.label}</span>
                <Check className="w-5 h-5 opacity-40" />
              </button>
            ))}
          </div>

          <div className="bg-white p-4 rounded-xl border-2 border-slate-200 space-y-3">
            <label className="text-sm font-bold text-slate-800">
              {tr('Enter Exact Financial Need (₹):', 'आवश्यक सटीक वित्तीय सहायता दर्ज करें (₹):')}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3 text-lg font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  placeholder={tr('e.g. 1000000', 'उदा. 1000000')}
                  value={customNeedInput}
                  onChange={(e) => setCustomNeedInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border-2 border-slate-300 rounded-lg text-lg font-bold focus:border-gov-navy focus:outline-none"
                />
              </div>
              <button
                onClick={() => {
                  if (customNeedInput) handleSelectFinancialNeed(Number(customNeedInput));
                }}
                disabled={!customNeedInput}
                className="gov-btn-primary px-6 w-full sm:w-auto"
              >
                {tr('Next', 'आगे बढ़ें')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: RESERVATION / SOCIAL CATEGORY */}
      {step === 6 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {tr('Select your reservation category', 'अपनी आरक्षण श्रेणी चुनें')}
            </h2>
            <p className="text-sm text-slate-700 font-semibold bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              {tr('Many schemes offer extra benefits or higher subsidy for SC, ST, OBC, EWS and minority applicants.', 'कई योजनाएँ अनुसूचित जाति, जनजाति, OBC, EWS और अल्पसंख्यक आवेदकों को अतिरिक्त लाभ या अधिक सब्सिडी देती हैं।')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SOCIAL_CATEGORIES.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectSocialCategory(item.id)}
                className={`p-4 rounded-xl border-2 font-extrabold text-lg flex items-center justify-between text-left min-h-[56px] ${
                  criteria.social_category === item.id
                    ? 'bg-amber-100 border-gov-saffron text-gov-navy shadow'
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

      {/* STEP 7: CATEGORY SELECTION */}
      {step === 7 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('b_step6_title')}
            </h2>
          </div>

          <div className="space-y-3">
            {CATEGORY_OPTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectGender(item.id)}
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
