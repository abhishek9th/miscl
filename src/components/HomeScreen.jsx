import React, { useState } from 'react';
import { ArrowRight, Bell, ExternalLink, FileText, Headphones, ShieldCheck, Store, GraduationCap, Settings, Users, Banknote, BarChart3, Info, Star, ChevronRight, ChevronsRight, Sprout, Landmark, Briefcase } from 'lucide-react';
import { useI18n } from '../i18n';
import EligibilityDashboard from './EligibilityDashboard';

const GOVERNMENT_NOTICES = [
  {
    date: 'छात्रवृत्ति अपडेट',
    title: 'प्री-मैट्रिक और पोस्ट-मैट्रिक छात्रवृत्ति योजनाओं के लाभार्थी एवं सहायता राशि की जानकारी',
    url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2085973',
  },
  {
    date: 'PM-AJAY सहायता',
    title: 'पीएम-अजय के अंतर्गत आदर्श ग्राम और सामुदायिक विकास परियोजनाओं से जुड़ी सहायता देखें',
    url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2085973',
  },
  {
    date: 'PM-SURAJ योजना',
    title: 'आर्थिक सशक्तिकरण और रियायती ऋण से संबंधित PM-SURAJ पोर्टल की योजना जानकारी',
    url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2085973',
  },
  {
    date: 'PM-DAKSH प्रशिक्षण',
    title: 'निःशुल्क कौशल प्रशिक्षण और रोजगारोन्मुख अवसरों के लिए PM-DAKSH योजना अपडेट',
    url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2085973',
  },
];

