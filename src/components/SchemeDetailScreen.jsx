import React, { useState, useRef } from 'react';
import { ArrowLeft, BadgePercent, Briefcase, Building2, CheckCircle2, ExternalLink, FileText, GraduationCap, IndianRupee, Landmark, ListOrdered, MapPin, Pause, Printer, Sprout, Users, Volume2, Wrench, ClipboardList, ChevronsLeft, ChevronsRight, GripHorizontal } from 'lucide-react';
import { readTextAloud, stopTextAloud } from '../services/audioService';
import { getBankNavigationUrl, getGeneralBankNavigationUrl, getBankDirectionsUrl, getSchemeProviders } from '../services/bankService';
import ApplicationJourney from './ApplicationJourney';
import ApplicationReadiness from './ApplicationReadiness';
import SchemeConflictNotice from './SchemeConflictNotice';
import { useI18n } from '../i18n';

// Field labels authored in Hindi; runtime-translated to the active language.
const FIELD_LABELS = {
  agriculture_allied: 'कृषि एवं संबद्ध गतिविधियाँ', manufacturing: 'विनिर्माण', retail_trading: 'खुदरा एवं व्यापार', food_processing: 'खाद्य प्रसंस्करण', tech_it: 'तकनीक एवं आईटी', transport: 'परिवहन एवं लॉजिस्टिक्स', tourism: 'पर्यटन एवं आतिथ्य', handicrafts: 'हस्तशिल्प एवं कारीगरी', healthcare: 'स्वास्थ्य सेवाएँ', services: 'अन्य सेवाएँ'
};

function getSchemeIcon(scheme) {
  if (scheme.student_type || scheme.type === 'student') return GraduationCap;
  if (scheme.type === 'skill_employment') return Wrench;
  if (scheme.fields?.includes('agriculture_allied') || scheme.fields?.includes('food_processing')) return Sprout;
  return Briefcase;
}

function money(value, tr) {
  if (!value) return null;
  return value >= 100000
    ? `₹${(value / 100000).toFixed(value % 100000 ? 1 : 0)} ${tr('Lakh', 'लाख')}`
    : `₹${value.toLocaleString('en-IN')}`;
}

function genderLabel(code, tr) {
  switch (code) {
    case 'male': return tr('Male', 'पुरुष');
    case 'female': return tr('Female', 'महिला');
    case 'lgbtq': return 'LGBTQ+';
    case 'pwd': return tr('Persons with Disabilities (PwD)', 'दिव्यांगजन (PwD)');
    case 'other': return tr('Other', 'अन्य');
    default: return code;
  }
}

function describeEligibility(scheme, criteria, tr, trText) {
  const items = [];
  if (scheme.fields?.length) items.push({ text: `${tr('Area:', 'क्षेत्र:')} ${scheme.fields.map((field) => trText(FIELD_LABELS[field] || field, 'hi')).join(', ')}`, match: !criteria.field || scheme.fields.includes(criteria.field) || scheme.fields.includes('all') });
  if (scheme.education_levels?.length) items.push({ text: `${tr('Education level:', 'शिक्षा स्तर:')} ${scheme.education_levels.join(', ')}`, match: !criteria.education_level || scheme.education_levels.includes(criteria.education_level) || scheme.education_levels.includes('all') });
  if (scheme.states?.length && !scheme.states.includes('all')) items.push({ text: `${tr('Applicable state:', 'लागू राज्य:')} ${scheme.states.map((s) => trText(s, 'en')).join(', ')}`, match: !criteria.state || scheme.states.includes(criteria.state) });
  if (scheme.income_limit !== null && scheme.income_limit !== undefined) items.push({ text: `${tr('Family-income limit:', 'पारिवारिक आय सीमा:')} ₹${scheme.income_limit.toLocaleString('en-IN')}`, match: !criteria.income || Number(criteria.income) <= scheme.income_limit });
  if (scheme.eligible_categories?.length && !scheme.eligible_categories.includes('all')) items.push({ text: `${tr('Social category:', 'सामाजिक श्रेणी:')} ${scheme.eligible_categories.map((value) => value.toUpperCase()).join(', ')}`, match: !criteria.social_category || scheme.eligible_categories.includes(criteria.social_category) });
  if (scheme.eligible_genders?.length && !scheme.eligible_genders.includes('all')) items.push({ text: `${tr('Category:', 'श्रेणी:')} ${scheme.eligible_genders.map((category) => genderLabel(category, tr)).join(', ')}`, match: !criteria.gender || scheme.eligible_genders.includes(criteria.gender) });
  if (scheme.business_status?.length && !scheme.business_status.includes('all')) items.push({ text: `${tr('Business status:', 'व्यवसाय की स्थिति:')} ${scheme.business_status.join(', ')}`, match: !criteria.business_status || scheme.business_status.includes(criteria.business_status) });
  return items;
}

