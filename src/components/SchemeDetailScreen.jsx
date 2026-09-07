import React, { useState } from 'react';
import { ArrowLeft, BadgePercent, Briefcase, Building2, CheckCircle2, ExternalLink, FileText, GraduationCap, IndianRupee, Landmark, ListOrdered, MapPin, Pause, Printer, Sprout, Users, Volume2, Wrench } from 'lucide-react';
import { readTextAloud, stopTextAloud } from '../services/audioService';
import { getBankNavigationUrl, getGeneralBankNavigationUrl, getSchemeProviders } from '../services/bankService';

const FIELD_LABELS = {
  agriculture_allied: 'कृषि एवं संबद्ध गतिविधियाँ', manufacturing: 'विनिर्माण', retail_trading: 'खुदरा एवं व्यापार', food_processing: 'खाद्य प्रसंस्करण', tech_it: 'तकनीक एवं आईटी', transport: 'परिवहन एवं लॉजिस्टिक्स', tourism: 'पर्यटन एवं आतिथ्य', handicrafts: 'हस्तशिल्प एवं कारीगरी', healthcare: 'स्वास्थ्य सेवाएँ', services: 'अन्य सेवाएँ'
};

const CATEGORY_LABELS = {
  male: 'Male / पुरुष',
  female: 'Female / महिला',
  lgbtq: 'LGBTQ+',
  pwd: 'Persons with Disabilities (PwD) / दिव्यांगजन',
  other: 'Other / अन्य'
};

function getSchemeIcon(scheme) {
  if (scheme.student_type || scheme.type === 'student') return GraduationCap;
  if (scheme.type === 'skill_employment') return Wrench;
  if (scheme.fields?.includes('agriculture_allied') || scheme.fields?.includes('food_processing')) return Sprout;
  return Briefcase;
}

function money(value) {
  if (!value) return null;
  return value >= 100000 ? `₹${(value / 100000).toFixed(value % 100000 ? 1 : 0)} लाख तक` : `₹${value.toLocaleString('en-IN')} तक`;
}

function describeEligibility(scheme, criteria, isHindi) {
  const items = [];
  if (scheme.fields?.length) items.push({ text: `${isHindi ? 'क्षेत्र:' : 'Area:'} ${scheme.fields.map((field) => FIELD_LABELS[field] || field).join(', ')}`, match: !criteria.field || scheme.fields.includes(criteria.field) || scheme.fields.includes('all') });
  if (scheme.education_levels?.length) items.push({ text: `${isHindi ? 'शिक्षा स्तर:' : 'Education level:'} ${scheme.education_levels.join(', ')}`, match: !criteria.education_level || scheme.education_levels.includes(criteria.education_level) || scheme.education_levels.includes('all') });
  if (scheme.states?.length && !scheme.states.includes('all')) items.push({ text: `${isHindi ? 'लागू राज्य:' : 'Applicable state:'} ${scheme.states.join(', ')}`, match: !criteria.state || scheme.states.includes(criteria.state) });
  if (scheme.income_limit !== null && scheme.income_limit !== undefined) items.push({ text: `${isHindi ? 'पारिवारिक आय सीमा:' : 'Family-income limit:'} ₹${scheme.income_limit.toLocaleString('en-IN')}`, match: !criteria.income || Number(criteria.income) <= scheme.income_limit });
  if (scheme.eligible_categories?.length && !scheme.eligible_categories.includes('all')) items.push({ text: `${isHindi ? 'सामाजिक श्रेणी:' : 'Social category:'} ${scheme.eligible_categories.map((value) => value.toUpperCase()).join(', ')}`, match: !criteria.social_category || scheme.eligible_categories.includes(criteria.social_category) });
  if (scheme.eligible_genders?.length && !scheme.eligible_genders.includes('all')) items.push({ text: `${isHindi ? 'श्रेणी:' : 'Category:'} ${scheme.eligible_genders.map((category) => CATEGORY_LABELS[category] || category).join(', ')}`, match: !criteria.gender || scheme.eligible_genders.includes(criteria.gender) });
  if (scheme.business_status?.length && !scheme.business_status.includes('all')) items.push({ text: `${isHindi ? 'व्यवसाय की स्थिति:' : 'Business status:'} ${scheme.business_status.join(', ')}`, match: !criteria.business_status || scheme.business_status.includes(criteria.business_status) });
  return items;
}

