import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { filterBusinessSchemes } from '../services/filterService';
import { SCHEMES } from '../data/schemes';
import { useI18n } from '../i18n';
import IncompleteProfileNotice from './IncompleteProfileNotice';
import {
  AgricultureIcon, ManufacturingIcon, RetailTradingIcon, FoodProcessingIcon, TechItIcon,
  TransportIcon, TourismIcon, HandicraftsIcon, HealthcareIcon, OtherServicesIcon,
  NewIdeaIcon, ExistingShopIcon, ExpansionGrowthIcon,
} from './icons/SketchIcons';

// Demographic details (state, income, social category, gender) are no longer
// asked here — they are read from the signed-in user's saved profile. This flow
// only collects the business-specific choices: field, business status and the
// required financial assistance.
export default function BusinessFlow({
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
    field: '',
    business_status: '',
    financial_need: '',
    // from profile / DB:
    state: userProfile?.state || userState || 'Uttar Pradesh',
    income: userProfile?.annual_income ?? '',
    social_category: userProfile?.social_category || '',
    gender: userProfile?.gender || '',
  });

  // Fields matching relies on but the profile doesn't have — flagged instead of
  // silently matching against a blank value (which can over- or under-match).
  const missingProfileFields = [
    !userProfile?.annual_income && { key: 'income', en: 'Annual family income', hi: 'वार्षिक पारिवारिक आय' },
    !userProfile?.social_category && { key: 'social_category', en: 'Social category', hi: 'सामाजिक श्रेणी' },
    !userProfile?.gender && { key: 'gender', en: 'Gender', hi: 'लिंग' },
    !userProfile?.state && !userState && { key: 'state', en: 'State', hi: 'राज्य' },
  ].filter(Boolean);

  const { pool: matchingPool } = filterBusinessSchemes(SCHEMES, criteria);

  const BUSINESS_FIELDS = [
    { id: 'agriculture_allied', Icon: AgricultureIcon, label: tr('Agriculture & Allied Activities', 'कृषि एवं संबद्ध गतिविधियाँ'), desc: tr('Dairy, Poultry, Fisheries, Horticulture', 'डेयरी, पोल्ट्री, मत्स्य पालन, बागवानी') },
    { id: 'manufacturing', Icon: ManufacturingIcon, label: tr('Manufacturing', 'विनिर्माण'), desc: tr('Factory, Product Fabrication, Processing Unit', 'कारखाना, उत्पाद निर्माण, प्रसंस्करण इकाई') },
    { id: 'retail_trading', Icon: RetailTradingIcon, label: tr('Retail & Trading', 'खुदरा एवं व्यापार'), desc: tr('Grocery Shop, Garments Store, Retail Store', 'किराना, वस्त्र दुकान, खुदरा स्टोर') },
    { id: 'food_processing', Icon: FoodProcessingIcon, label: tr('Food Processing', 'खाद्य प्रसंस्करण'), desc: tr('Pickle, Papad, Bakery, Packaged Food, Juice', 'अचार, पापड़, बेकरी, पैकेज्ड खाद्य') },
    { id: 'tech_it', Icon: TechItIcon, label: tr('Technology / IT', 'तकनीक एवं आईटी'), desc: tr('Software, Mobile Repair, Digital Services', 'सॉफ्टवेयर, मोबाइल मरम्मत, डिजिटल सेवाएँ') },
    { id: 'transport', Icon: TransportIcon, label: tr('Transport & Logistics', 'परिवहन एवं लॉजिस्टिक्स'), desc: tr('Auto, Commercial Vehicle, Delivery Services', 'ऑटो, वाणिज्यिक वाहन, डिलीवरी सेवाएँ') },
    { id: 'tourism', Icon: TourismIcon, label: tr('Tourism & Hospitality', 'पर्यटन एवं आतिथ्य'), desc: tr('Homestay, Restaurant, Travel Agency', 'होमस्टे, रेस्टोरेंट, ट्रैवल एजेंसी') },
    { id: 'handicrafts', Icon: HandicraftsIcon, label: tr('Handicrafts & Artisan Work', 'हस्तशिल्प एवं कारीगरी'), desc: tr('Tailor, Carpenter, Blacksmith, Weaver', 'दर्जी, बढ़ई, लोहार, बुनकर') },
    { id: 'healthcare', Icon: HealthcareIcon, label: tr('Healthcare Services', 'स्वास्थ्य सेवाएँ'), desc: tr('Clinic, Pharmacy, Diagnostic Lab, Therapy', 'क्लिनिक, फार्मेसी, जाँच प्रयोगशाला') },
    { id: 'services', Icon: OtherServicesIcon, label: tr('Other Services', 'अन्य सेवाएँ'), desc: tr('Salon, Service Center, Beauty Parlor, Other', 'सैलून, सेवा केंद्र और अन्य कार्य') },
  ];

  const BUSINESS_STATUS_OPTIONS = [
    { id: 'new', Icon: NewIdeaIcon, label: tr('Want to start a new business', 'नया व्यवसाय शुरू करना है'), desc: tr('Initial idea or setting up a new enterprise', 'नया उद्यम शुरू करने की योजना') },
    { id: 'existing', Icon: ExistingShopIcon, label: tr('I have an existing business', 'मेरा व्यवसाय पहले से है'), desc: tr('Running an established shop or factory unit', 'चल रही दुकान या उत्पादन इकाई') },
    { id: 'expansion', Icon: ExpansionGrowthIcon, label: tr('Want to expand my business', 'व्यवसाय का विस्तार करना है'), desc: tr('New machinery, new branch, or working capital', 'नई मशीनरी, शाखा या कार्यशील पूंजी') },
  ];

  const handleSelectField = (fieldId) => {
    const updated = { ...criteria, field: fieldId };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(2);
  };

  const handleSelectStatus = (statusId) => {
    const updated = { ...criteria, business_status: statusId };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else setStep(3);
  };

  const handleSelectFinancialNeed = (needVal) => {
    const updated = { ...criteria, financial_need: needVal };
    setCriteria(updated);
    const { pool, lastFilteredFactor } = filterBusinessSchemes(SCHEMES, updated);
    if (pool.length === 0) onNoSchemesFound(lastFilteredFactor, updated);
    else onComplete(pool, updated);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBackToHome();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
      {/* Step header — plain layout, no card wrapper */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-gov-navy font-bold text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </button>
        <span className="text-sm text-slate-500 font-semibold">
          {t('step')} {step}/{TOTAL} · {matchingPool.length} {t('matching_schemes')}
        </span>
      </div>
      <div className="w-full bg-slate-200 h-1 overflow-hidden">
        <div className="bg-gov-saffron h-full transition-all duration-300" style={{ width: `${(step / TOTAL) * 100}%` }} />
      </div>

      {missingProfileFields.length > 0 && (
        <IncompleteProfileNotice fields={missingProfileFields} onOpenProfile={onOpenProfile} />
      )}

      {/* STEP 1: BUSINESS FIELD */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">{t('b_step1_title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BUSINESS_FIELDS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectField(item.id)}
                className={`gov-card p-4 text-left flex items-start gap-3 transition-all hover:scale-[1.01] ${criteria.field === item.id ? 'gov-card-active' : ''}`}
              >
                <div className="shrink-0 mt-0.5 w-9 h-9 text-gov-navy"><item.Icon className="w-full h-full" /></div>
                <div className="space-y-1">
                  <div className="text-lg font-extrabold text-gov-navy leading-snug">{item.label}</div>
                  <div className="text-xs text-slate-600 font-normal">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: BUSINESS STATUS */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">{t('b_step4_title')}</h2>
          <div className="space-y-3">
            {BUSINESS_STATUS_OPTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectStatus(item.id)}
                className={`bg-white border-2 rounded-full px-6 py-4 w-full text-left flex items-center gap-4 transition-all hover:scale-[1.01] ${criteria.business_status === item.id ? 'bg-amber-100 border-gov-saffron' : 'border-slate-200 hover:border-gov-navy'}`}
              >
                <div className="shrink-0 w-10 h-10 text-gov-navy"><item.Icon className="w-full h-full" /></div>
                <div className="space-y-0.5 flex-1">
                  <div className="text-xl font-extrabold text-gov-navy">{item.label}</div>
                  <div className="text-sm text-slate-600 font-normal">{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: REQUIRED FINANCIAL ASSISTANCE */}
      {step === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy font-sans">{t('b_step5_title')}</h2>
          <div className="flex flex-col gap-2.5">
            {[
              { label: tr('Up to ₹1 Lakh', '₹1 लाख तक'), val: 100000 },
              { label: tr('₹1–5 Lakhs', '₹1–5 लाख'), val: 500000 },
              { label: tr('₹5–10 Lakhs', '₹5–10 लाख'), val: 1000000 },
              { label: tr('₹10–25 Lakhs', '₹10–25 लाख'), val: 2500000 },
              { label: tr('Above ₹25 Lakhs', '₹25 लाख से अधिक'), val: 5000000 },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => handleSelectFinancialNeed(item.val)}
                className={`px-5 py-3.5 rounded-full border-2 font-extrabold text-lg text-left w-full text-gov-navy ${
                  Number(criteria.financial_need) === item.val
                    ? 'bg-amber-100 border-gov-saffron'
                    : 'bg-white border-slate-200 hover:border-gov-navy'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