// Draggable swipe control: drag the knob LEFT to open the official website,
// RIGHT to start the guided SchemeSetu auto-fill. Works with touch and mouse
// via pointer events. Snaps back to centre if released before the threshold.
function SwipeToAct({ tr, canLeft, onLeft, onRight, leftLabel, rightLabel }) {
  const trackRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, max: 120 });
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onDown = (e) => {
    const w = trackRef.current?.getBoundingClientRect().width || 300;
    drag.current = { active: true, startX: e.clientX, max: Math.max(70, w / 2 - 40) };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag.current.active) return;
    const { startX, max } = drag.current;
    setDx(Math.max(-max, Math.min(max, e.clientX - startX)));
  };
  const onUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    const threshold = drag.current.max * 0.6;
    setDx((cur) => {
      if (cur <= -threshold && canLeft) onLeft();
      else if (cur >= threshold) onRight();
      return 0;
    });
  };

  return (
    <div>
      <div
        ref={trackRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="relative h-16 rounded-full border-2 border-slate-200 bg-gradient-to-r from-blue-50 via-slate-50 to-amber-50 overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
      >
        <div className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none font-extrabold text-sm sm:text-base">
          <span className={`flex items-center gap-1.5 ${canLeft ? 'text-[#0b4f91]' : 'text-slate-300'}`}><ChevronsLeft className="w-5 h-5" /><ExternalLink className="w-4 h-4" />{leftLabel}</span>
          <span className="flex items-center gap-1.5 text-orange-700">{rightLabel}<ChevronsRight className="w-5 h-5" /></span>
        </div>
        <div
          className={`absolute top-1/2 left-1/2 -mt-6 -ml-6 w-12 h-12 rounded-full bg-gov-navy text-white flex items-center justify-center shadow-lg ${dragging ? '' : 'transition-transform duration-200'}`}
          style={{ transform: `translateX(${dx}px)` }}
        >
          <GripHorizontal className="w-6 h-6" />
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">{tr('← Slide to the official website  •  Slide to auto-fill with SchemeSetu →', '← आधिकारिक वेबसाइट के लिए बाएँ  •  SchemeSetu से स्वतः भरने के लिए दाएँ →')}</p>
    </div>
  );
}