export default function SchemeDetailScreen({ scheme, userCriteria = {}, userLocation = {}, onBack, currentLang }) {
  const [speaking, setSpeaking] = useState(false);
  const isHindi = currentLang !== 'en';
  const Icon = getSchemeIcon(scheme);
  const title = isHindi ? (scheme.name_hi || scheme.name) : scheme.name;
  const eligibility = describeEligibility(scheme, userCriteria, isHindi);
  const providers = getSchemeProviders(scheme);
  const highlights = [
    scheme.max_financial_assistance && { icon: IndianRupee, value: money(scheme.max_financial_assistance), label: isHindi ? 'अधिकतम वित्तीय सहायता' : 'Maximum financial support' },
    scheme.subsidy_percentage && { icon: BadgePercent, value: scheme.subsidy_percentage, label: isHindi ? 'सहायता / सब्सिडी' : 'Support / subsidy' },
    scheme.scope && { icon: Landmark, value: scheme.scope === 'central' ? (isHindi ? 'अखिल भारतीय' : 'All India') : (isHindi ? 'राज्य स्तर' : 'State level'), label: isHindi ? 'योजना का स्तर' : 'Scheme level' },
    scheme.benefits_hi?.[0] && { icon: Users, value: isHindi ? 'विशेष सहायता' : 'Key support', label: scheme.benefits_hi[0] }
  ].filter(Boolean);

  const readSummary = () => {
    if (speaking) { stopTextAloud(); setSpeaking(false); return; }
    const text = `${title}। ${scheme.description_hi}। ${scheme.benefits_hi?.slice(0, 2).join('। ') || ''}`;
    if (readTextAloud(text, currentLang, () => setSpeaking(false))) setSpeaking(true);
  };

  return <div className="max-w-6xl mx-auto px-4 py-5 sm:py-7 text-slate-900 print-area">
    <div className="flex items-center justify-between gap-3 mb-5 text-xs sm:text-sm text-slate-500 font-semibold no-print">
      <button onClick={onBack} className="flex items-center gap-1.5 text-gov-navy font-extrabold hover:underline"><ArrowLeft className="w-4 h-4" />{isHindi ? 'वापस जाएँ' : 'Back'}</button>
      <div className="flex items-center gap-2">
        <button onClick={readSummary} className="border border-slate-300 px-2.5 py-1.5 text-gov-navy font-bold rounded-md flex gap-1.5 items-center">{speaking ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}{speaking ? (isHindi ? 'रोकें' : 'Stop') : (isHindi ? 'सुनें' : 'Listen')}</button>
        <button onClick={() => window.print()} className="hidden sm:flex border border-slate-300 px-2.5 py-1.5 text-gov-navy font-bold rounded-md gap-1.5 items-center"><Printer className="w-4 h-4" />{isHindi ? 'प्रिंट' : 'Print'}</button>
      </div>
    </div>

    <nav className="text-xs sm:text-sm text-slate-500 font-semibold mb-6" aria-label="Breadcrumb">
      <span>{isHindi ? 'होम' : 'Home'}</span><span className="px-2">/</span><span>{isHindi ? 'योजनाएँ' : 'Schemes'}</span><span className="px-2">/</span><span>{scheme.type === 'student' ? (isHindi ? 'शिक्षा सहायता' : 'Education support') : scheme.type === 'skill_employment' ? (isHindi ? 'कौशल व रोजगार' : 'Skills & employment') : (isHindi ? 'व्यवसाय सहायता' : 'Business support')}</span><span className="px-2">/</span><span className="text-gov-navy">{title}</span>
    </nav>

    <header className="relative border-b border-slate-200 pb-6 sm:pb-7">
      <div className="sm:absolute sm:top-0 sm:right-0 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-md inline-block mb-4 sm:mb-0">{scheme.scope === 'central' ? (isHindi ? 'केंद्र सरकार की योजना' : 'Central Government Scheme') : (isHindi ? `${scheme.states?.[0] || ''} सरकार` : 'State Government Scheme')}</div>
      <div className="flex gap-3 sm:gap-6 pr-0 sm:pr-40 items-start">
        <div className="mt-1 sm:mt-3 shrink-0 w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#f5f1ea] text-[#137848] flex items-center justify-center"><Icon className="w-8 h-8 sm:w-12 sm:h-12" /></div>
        <div className="pt-1 max-w-4xl">
          <h1 className="text-3xl sm:text-4xl font-black text-gov-navy leading-tight">{title}</h1>
          {isHindi && <p className="mt-1 text-base font-bold text-slate-500">{scheme.name}</p>}
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">{scheme.description_hi}</p>
        </div>
      </div>
    </header>

    <section className="mt-6 border-l-[6px] border-gov-saffron bg-[#fffaf2] px-5 py-4 text-lg sm:text-xl leading-relaxed font-semibold text-slate-800">
      {scheme.description_hi}
    </section>

    {highlights.length > 0 && <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 py-8 border-b border-slate-200">
      {highlights.map((item, index) => { const HighlightIcon = item.icon; return <div key={index} className="text-center px-2"><HighlightIcon className={`w-9 h-9 mx-auto mb-2 ${index === 0 ? 'text-emerald-700' : index === 1 ? 'text-amber-500' : 'text-blue-600'}`} /><div className="text-lg sm:text-xl font-black text-gov-navy leading-tight">{item.value}</div><div className="mt-1 text-sm text-slate-600 font-semibold leading-snug">{item.label}</div></div>; })}
    </section>}

    <section className="mt-7 bg-emerald-50 border border-emerald-200 rounded-lg p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-black text-emerald-800 flex items-center gap-3"><CheckCircle2 className="w-7 h-7" />{isHindi ? 'मुख्य लाभ' : 'Key benefits'}</h2>
      <ul className="mt-4 space-y-2.5 text-base sm:text-lg text-slate-800">{(scheme.benefits_hi || []).map((benefit, index) => <li key={index} className="flex gap-3"><span className="text-emerald-700 font-black">✓</span><span>{benefit}</span></li>)}</ul>
    </section>

    {eligibility.length > 0 && <section className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-black text-blue-900 flex items-center gap-3"><Users className="w-7 h-7" />{isHindi ? 'पात्रता' : 'Eligibility'}</h2>
      <ul className="mt-4 space-y-2.5 text-base sm:text-lg text-slate-800">{eligibility.map((item, index) => <li key={index} className="flex gap-3"><span className={item.match ? 'text-emerald-700 font-black' : 'text-amber-600 font-black'}>{item.match ? '✓' : '!'}</span><span>{item.text}{userCriteria.voiceMode && <small className="block text-xs text-slate-500 mt-0.5">{item.match ? (isHindi ? 'आपकी जानकारी से मेल खाती है' : 'Matches your information') : (isHindi ? 'अतिरिक्त जानकारी आवश्यक हो सकती है' : 'More information may be needed')}</small>}</span></li>)}</ul>
    </section>}

    <section className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-black text-gov-navy flex items-center gap-3"><Building2 className="w-7 h-7 text-gov-saffron" />{isHindi ? 'कहाँ से योजना मिलेगी?' : 'Where can you get this scheme?'}</h2>
      <p className="mt-3 text-base text-slate-700 font-semibold leading-relaxed">{isHindi ? `इस योजना के लिए ${providers.type_hi} में आवेदन करें।` : `Apply through ${providers.type}.`}</p>
      {providers.banks?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{providers.banks.map((bank) => <span key={bank.shortName} className="bg-white border border-slate-300 rounded-md px-3 py-2 text-sm font-bold text-slate-800">{bank.shortName}</span>)}</div>}
      <p className="mt-4 text-sm text-slate-600">{isHindi ? `आपका स्थान: ${userLocation.state || userCriteria.state || 'भारत'}। निकटतम शाखा जाने के लिए बैंक चुनें।` : `Your location: ${userLocation.state || userCriteria.state || 'India'}. Choose a bank to find the nearest branch.`}</p>
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        {providers.banks?.slice(0, 3).map((bank) => <a key={bank.shortName} href={getBankNavigationUrl(bank, userLocation)} target="_blank" rel="noopener noreferrer" className="bg-gov-navy hover:bg-[#083d71] text-white rounded-md py-3 px-4 font-extrabold flex items-center justify-center gap-2"><MapPin className="w-5 h-5" />{isHindi ? `${bank.shortName} खोजें` : `Find ${bank.shortName}`}</a>)}
        {!providers.banks?.length && <a href={getGeneralBankNavigationUrl(userLocation)} target="_blank" rel="noopener noreferrer" className="bg-gov-navy hover:bg-[#083d71] text-white rounded-md py-3 px-4 font-extrabold flex items-center justify-center gap-2"><MapPin className="w-5 h-5" />{isHindi ? 'निकटतम बैंक खोजें' : 'Find nearest bank'}</a>}
      </div>
      <p className="mt-3 text-xs text-slate-500">{isHindi ? 'शाखा में जाने से पहले पात्रता और उपलब्धता की पुष्टि करें।' : 'Confirm scheme eligibility and availability with the branch before visiting.'}</p>
    </section>

    {scheme.required_documents_hi?.length > 0 && <section className="mt-7">
      <h2 className="text-xl sm:text-2xl font-black text-gov-navy flex items-center gap-3"><FileText className="w-7 h-7 text-gov-saffron" />{isHindi ? 'आवश्यक दस्तावेज' : 'Required documents'}</h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{scheme.required_documents_hi.map((document, index) => <div key={index} className="border border-slate-200 rounded-lg bg-white p-3.5 flex gap-3 items-center text-sm sm:text-base font-semibold"><FileText className="w-6 h-6 text-gov-navy shrink-0" />{document}</div>)}</div>
    </section>}

    <section className="mt-8 bg-[#fffaf2] border border-[#fae8cc] rounded-lg p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-black text-gov-navy flex items-center gap-3"><ListOrdered className="w-7 h-7 text-gov-saffron" />{isHindi ? 'आवेदन कैसे करें?' : 'How to apply'}</h2>
      <ol className="mt-5 space-y-4">{(scheme.application_steps_hi || []).map((step, index) => <li key={index} className="flex gap-4 items-start"><span className="w-8 h-8 rounded-full bg-gov-saffron text-white shrink-0 font-black flex items-center justify-center">{index + 1}</span><span className="pt-1 text-base sm:text-lg font-medium">{step}</span></li>)}</ol>
    </section>

    <section className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
      {scheme.official_link ? <a href={scheme.official_link} target="_blank" rel="noopener noreferrer" className="bg-[#0b4f91] hover:bg-[#083d71] text-white rounded-md py-4 px-5 font-extrabold text-lg flex items-center justify-center gap-2">{isHindi ? 'आधिकारिक वेबसाइट पर जाएँ' : 'Visit official website'} <ExternalLink className="w-5 h-5" /></a> : <button disabled className="bg-slate-200 text-slate-500 rounded-md py-4 px-5 font-bold">{isHindi ? 'आधिकारिक आवेदन लिंक उपलब्ध नहीं है' : 'Official application link unavailable'}</button>}
      <button onClick={() => window.print()} className="border-2 border-slate-300 hover:border-gov-navy text-gov-navy rounded-md py-4 px-5 font-extrabold text-lg flex items-center justify-center gap-2"><FileText className="w-5 h-5" />{isHindi ? 'योजना की विस्तृत जानकारी' : 'Scheme details'}</button>
    </section>

    <footer className="mt-7 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-500 flex flex-col sm:flex-row gap-2 justify-between"><span>ℹ {isHindi ? 'यह जानकारी सत्यापित आधिकारिक सरकारी स्रोतों पर आधारित है।' : 'This information is based on verified official government sources.'}</span><span>{isHindi ? 'स्रोत: योजना का आधिकारिक पोर्टल' : 'Source: Official scheme portal'}</span></footer>
  </div>;
}