export default function HomeScreen({
  userState,
  onSelectFlow,
  onBrowseAllSchemes,
  session,
  onOpenScheme,
  onOpenProfile,
  onOpenEligibility,
}) {
  const { t, tr, trText, lang } = useI18n();

  // EMI Calculator State — pre-filled with sensible defaults so an estimate
  // shows immediately, matching common government-loan calculators.
  const [loanAmount, setLoanAmount] = useState('1000000');
  const [loanTenure, setLoanTenure] = useState('5');
  const [interestRate, setInterestRate] = useState('8.5');

  // Calculate EMI
  const calculateEMI = () => {
    if (!loanAmount || !loanTenure || !interestRate) return null;
    
    const principal = parseFloat(loanAmount);
    const months = parseFloat(loanTenure) * 12;
    const monthlyRate = parseFloat(interestRate) / 12 / 100;
    
    if (monthlyRate === 0) {
      const emi = principal / months;
      return {
        emi: emi.toFixed(0),
        totalAmount: principal.toFixed(0),
        totalInterest: '0'
      };
    }
    
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalAmount = emi * months;
    const totalInterest = totalAmount - principal;
    
    return {
      emi: emi.toFixed(0),
      totalAmount: totalAmount.toFixed(0),
      totalInterest: totalInterest.toFixed(0)
    };
  };

  const emiResult = calculateEMI();

  return (
    <div className="w-full font-sans space-y-6">

      {/* HERO & LATEST GOVERNMENT NOTICES */}
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 pt-2 sm:pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(320px,1.1fr)] gap-3 items-stretch">
      {/* HERO BANNER SECTION */}
      <div className="relative w-full overflow-hidden min-h-[340px] sm:min-h-[360px] flex items-center bg-[#FFFBEB] rounded-lg">
        
        {/* Image starting 40% from left border, occupying right 60% of viewport */}
        <img
          src="/rural_farmer_couple.png"
          alt="Happy Indian Farmer Couple"
          className="absolute top-0 bottom-0 right-0 left-0 md:left-[40%] w-full md:w-[60%] h-full object-cover object-right sm:object-center opacity-25 md:opacity-100"
        />

        {/* Smooth Blend Transition Overlay between 40% margin and image */}
        <div className="absolute inset-y-0 left-0 md:left-[40%] w-full md:w-[25%] bg-gradient-to-r from-[#FFFBEB] via-[#FFFBEB]/90 to-transparent z-10 pointer-events-none"></div>

        {/* Left Side Content Layer (Positioned over solid 40% beige background) */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="max-w-xl space-y-5">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0b2341] font-sans leading-tight tracking-tight">
                {tr('Government Schemes,', 'सरकारी योजनाएँ,')} <br />
                <span className="text-[#15803D]">{tr('For Your Development', 'आपके विकास के लिए')}</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed">
                {tr('Information on government schemes for business, education, skills and employment is now in your hands — simple, fast, and in your language.', 'व्यवसाय, शिक्षा, कौशल और रोजगार से जुड़ी सरकारी योजनाओं की जानकारी अब आपके हाथों में – सरल, तेज और आपकी भाषा में।')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <button
                onClick={() => onSelectFlow('business')}
                className="inline-flex items-center gap-2 bg-[#075C9C] hover:bg-[#064A7D] text-white font-extrabold px-5 py-3 rounded-md shadow transition-colors"
              >
                {tr('Find Suitable Schemes', 'अपनी उपयुक्त योजनाएँ खोजें')}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onBrowseAllSchemes}
                className="inline-flex items-center gap-2 text-[#0B3D71] hover:text-[#075C9C] font-extrabold underline underline-offset-4"
              >
                {tr('Browse all government schemes', 'सभी सरकारी योजनाएँ देखें')}
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>


      </div>

      {/* Notice panel: desktop right rail, mobile below the hero */}
      <aside className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col min-h-[340px] sm:min-h-[360px]">
        <div className="bg-gradient-to-r from-[#0B3D71] to-[#145B92] text-white px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-black text-xl">
            <Bell className="w-5 h-5" />
            <h2>{tr('Scheme & Subsidy Updates', 'योजना व सब्सिडी अपडेट')}</h2>
          </div>
          <a
            href="https://www.pib.gov.in/AllRel.aspx?reg=3&lang=1"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold whitespace-nowrap hover:text-amber-200 transition-colors flex items-center gap-1"
          >
            {tr('View all', 'सभी देखें')} <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="divide-y divide-slate-200 px-5 flex-1">
          {GOVERNMENT_NOTICES.map((notice) => (
            <a
              key={notice.title}
              href={notice.url}
              target="_blank"
              rel="noreferrer"
              className="block py-4 first:pt-4 hover:bg-slate-50 -mx-2 px-2 transition-colors group"
            >
              <div className="text-xs font-bold text-slate-500 mb-1.5">{trText(notice.date, 'hi')}</div>
              <div className="text-sm leading-snug font-semibold text-slate-700 group-hover:text-[#0B3D71] flex gap-1.5">
                <span>{trText(notice.title, 'hi')}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
        <div className="border-t border-slate-200 px-5 py-2.5 text-[11px] text-slate-500 font-medium">
          {tr('Source: Press Information Bureau (PIB)', 'स्रोत: प्रेस सूचना ब्यूरो (PIB)')}
        </div>
      </aside>
        </div>
      </div>

      {/* Main Page Container for Grid & Features */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-6 space-y-8">

      {/* MAIN SECTION HEADING */}
      <div className="text-center space-y-1.5 pt-2">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0b2341] font-sans tracking-tight">
          {t('home_heading')}
        </h2>
        <p className="text-sm text-slate-500 font-bold">
          {t('home_subheading')}
        </p>
      </div>

      {/* 3 SERVICE CARDS — restyled to match the "Easy steps" reference look:
          white centered cards, green icon/title accents, dotted corner motif,
          soft blurred circle accent, and chevron connectors between cards. */}
      {/* support-cards-section opts back into rounded cards — see the matching
          override in index.css next to the site-wide square-edge reset. */}
      <div className="support-cards-section relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-emerald-50/60 py-10 px-4 sm:px-8">

        {/* Decorative dot grid, top-left */}
        <div
          className="hidden sm:block absolute top-6 left-6 w-32 h-24 opacity-40 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #34d399 1.5px, transparent 1.5px)',
            backgroundSize: '14px 14px',
          }}
        />
        {/* Decorative soft blurred circle, bottom-right */}
        <div className="hidden sm:block absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-emerald-200/40 blur-2xl pointer-events-none" />

        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 md:gap-3 items-center max-w-5xl mx-auto">
          {[
            { Icon: Store, titleEn: 'Business Support', titleHi: 'व्यवसाय सहायता', flow: 'business', descKey: 'card_business_desc' },
            { Icon: GraduationCap, titleEn: 'Student Support', titleHi: 'छात्र सहायता', flow: 'student', descKey: 'card_student_desc' },
            { Icon: Settings, titleEn: 'Skills & Employment', titleHi: 'कौशल और रोजगार', flow: 'skills', descKey: 'card_skills_desc' },
          ].flatMap(({ Icon, titleEn, titleHi, flow, descKey }, i, arr) => {
            const card = (
              <button
                key={flow}
                onClick={() => onSelectFlow(flow)}
                className="w-full bg-white shadow-md hover:shadow-2xl p-6 flex flex-col items-center text-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-2.5"
              >
                <Icon className="w-10 h-10 text-emerald-600" strokeWidth={1.75} />
                <h3 className="text-lg font-black text-emerald-600">{tr(titleEn, titleHi)}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{t(descKey)}</p>
              </button>
            );
            // Insert a chevron connector between cards (desktop only).
            if (i < arr.length - 1) {
              return [card, <ChevronsRight key={`arrow-${flow}`} className="hidden md:block w-7 h-7 text-slate-300 mx-auto" />];
            }
            return [card];
          })}
        </div>
      </div>

      {/* 4-COLUMN TRUST INDICATORS BAR */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shadow-sm">
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shrink-0 font-bold">
            👥
          </div>
          <div>
            <div className="text-sm font-extrabold text-[#0b2341]">
              {tr('Assisted Thousands of Citizens', 'हजारों नागरिकों की सहायता')}
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {tr('A new start every day', 'हर दिन नई शुरुआत')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l-0 lg:border-l border-slate-200 lg:pl-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center text-xl shrink-0 font-bold">
            📄
          </div>
          <div>
            <div className="text-sm font-extrabold text-[#0b2341]">
              {tr('Central & State Schemes', 'केंद्रीय और राज्य सरकारी योजनाएँ')}
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {tr('All in one place', 'एक ही स्थान पर')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l-0 lg:border-l border-slate-200 lg:pl-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shrink-0 font-bold">
            🛡️
          </div>
          <div>
            <div className="text-sm font-extrabold text-[#0b2341]">
              {tr('Verified Official Info', 'विश्वसनीय जानकारी')}
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {tr('From official sources', 'सरकारी स्रोतों पर आधारित')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l-0 lg:border-l border-slate-200 lg:pl-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl shrink-0 font-bold">
            🎧
          </div>
          <div>
            <div className="text-sm font-extrabold text-[#0b2341]">
              {tr('Simple & Multilingual Support', 'सरल और बहुभाषी समर्थन')}
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {tr('In your language', 'आपकी भाषा में')}
            </div>
          </div>
        </div>

      </div>

      {/* PROACTIVE ELIGIBILITY — compact summary; "See more" opens the full
          claimable list on its own page. Placed here (below the hero) rather
          than at the very top. */}
      {session && onOpenScheme && (
        <div className="-mx-3 sm:-mx-4">
          <EligibilityDashboard variant="summary" onSeeMore={onOpenEligibility} onOpenProfile={onOpenProfile} />
        </div>
      )}

      {/* PUBLIC-SERVICE CAMPAIGN BANNER */}
      <section className="relative overflow-hidden border-2 border-[#8FB9A6] bg-[#FBFCF7] shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-[#F97316] from-0% from-[#F97316] via-[#F97316] via-[38%] to-[#15803D] to-[38%]"></div>
        <div className="grid grid-cols-1 lg:grid-cols-[170px_minmax(0,1fr)_290px] min-h-[270px]">
          <div className="bg-gradient-to-b from-[#12613C] to-[#0B4D32] text-white px-6 py-7 flex flex-col justify-between">
            <div>
              <Users className="w-12 h-12 mb-4" />
              <p className="text-xl font-black leading-snug">
                {tr('Development for every citizen, together with all', 'जन-जन का विकास, सबका साथ')}
              </p>
            </div>
            <div className="border-t border-white/50 pt-4 text-sm font-bold leading-relaxed">
              {tr('A Government of India initiative', 'भारत सरकार की पहल')}
            </div>
          </div>

          <div className="px-5 sm:px-7 py-7 lg:py-8 flex flex-col justify-between gap-5">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight text-[#075C3B]">
                {tr('“Take advantage of government schemes and contribute to an Atmanirbhar Bharat.”', '“सरकारी योजनाओं का लाभ उठाएँ, आत्मनिर्भर भारत में अपना योगदान दें।”')}
              </h2>
              <p className="mt-3 text-lg text-slate-600 font-medium">
                {tr('Government schemes are for your progress. Find the right information and choose the right opportunity.', 'सरकार की योजनाएँ आपके विकास के लिए हैं। सही जानकारी पाएं, सही अवसर चुनें।')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm text-slate-700">
              <div className="flex items-center gap-2.5 xl:border-r xl:border-slate-200 xl:pr-3"><FileText className="w-8 h-8 text-[#086344] shrink-0" /><span className="font-bold">{tr('Scheme information in one place', 'एक ही स्थान पर योजना जानकारी')}</span></div>
              <div className="flex items-center gap-2.5 xl:border-r xl:border-slate-200 xl:pr-3"><ShieldCheck className="w-8 h-8 text-[#086344] shrink-0" /><span className="font-bold">{tr('Verified government sources', 'विश्वसनीय सरकारी स्रोत')}</span></div>
              <div className="flex items-center gap-2.5 xl:border-r xl:border-slate-200 xl:pr-3"><Users className="w-8 h-8 text-[#086344] shrink-0" /><span className="font-bold">{tr('Useful schemes for every group', 'हर वर्ग के लिए उपयोगी योजनाएँ')}</span></div>
              <div className="flex items-center gap-2.5"><Headphones className="w-8 h-8 text-[#086344] shrink-0" /><span className="font-bold">{tr('Guidance in simple language', 'सरल भाषा में मार्गदर्शन')}</span></div>
            </div>
          </div>

          <div className="relative min-h-[230px] overflow-hidden bg-[#F3F6EA]">
            <img src="/rural_farmer_couple.png" alt="Government scheme beneficiaries" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FBFCF7] via-transparent to-transparent"></div>
            <div className="absolute top-5 right-5 text-right text-[#0B3D71] font-black italic text-lg leading-tight">
              {tr('Viksit Bharat', 'विकसित भारत')}<br />{tr('Empowered Citizens', 'सशक्त नागरिक')}
            </div>
            <button
              onClick={() => onSelectFlow('business')}
              className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-[#086344] hover:bg-[#064A33] text-white font-extrabold py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg flex items-center gap-2 shadow-lg transition-colors"
            >
              <span>{tr('Start Searching Now', 'अभी खोज शुरू करें')}</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* EMI CALCULATOR SECTION */}
      {/* emi-card-section opts this section back into rounded cards — see the
          matching override in index.css next to the site-wide square-edge reset. */}
      <section className="emi-card-section grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Card 1: Calculator Form — one uniform accent color throughout (no
            multicolored per-field theming), all text sized up 35% from base. */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0B75C9] flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[1.519rem] font-black text-[#0B3D71] leading-tight">{tr('EMI Calculator', 'EMI कैलकुलेटर')}</h3>
              <p className="text-[1.0125rem] text-slate-500 font-semibold">{tr('Estimate your monthly EMI for government loans', 'सरकारी लोन के लिए अपनी मासिक किस्त का अनुमान लगाएं')}</p>
            </div>
          </div>

          {/* Loan Amount Slider */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[1.18125rem] font-bold text-slate-700">{tr('Loan Amount (₹)', 'लोन राशि (₹)')}</label>
              <span className="text-[1.18125rem] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 whitespace-nowrap">
                ₹ {parseInt(loanAmount || 0).toLocaleString(lang === 'en' ? 'en-US' : 'en-IN')}
              </span>
            </div>
            <input
              type="range" min="10000" max="5000000" step="10000" value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer slider"
              style={{ background: `linear-gradient(to right, #2563EB 0%, #2563EB ${(loanAmount - 10000) / (5000000 - 10000) * 100}%, #E2E8F0 ${(loanAmount - 10000) / (5000000 - 10000) * 100}%, #E2E8F0 100%)` }}
            />
            <div className="flex justify-between text-[1.0125rem] font-semibold text-slate-400">
              <span>₹10,000</span><span>₹50,00,000</span>
            </div>
          </div>

          {/* Loan Tenure Slider */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[1.18125rem] font-bold text-slate-700">{tr('Loan Tenure (Years)', 'ऋण अवधि (वर्ष)')}</label>
              <span className="text-[1.18125rem] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 whitespace-nowrap">
                {loanTenure} {tr('years', 'वर्ष')}
              </span>
            </div>
            <input
              type="range" min="1" max="30" step="1" value={loanTenure}
              onChange={(e) => setLoanTenure(e.target.value)}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer slider"
              style={{ background: `linear-gradient(to right, #2563EB 0%, #2563EB ${(loanTenure - 1) / (30 - 1) * 100}%, #E2E8F0 ${(loanTenure - 1) / (30 - 1) * 100}%, #E2E8F0 100%)` }}
            />
            <div className="flex justify-between text-[1.0125rem] font-semibold text-slate-400">
              <span>1 {tr('year', 'वर्ष')}</span><span>30 {tr('years', 'वर्ष')}</span>
            </div>
          </div>

          {/* Interest Rate Slider */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[1.18125rem] font-bold text-slate-700">{tr('Interest Rate (% p.a.)', 'ब्याज दर (% वार्षिक)')}</label>
              <span className="text-[1.18125rem] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 whitespace-nowrap">{interestRate}%</span>
            </div>
            <input
              type="range" min="4" max="12" step="0.5" value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer slider"
              style={{ background: `linear-gradient(to right, #2563EB 0%, #2563EB ${(interestRate - 4) / (12 - 4) * 100}%, #E2E8F0 ${(interestRate - 4) / (12 - 4) * 100}%, #E2E8F0 100%)` }}
            />
            <div className="flex justify-between text-[1.0125rem] font-semibold text-slate-400">
              <span>4%</span><span>12%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Estimated EMI */}
        <div className="lg:col-span-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <h4 className="text-sm font-black text-emerald-800">{tr('Your Estimated EMI', 'आपकी अनुमानित EMI')}</h4>
          </div>

          {emiResult ? (
            <>
              <div>
                <p className="text-3xl font-black text-slate-900">₹ {parseInt(emiResult.emi).toLocaleString(lang === 'en' ? 'en-US' : 'en-IN')}</p>
                <p className="text-[1.275rem] text-slate-500 font-semibold mt-0.5">{tr('per month', 'प्रति माह')}</p>
              </div>

              <div className="bg-white/70 rounded-xl divide-y divide-emerald-100 border border-emerald-100">
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-[1.275rem] font-semibold text-slate-500">{tr('Loan Amount', 'लोन राशि')}</span>
                  <span className="text-[1.4875rem] font-bold text-slate-800">₹ {parseInt(loanAmount || 0).toLocaleString(lang === 'en' ? 'en-US' : 'en-IN')}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-[1.275rem] font-semibold text-slate-500">{tr('Tenure', 'अवधि')}</span>
                  <span className="text-[1.4875rem] font-bold text-slate-800">{loanTenure} {tr('years', 'वर्ष')}</span>
                </div>
                <div className="flex items-center justify-between px-3.5 py-2.5">
                  <span className="text-[1.275rem] font-semibold text-slate-500">{tr('Interest Rate', 'ब्याज दर')}</span>
                  <span className="text-[1.4875rem] font-bold text-slate-800">{interestRate}% {tr('p.a.', 'वार्षिक')}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-[1.275rem] text-emerald-800 font-semibold leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-1" />
                {tr('This is an estimate. Actual EMI may vary based on the scheme and lender terms.', 'यह एक अनुमान है। वास्तविक EMI योजना और ऋणदाता की शर्तों के अनुसार भिन्न हो सकती है।')}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600 font-semibold py-6 text-center">
              {tr('Enter loan amount, tenure and rate to see your EMI', 'लोन राशि, वर्ष और ब्याज दर दर्ज करके EMI देखें')}
            </p>
          )}
        </div>

        {/* Card 3: Popular Schemes */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4" fill="currentColor" />
            </div>
            <div>
              <h4 className="text-[1.18125rem] font-black text-[#0B3D71]">{tr('Popular Schemes', 'लोकप्रिय योजनाएँ')}</h4>
              <p className="text-[1.0125rem] text-slate-500 font-semibold mt-0.5">{tr('Explore some of the most searched government schemes', 'सबसे अधिक खोजी गई सरकारी योजनाओं को देखें')}</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { Icon: Landmark, bg: 'bg-red-50', color: 'text-red-500', title: 'PM Mudra', enSub: '₹50,000 – ₹10 Lakh', hiSub: '₹50,000 – ₹10 लाख', enDesc: 'For small business owners', hiDesc: 'छोटे व्यवसायियों के लिए' },
              { Icon: Briefcase, bg: 'bg-blue-50', color: 'text-blue-600', title: 'PMEGP', enSub: '₹25 – ₹100 Lakh', hiSub: '₹25 – ₹100 लाख', enDesc: 'For new enterprises', hiDesc: 'नए उद्यमों के लिए' },
              { Icon: Sprout, bg: 'bg-emerald-50', color: 'text-emerald-600', title: 'PM Kisan', enSub: 'Agriculture loan support', hiSub: 'कृषि ऋण सहायता', enDesc: 'For farmers', hiDesc: 'किसानों के लिए' },
            ].map(({ Icon, bg, color, title, enSub, hiSub, enDesc, hiDesc }) => (
              <button key={title} onClick={onBrowseAllSchemes}
                className="w-full flex items-center gap-3 text-left p-2 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[1.18125rem] font-bold text-slate-800">{title}</div>
                  <div className="text-[1.0125rem] text-slate-500 font-medium truncate">{tr(enSub, hiSub)} · {tr(enDesc, hiDesc)}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
              </button>
            ))}
          </div>

          <button onClick={onBrowseAllSchemes} className="text-[1.18125rem] font-bold text-[#0B75C9] flex items-center gap-1 hover:underline">
            {tr('View all schemes', 'सभी योजनाएँ देखें')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      </div>
    </div>
  );
}