export default function SchemeDetailScreen({ scheme, userCriteria = {}, userLocation = {}, onBack, onRegisterScheme }) {
  const { tr, trText, trList, lang: currentLang } = useI18n();
  const [speaking, setSpeaking] = useState(false);
  const [regState, setRegState] = useState('idle'); // idle | saving | done | error
  const [showJourney, setShowJourney] = useState(false);

  // Open Google Maps directions to the nearest branch of the clicked bank.
  // Opened synchronously inside the click so it is not blocked as a popup; if we
  // already know the user's coordinates they become the route origin, otherwise
  // Google Maps uses the device's current location as the starting point.
  const openBankDirections = (bank) => {
    window.open(getBankDirectionsUrl(bank, userLocation), '_blank', 'noopener,noreferrer');
  };

  const handleRegister = async () => {
    if (!onRegisterScheme || regState === 'saving' || regState === 'done') return;
    setRegState('saving');
    try {
      await onRegisterScheme(scheme);
      setRegState('done');
    } catch {
      setRegState('error');
    }
  };
  const isHindi = currentLang !== 'en';
  const Icon = getSchemeIcon(scheme);
  const title = tr(scheme.name, scheme.name_hi || scheme.name);
  const eligibility = describeEligibility(scheme, userCriteria, tr, trText);
  const providers = getSchemeProviders(scheme);
  const description = trText(scheme.description_hi, 'hi');
  const benefits = trList(scheme.benefits_hi || [], 'hi');
  const documents = trList(scheme.required_documents_hi || [], 'hi');
  const steps = trList(scheme.application_steps_hi || [], 'hi');

  const highlights = [
    scheme.max_financial_assistance && { icon: IndianRupee, value: money(scheme.max_financial_assistance, tr), label: tr('Maximum financial support', 'अधिकतम वित्तीय सहायता') },
    scheme.subsidy_percentage && { icon: BadgePercent, value: trText(scheme.subsidy_percentage, 'hi'), label: tr('Support / subsidy', 'सहायता / सब्सिडी') },
    scheme.scope && { icon: Landmark, value: scheme.scope === 'central' ? tr('All India', 'अखिल भारतीय') : tr('State level', 'राज्य स्तर'), label: tr('Scheme level', 'योजना का स्तर') },
    scheme.benefits_hi?.[0] && { icon: Users, value: tr('Key support', 'विशेष सहायता'), label: benefits[0] }
  ].filter(Boolean);

  const readSummary = () => {
    if (speaking) { stopTextAloud(); setSpeaking(false); return; }
    const text = `${title}। ${scheme.description_hi}। ${scheme.benefits_hi?.slice(0, 2).join('। ') || ''}`;
    if (readTextAloud(text, currentLang, () => setSpeaking(false))) setSpeaking(true);
  };

  return <div className="max-w-6xl mx-auto px-4 py-5 sm:py-7 text-slate-900 print-area">
    <div className="flex items-center justify-between gap-3 mb-5 text-xs sm:text-sm text-slate-500 font-semibold no-print">
      <button onClick={onBack} className="flex items-center gap-1.5 text-gov-navy font-extrabold hover:underline"><ArrowLeft className="w-4 h-4" />{tr('Back', 'वापस जाएँ')}</button>
      <div className="flex items-center gap-2">
        <button onClick={readSummary} className="border border-slate-300 px-2.5 py-1.5 text-gov-navy font-bold rounded-md flex gap-1.5 items-center">{speaking ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}{speaking ? tr('Stop', 'रोकें') : tr('Listen', 'सुनें')}</button>
        <button onClick={() => window.print()} className="hidden sm:flex border border-slate-300 px-2.5 py-1.5 text-gov-navy font-bold rounded-md gap-1.5 items-center"><Printer className="w-4 h-4" />{tr('Print', 'प्रिंट')}</button>
      </div>
    </div>

    <nav className="text-xs sm:text-sm text-slate-500 font-semibold mb-6" aria-label="Breadcrumb">
      <span>{tr('Home', 'होम')}</span><span className="px-2">/</span><span>{tr('Schemes', 'योजनाएँ')}</span><span className="px-2">/</span><span>{scheme.type === 'student' ? tr('Education support', 'शिक्षा सहायता') : scheme.type === 'skill_employment' ? tr('Skills & employment', 'कौशल व रोजगार') : tr('Business support', 'व्यवसाय सहायता')}</span><span className="px-2">/</span><span className="text-gov-navy">{title}</span>
    </nav>

    <header className="relative border-b border-slate-200 pb-6 sm:pb-7">
      <div className="sm:absolute sm:top-0 sm:right-0 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-md inline-block mb-4 sm:mb-0">{scheme.scope === 'central' ? tr('Central Government Scheme', 'केंद्र सरकार की योजना') : tr('State Government Scheme', `${scheme.states?.[0] || ''} सरकार`)}</div>
      <div className="flex gap-3 sm:gap-6 pr-0 sm:pr-40 items-start">
        <div className="mt-1 sm:mt-3 shrink-0 w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#f5f1ea] text-[#137848] flex items-center justify-center"><Icon className="w-8 h-8 sm:w-12 sm:h-12" /></div>
        <div className="pt-1 max-w-4xl">
          <h1 className="text-3xl sm:text-4xl font-black text-gov-navy leading-tight">{title}</h1>
          {currentLang !== 'en' && <p className="mt-1 text-base font-bold text-slate-500">{scheme.name}</p>}
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </header>

    <section className="mt-6 border-l-[6px] border-gov-saffron bg-[#fffaf2] px-5 py-4 text-lg sm:text-xl leading-relaxed font-semibold text-slate-800">
      {description}
    </section>

    {highlights.length > 0 && <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 py-8 border-b border-slate-200">
      {highlights.map((item, index) => { const HighlightIcon = item.icon; return <div key={index} className="text-center px-2"><HighlightIcon className={`w-9 h-9 mx-auto mb-2 ${index === 0 ? 'text-emerald-700' : index === 1 ? 'text-amber-500' : 'text-blue-600'}`} /><div className="text-lg sm:text-xl font-black text-gov-navy leading-tight">{item.value}</div><div className="mt-1 text-sm text-slate-600 font-semibold leading-snug">{item.label}</div></div>; })}
    </section>}

    <section className="mt-7 bg-emerald-50 border border-emerald-200 rounded-lg p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-black text-emerald-800 flex items-center gap-3"><CheckCircle2 className="w-7 h-7" />{tr('Key benefits', 'मुख्य लाभ')}</h2>
      <ul className="mt-4 space-y-2.5 text-base sm:text-lg text-slate-800">{benefits.map((benefit, index) => <li key={index} className="flex gap-3"><span className="text-emerald-700 font-black">✓</span><span>{benefit}</span></li>)}</ul>
    </section>

    {eligibility.length > 0 && <section className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-black text-blue-900 flex items-center gap-3"><Users className="w-7 h-7" />{tr('Eligibility', 'पात्रता')}</h2>
      <ul className="mt-4 space-y-2.5 text-base sm:text-lg text-slate-800">{eligibility.map((item, index) => <li key={index} className="flex gap-3"><span className={item.match ? 'text-emerald-700 font-black' : 'text-amber-600 font-black'}>{item.match ? '✓' : '!'}</span><span>{item.text}{userCriteria.voiceMode && <small className="block text-xs text-slate-500 mt-0.5">{item.match ? tr('Matches your information', 'आपकी जानकारी से मेल खाती है') : tr('More information may be needed', 'अतिरिक्त जानकारी आवश्यक हो सकती है')}</small>}</span></li>)}</ul>
    </section>}

    <section className="mt-6 bg-slate-50 border border-slate-200 rounded-lg p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-black text-gov-navy flex items-center gap-3"><Building2 className="w-7 h-7 text-gov-saffron" />{tr('Where can you get this scheme?', 'कहाँ से योजना मिलेगी?')}</h2>
      <p className="mt-3 text-base text-slate-700 font-semibold leading-relaxed">{tr(`Apply through ${providers.type}.`, `इस योजना के लिए ${providers.type_hi} में आवेदन करें।`)}</p>
      {providers.banks?.length > 0 && <>
        <p className="mt-3 text-sm text-gov-navy font-semibold flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gov-saffron" />{tr('Tap a bank to get directions to your nearest branch.', 'निकटतम शाखा तक दिशा-निर्देश पाने के लिए किसी बैंक पर टैप करें।')}</p>
        <div className="mt-3 flex flex-wrap gap-3">{providers.banks.map((bank) => (
        <button
          key={bank.shortName}
          type="button"
          onClick={() => openBankDirections(bank)}
          title={tr(`Directions to the nearest ${bank.name}`, `निकटतम ${bank.name} तक दिशा-निर्देश`)}
          aria-label={tr(`Directions to the nearest ${bank.name}`, `निकटतम ${bank.name} तक दिशा-निर्देश`)}
          className="bg-white border border-slate-300 rounded-md px-3 py-2 h-14 flex items-center justify-center min-w-[90px] transition-all hover:border-gov-navy hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gov-saffron cursor-pointer">
          {bank.logo
            ? <img src={bank.logo} alt={bank.name} className="h-8 max-w-[110px] object-contain pointer-events-none" onError={(e) => { e.currentTarget.replaceWith(Object.assign(document.createElement('span'), { textContent: bank.shortName, className: 'text-sm font-bold text-slate-800' })); }} />
            : <span className="text-sm font-bold text-slate-800">{bank.shortName}</span>}
        </button>
      ))}</div></>}
      <p className="mt-3 text-xs text-slate-500">{tr('Confirm scheme eligibility and availability with the branch before visiting.', 'शाखा में जाने से पहले पात्रता और उपलब्धता की पुष्टि करें।')}</p>
    </section>

    {documents.length > 0 && <section className="mt-7">
      <h2 className="text-xl sm:text-2xl font-black text-gov-navy flex items-center gap-3"><FileText className="w-7 h-7 text-gov-saffron" />{tr('Required documents', 'आवश्यक दस्तावेज')}</h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{documents.map((document, index) => <div key={index} className="border border-slate-200 rounded-lg bg-white p-3.5 flex gap-3 items-center text-sm sm:text-base font-semibold"><FileText className="w-6 h-6 text-gov-navy shrink-0" />{document}</div>)}</div>
    </section>}

    <section className="mt-8 bg-[#fffaf2] border border-[#fae8cc] rounded-lg p-5 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-black text-gov-navy flex items-center gap-3"><ListOrdered className="w-7 h-7 text-gov-saffron" />{tr('How to apply', 'आवेदन कैसे करें?')}</h2>
      <ol className="mt-5 space-y-4">{steps.map((step, index) => <li key={index} className="flex gap-4 items-start"><span className="w-8 h-8 rounded-full bg-gov-saffron text-white shrink-0 font-black flex items-center justify-center">{index + 1}</span><span className="pt-1 text-base sm:text-lg font-medium">{step}</span></li>)}</ol>
    </section>

    <section className="mt-7 bg-white border-2 border-slate-200 rounded-lg p-5 no-print">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-11 h-11 rounded-full bg-slate-100 text-gov-navy flex items-center justify-center"><ClipboardList className="w-6 h-6" /></div>
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-black text-gov-navy">{tr('Application Readiness & Document Checker', 'आवेदन तैयारी एवं दस्तावेज़ जाँच')}</h2>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{tr('SchemeSetu compares your saved profile against this scheme’s verified requirements and tells you exactly what’s ready, what’s missing, and what could delay your application — before you visit the portal or a Jan Seva Kendra.', 'SchemeSetu आपकी सहेजी गई प्रोफ़ाइल की तुलना इस योजना की सत्यापित आवश्यकताओं से करता है और बताता है कि क्या तैयार है, क्या छूट रहा है, और आपके आवेदन में देरी क्या कर सकती है।')}</p>
          <SchemeConflictNotice schemeId={scheme.id} />
          <div className="mt-4 border-t border-slate-200 pt-4">
            <ApplicationReadiness scheme={scheme} />
          </div>
        </div>
      </div>
    </section>

    <section className="mt-5 bg-[#f5f8ff] border border-blue-200 rounded-lg p-5 no-print">
      <button onClick={() => setShowJourney(true)} className="flex items-start gap-3 w-full text-left group">
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl font-black text-gov-navy group-hover:underline">{tr('Apply with SchemeSetu (guided)', 'SchemeSetu के साथ आवेदन करें (निर्देशित)')}</h2>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">{tr('SchemeSetu auto-fills what it already knows, asks only for what is missing, and pauses for OTP and your approval. You stay in control of every security step.', 'SchemeSetu वह जानकारी अपने आप भरता है जो उसे पहले से पता है, केवल छूटी हुई जानकारी पूछता है, और ओटीपी व आपकी स्वीकृति के लिए रुकता है। हर सुरक्षा चरण आपके नियंत्रण में रहता है।')}</p>
          <p className="mt-2 text-[11px] text-slate-500">{tr('Runs on a demonstration portal. For a real submission, use the official website below.', 'यह प्रदर्शन पोर्टल पर चलता है। वास्तविक आवेदन के लिए नीचे दी गई आधिकारिक वेबसाइट का उपयोग करें।')}</p>
        </div>
      </button>
    </section>

    {showJourney && <ApplicationJourney scheme={scheme} onClose={() => setShowJourney(false)} />}

    <section className="mt-4 no-print">
      <SwipeToAct
        tr={tr}
        canLeft={!!scheme.official_link}
        onLeft={() => { if (scheme.official_link) window.open(scheme.official_link, '_blank', 'noopener,noreferrer'); }}
        onRight={() => setShowJourney(true)}
        leftLabel={tr('Website', 'वेबसाइट')}
        rightLabel={tr('Auto-fill', 'स्वतः भरें')}
      />
      <div className="mt-3 flex items-center justify-center gap-4 text-sm">
        {onRegisterScheme && (
          <button onClick={handleRegister} disabled={regState === 'saving' || regState === 'done'}
            className={`font-bold inline-flex items-center gap-1.5 ${regState === 'done' ? 'text-emerald-700' : 'text-gov-saffron hover:underline'} disabled:opacity-70`}>
            <CheckCircle2 className="w-4 h-4" />
            {regState === 'done' ? tr('Registered ✓', 'पंजीकृत ✓') : regState === 'saving' ? tr('Saving…', 'सहेजा जा रहा है…') : tr('Register for this scheme', 'इस योजना के लिए पंजीकरण करें')}
          </button>
        )}
        <button onClick={() => window.print()} className="text-gov-navy font-bold inline-flex items-center gap-1.5 hover:underline"><FileText className="w-4 h-4" />{tr('Print details', 'विवरण प्रिंट करें')}</button>
      </div>
    </section>
    {regState === 'error' && <p className="mt-2 text-sm text-red-600 no-print">{tr('Could not save. Please try again.', 'सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।')}</p>}

    <footer className="mt-7 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-500 flex flex-col sm:flex-row gap-2 justify-between"><span>ℹ {tr('This information is based on verified official government sources.', 'यह जानकारी सत्यापित आधिकारिक सरकारी स्रोतों पर आधारित है।')}</span><span>{tr('Source: Official scheme portal', 'स्रोत: योजना का आधिकारिक पोर्टल')}</span></footer>
  </div>;
}
