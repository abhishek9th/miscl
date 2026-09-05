import React, { useState } from 'react';
import { ArrowLeft, Check, Search, MapPin, User } from 'lucide-react';
import { INDIAN_STATES } from '../services/locationService';
import { filterBusinessSchemes } from '../services/filterService';
import { SCHEMES } from '../data/schemes';
import { getTranslation } from '../data/translations';

export default function BusinessFlow({ 
  userState, 
  onComplete, 
  onNoSchemesFound, 
  onBackToHome,
  currentLang
}) {
  const [step, setStep] = useState(1);
  const [criteria, setCriteria] = useState({
    field: '',
    state: userState || 'Uttar Pradesh',
    income: '',
    business_status: '',
    financial_need: '',
    gender: ''
  });

  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [customIncomeInput, setCustomIncomeInput] = useState('');
  const [customNeedInput, setCustomNeedInput] = useState('');

  const t = (key) => getTranslation(currentLang, key);
  const isHindi = currentLang !== 'en';

  const { pool: matchingPool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, criteria);

  // Business Field Options
  const BUSINESS_FIELDS = isHindi ? [
    { id: 'agriculture_allied', label: '🌾 कृषि एवं संबद्ध गतिविधियाँ', desc: 'डेयरी, पोल्ट्री, मत्स्य पालन, बागवानी' },
    { id: 'manufacturing', label: '🏭 विनिर्माण', desc: 'कारखाना, उत्पाद निर्माण, प्रसंस्करण इकाई' },
    { id: 'retail_trading', label: '🛒 खुदरा एवं व्यापार', desc: 'किराना, वस्त्र दुकान, खुदरा स्टोर' },
    { id: 'food_processing', label: '🍲 खाद्य प्रसंस्करण', desc: 'अचार, पापड़, बेकरी, पैकेज्ड खाद्य' },
    { id: 'tech_it', label: '💻 तकनीक एवं आईटी', desc: 'सॉफ्टवेयर, मोबाइल मरम्मत, डिजिटल सेवाएँ' },
    { id: 'transport', label: '🚚 परिवहन एवं लॉजिस्टिक्स', desc: 'ऑटो, वाणिज्यिक वाहन, डिलीवरी सेवाएँ' },
    { id: 'tourism', label: '🏨 पर्यटन एवं आतिथ्य', desc: 'होमस्टे, रेस्टोरेंट, ट्रैवल एजेंसी' },
    { id: 'handicrafts', label: '🧵 हस्तशिल्प एवं कारीगरी', desc: 'दर्जी, बढ़ई, लोहार, बुनकर' },
    { id: 'healthcare', label: '🩺 स्वास्थ्य सेवाएँ', desc: 'क्लिनिक, फार्मेसी, जाँच प्रयोगशाला' },
    { id: 'services', label: '🛠️ अन्य सेवाएँ', desc: 'सैलून, सेवा केंद्र और अन्य कार्य' }
  ] : [
    { id: 'agriculture_allied', label: '🌾 Agriculture & Allied Activities', desc: 'Dairy, Poultry, Fisheries, Horticulture' }, { id: 'manufacturing', label: '🏭 Manufacturing', desc: 'Factory, Product Fabrication, Processing Unit' }, { id: 'retail_trading', label: '🛒 Retail & Trading', desc: 'Grocery Shop, Garments Store, Retail Store' }, { id: 'food_processing', label: '🍲 Food Processing', desc: 'Pickle, Papad, Bakery, Packaged Food, Juice' }, { id: 'tech_it', label: '💻 Technology / IT', desc: 'Software, Mobile Repair, Digital Services' }, { id: 'transport', label: '🚚 Transport & Logistics', desc: 'Auto, Commercial Vehicle, Delivery Services' }, { id: 'tourism', label: '🏨 Tourism & Hospitality', desc: 'Homestay, Restaurant, Travel Agency' }, { id: 'handicrafts', label: '🧵 Handicrafts & Artisan Work', desc: 'Tailor, Carpenter, Blacksmith, Weaver' }, { id: 'healthcare', label: '🩺 Healthcare Services', desc: 'Clinic, Pharmacy, Diagnostic Lab, Therapy' }, { id: 'services', label: '🛠️ Other Services', desc: 'Salon, Service Center, Beauty Parlor, Other' }
  ];

  // Business Status Options
  const BUSINESS_STATUS_OPTIONS = isHindi ? [
    { id: 'new', label: '💡 नया व्यवसाय शुरू करना है', desc: 'नया उद्यम शुरू करने की योजना' },
    { id: 'existing', label: '🏪 मेरा व्यवसाय पहले से है', desc: 'चल रही दुकान या उत्पादन इकाई' },
    { id: 'expansion', label: '📈 व्यवसाय का विस्तार करना है', desc: 'नई मशीनरी, शाखा या कार्यशील पूंजी' }
  ] : [
    { id: 'new', label: '💡 Want to start a new business', desc: 'Initial idea or setting up a new enterprise' },
    { id: 'existing', label: '🏪 I have an existing business', desc: 'Running an established shop or factory unit' },
    { id: 'expansion', label: '📈 Want to expand my business', desc: 'New machinery, new branch, or working capital' }
  ];

  // Gender Options
  const GENDER_OPTIONS = isHindi ? [
    { id: 'male', label: '👨 पुरुष' }, { id: 'female', label: '👩 महिला' }, { id: 'other', label: '⚧ अन्य' }
  ] : [
    { id: 'male', label: '👨 Male' },
    { id: 'female', label: '👩 Female' },
    { id: 'other', label: '⚧ Other' }
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
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-gov-navy font-extrabold text-base hover:underline"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('back')}</span>
          </button>
          
          <div className="bg-amber-100 border border-amber-300 text-gov-navy text-sm font-black px-3 py-1 rounded-full flex items-center gap-1.5">
            <span>{t('step')} {step} {t('of')} 6</span>
          </div>

          <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 text-sm font-black px-3 py-1 rounded-full">
            🟢 {matchingPool.length} {t('matching_schemes')}
          </div>
        </div>

        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div 
            className="bg-gov-saffron h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 6) * 100}%` }}
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
                <div className="text-3xl shrink-0 mt-0.5">{item.label.split(' ')[0]}</div>
                <div className="space-y-1">
                  <div className="text-lg font-extrabold text-gov-navy leading-snug">
                    {item.label.substring(item.label.indexOf(' ') + 1)}
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
                      ? 'bg-amber-50 border-gov-saffron text-gov-navy font-black shadow'
                      : 'bg-white border-slate-200 text-slate-900 font-bold hover:border-gov-navy'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gov-saffron shrink-0" />
                    <span className="text-lg">{isHindi ? s.name_hi : s.name}</span>
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
              {isHindi ? 'सटीक वार्षिक आय दर्ज करें (₹):' : 'Enter Exact Amount (₹):'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3 text-lg font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  placeholder={isHindi ? 'उदा. 250000' : 'e.g. 250000'}
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
                className="gov-btn-primary px-6"
              >
                {isHindi ? 'आगे बढ़ें' : 'Next'}
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
              { label: isHindi ? '₹1 लाख तक' : 'Up to ₹1 Lakh', val: 100000 },
              { label: isHindi ? '₹1–5 लाख' : '₹1–5 Lakhs', val: 500000 },
              { label: isHindi ? '₹5–10 लाख' : '₹5–10 Lakhs', val: 1000000 },
              { label: isHindi ? '₹10–25 लाख' : '₹10–25 Lakhs', val: 2500000 },
              { label: isHindi ? '₹25 लाख से अधिक' : 'Above ₹25 Lakhs', val: 5000000 }
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
              {isHindi ? 'आवश्यक सटीक वित्तीय सहायता दर्ज करें (₹):' : 'Enter Exact Financial Need (₹):'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3 text-lg font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  placeholder={isHindi ? 'उदा. 1000000' : 'e.g. 1000000'}
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
                className="gov-btn-primary px-6"
              >
                {isHindi ? 'आगे बढ़ें' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: GENDER SELECTION */}
      {step === 6 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">
              {t('b_step6_title')}
            </h2>
          </div>

          <div className="space-y-3">
            {GENDER_OPTIONS.map((item) => (
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
