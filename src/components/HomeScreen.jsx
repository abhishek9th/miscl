import React, { useState } from 'react';
import { ArrowRight, Bell, ExternalLink, FileText, Headphones, ShieldCheck, Store, GraduationCap, Settings, Users } from 'lucide-react';
import { getTranslation } from '../data/translations';

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
  currentLang, 
  userState, 
  onSelectFlow,
  onBrowseAllSchemes
}) {
  const t = (key) => getTranslation(currentLang, key);
  const isHindi = currentLang === 'hi';

  // EMI Calculator State
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTenure, setLoanTenure] = useState('');
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
                {isHindi ? "सरकारी योजनाएँ," : "Government Schemes,"} <br />
                <span className="text-[#15803D]">{isHindi ? "आपके विकास के लिए" : "For Your Development"}</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed">
                {isHindi 
                  ? "व्यवसाय, शिक्षा, कौशल और रोजगार से जुड़ी सरकारी योजनाओं की जानकारी अब आपके हाथों में – सरल, तेज और आपकी भाषा में।"
                  : "Empowering every citizen with fast, simple, and direct access to business, education, skill, and employment government benefits."}
              </p>
            </div>

            {/* Saffron/Yellow Callout Box */}
            <div className="bg-[#FEF3C7]/95 backdrop-blur-sm border-2 border-[#FDE68A] rounded-2xl p-4 flex items-center gap-3 shadow-md">
              <div className="w-10 h-10 rounded-xl bg-[#D97706] text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
                👥
              </div>
              <div className="text-sm font-extrabold text-[#78350F] leading-snug">
                {isHindi 
                  ? "विशेष रूप से अनुसूचित जाति, वंचित वर्गों और सभी पात्र नागरिकों के लिए"
                  : "Specially designed for SC, marginalized communities, and all eligible citizens."}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <button
                onClick={() => onSelectFlow('business')}
                className="inline-flex items-center gap-2 bg-[#075C9C] hover:bg-[#064A7D] text-white font-extrabold px-5 py-3 rounded-md shadow transition-colors"
              >
                {isHindi ? 'अपनी उपयुक्त योजनाएँ खोजें' : 'Find Suitable Schemes'}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onBrowseAllSchemes}
                className="inline-flex items-center gap-2 text-[#0B3D71] hover:text-[#075C9C] font-extrabold underline underline-offset-4"
              >
                {isHindi ? 'सभी सरकारी योजनाएँ देखें' : 'Browse all government schemes'}
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
            <h2>{isHindi ? 'योजना व सब्सिडी अपडेट' : 'Scheme & Subsidy Updates'}</h2>
          </div>
          <a
            href="https://www.pib.gov.in/AllRel.aspx?reg=3&lang=1"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold whitespace-nowrap hover:text-amber-200 transition-colors flex items-center gap-1"
          >
            {isHindi ? 'सभी देखें' : 'View all'} <ArrowRight className="w-3.5 h-3.5" />
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
              <div className="text-xs font-bold text-slate-500 mb-1.5">{notice.date}</div>
              <div className="text-sm leading-snug font-semibold text-slate-700 group-hover:text-[#0B3D71] flex gap-1.5">
                <span>{notice.title}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
        <div className="border-t border-slate-200 px-5 py-2.5 text-[11px] text-slate-500 font-medium">
          {isHindi ? 'स्रोत: प्रेस सूचना ब्यूरो (PIB)' : 'Source: Press Information Bureau (PIB)'}
        </div>
      </aside>
        </div>
      </div>

      {/* Main Page Container for Grid & Features */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-6 space-y-8">

      {/* MAIN SECTION HEADING */}
      <div className="text-left space-y-1.5 pt-2">
        <h2 className="text-2xl sm:text-3xl font-black text-[#0b2341] font-sans tracking-tight">
          {t('home_heading')}
        </h2>
        <p className="text-sm text-slate-500 font-bold">
          {t('home_subheading')}
        </p>
      </div>

      {/* 3 SERVICE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Unified service cards */}
        <div className="bg-[#F5FAFF] border-2 border-[#BFDBFE] p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md hover:border-[#60A5FA] transition-all">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#0B75C9] text-white flex items-center justify-center shadow-md">
              <Store className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#0B3D71]">
                {t('card_business_title')}
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {t('card_business_desc')}
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectFlow('business')}
            className="flex items-center gap-3 text-left group focus:outline-none pt-2"
          >
            <div className="w-10 h-10 rounded-full bg-[#0B75C9] text-white flex items-center justify-center text-lg font-bold shadow group-hover:scale-110 transition-transform">
              →
            </div>
            <span className="text-lg font-black text-[#0B3D71] group-hover:text-[#0B75C9] transition-colors">
              {isHindi ? "व्यवसाय योजनाएँ देखें" : "View Business Schemes"}
            </span>
          </button>
        </div>

        <div className="bg-[#F5FAFF] border-2 border-[#BFDBFE] p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md hover:border-[#60A5FA] transition-all">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#0B75C9] text-white flex items-center justify-center shadow-md">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#0B3D71]">
                {t('card_student_title')}
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {t('card_student_desc')}
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectFlow('student')}
            className="flex items-center gap-3 text-left group focus:outline-none pt-2"
          >
            <div className="w-10 h-10 rounded-full bg-[#0B75C9] text-white flex items-center justify-center text-lg font-bold shadow group-hover:scale-110 transition-transform">
              →
            </div>
            <span className="text-lg font-black text-[#0B3D71] group-hover:text-[#0B75C9] transition-colors">
              {isHindi ? "छात्र योजनाएँ देखें" : "View Student Schemes"}
            </span>
          </button>
        </div>

        <div className="bg-[#F5FAFF] border-2 border-[#BFDBFE] p-6 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md hover:border-[#60A5FA] transition-all">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#0B75C9] text-white flex items-center justify-center shadow-md">
              <Settings className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#0B3D71]">
                {t('card_skills_title')}
              </h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {t('card_skills_desc')}
              </p>
            </div>
          </div>

          <button
            onClick={() => onSelectFlow('skills')}
            className="flex items-center gap-3 text-left group focus:outline-none pt-2"
          >
            <div className="w-10 h-10 rounded-full bg-[#0B75C9] text-white flex items-center justify-center text-lg font-bold shadow group-hover:scale-110 transition-transform">
              →
            </div>
            <span className="text-lg font-black text-[#0B3D71] group-hover:text-[#0B75C9] transition-colors">
              {isHindi ? "योजनाएँ देखें" : "View Skill Schemes"}
            </span>
          </button>
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
              {isHindi ? "हजारों नागरिकों की सहायता" : "Assisted Thousands"}
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {isHindi ? "हर दिन नई शुरुआत" : "Every day new start"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l-0 lg:border-l border-slate-200 lg:pl-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center text-xl shrink-0 font-bold">
            📄
          </div>
          <div>
            <div className="text-sm font-extrabold text-[#0b2341]">
              {isHindi ? "केंद्रीय और राज्य सरकारी योजनाएँ" : "Central & State Schemes"}
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {isHindi ? "एक ही स्थान पर" : "All in one place"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l-0 lg:border-l border-slate-200 lg:pl-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shrink-0 font-bold">
            🛡️
          </div>
          <div>
            <div className="text-sm font-extrabold text-[#0b2341]">
              {isHindi ? "विश्वसनीय जानकारी" : "Verified Official Info"}
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {isHindi ? "सरकारी स्रोतों पर आधारित" : "From official sources"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l-0 lg:border-l border-slate-200 lg:pl-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl shrink-0 font-bold">
            🎧
          </div>
          <div>
            <div className="text-sm font-extrabold text-[#0b2341]">
              {isHindi ? "सरल और बहुभाषी समर्थन" : "Multilingual Support"}
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {isHindi ? "आपकी भाषा में" : "In your language"}
            </div>
          </div>
        </div>

      </div>

      {/* PUBLIC-SERVICE CAMPAIGN BANNER */}
      <section className="relative overflow-hidden border-2 border-[#8FB9A6] bg-[#FBFCF7] shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-[#F97316] from-0% from-[#F97316] via-[#F97316] via-[38%] to-[#15803D] to-[38%]"></div>
        <div className="grid grid-cols-1 lg:grid-cols-[170px_minmax(0,1fr)_290px] min-h-[270px]">
          <div className="bg-gradient-to-b from-[#12613C] to-[#0B4D32] text-white px-6 py-7 flex flex-col justify-between">
            <div>
              <Users className="w-12 h-12 mb-4" />
              <p className="text-xl font-black leading-snug">
                {isHindi ? 'जन-जन का विकास, सबका साथ' : 'Development for every citizen'}
              </p>
            </div>
            <div className="border-t border-white/50 pt-4 text-sm font-bold leading-relaxed">
              {isHindi ? 'भारत सरकार की पहल' : 'Government of India initiative'}
            </div>
          </div>

          <div className="px-5 sm:px-7 py-7 lg:py-8 flex flex-col justify-between gap-5">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight text-[#075C3B]">
                {isHindi ? '“सरकारी योजनाओं का लाभ उठाएँ, आत्मनिर्भर भारत में अपना योगदान दें।”' : '“Use government schemes and contribute to an Atmanirbhar Bharat.”'}
              </h2>
              <p className="mt-3 text-lg text-slate-600 font-medium">
                {isHindi ? 'सरकार की योजनाएँ आपके विकास के लिए हैं। सही जानकारी पाएं, सही अवसर चुनें।' : 'Government schemes are for your progress. Find the right information and choose the right opportunity.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-sm text-slate-700">
              <div className="flex items-center gap-2.5 xl:border-r xl:border-slate-200 xl:pr-3"><FileText className="w-8 h-8 text-[#086344] shrink-0" /><span className="font-bold">{isHindi ? 'एक ही स्थान पर योजना जानकारी' : 'All schemes in one place'}</span></div>
              <div className="flex items-center gap-2.5 xl:border-r xl:border-slate-200 xl:pr-3"><ShieldCheck className="w-8 h-8 text-[#086344] shrink-0" /><span className="font-bold">{isHindi ? 'विश्वसनीय सरकारी स्रोत' : 'Verified government sources'}</span></div>
              <div className="flex items-center gap-2.5 xl:border-r xl:border-slate-200 xl:pr-3"><Users className="w-8 h-8 text-[#086344] shrink-0" /><span className="font-bold">{isHindi ? 'हर वर्ग के लिए उपयोगी योजनाएँ' : 'Useful schemes for every group'}</span></div>
              <div className="flex items-center gap-2.5"><Headphones className="w-8 h-8 text-[#086344] shrink-0" /><span className="font-bold">{isHindi ? 'सरल भाषा में मार्गदर्शन' : 'Guidance in simple language'}</span></div>
            </div>
          </div>

          <div className="relative min-h-[230px] overflow-hidden bg-[#F3F6EA]">
            <img src="/rural_farmer_couple.png" alt="Government scheme beneficiaries" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FBFCF7] via-transparent to-transparent"></div>
            <div className="absolute top-5 right-5 text-right text-[#0B3D71] font-black italic text-lg leading-tight">
              {isHindi ? <>विकसित भारत<br />सशक्त नागरिक</> : <>Viksit Bharat<br />Empowered Citizens</>}
            </div>
            <button
              onClick={() => onSelectFlow('business')}
              className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-[#086344] hover:bg-[#064A33] text-white font-extrabold py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg flex items-center gap-2 shadow-lg transition-colors"
            >
              <span>{isHindi ? 'अभी खोज शुरू करें' : 'Start Searching Now'}</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* EMI CALCULATOR SECTION */}
      <section className="bg-gradient-to-br from-[#F5FAFF] to-[#E8F1FF] border-2 border-[#60A5FA] rounded-2xl p-6 sm:p-8 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Side: Calculator Form */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-[#0B3D71] tracking-tight">
                  {isHindi ? "EMI कैलकुलेटर" : "EMI Calculator"}
                </h3>
                <p className="text-sm text-slate-600 font-semibold">
                  {isHindi 
                    ? "सरकारी लोन के लिए अपनी मासिक किस्त का अनुमान लगाएं"
                    : "Estimate your monthly EMI for government loans"}
                </p>
              </div>

              {/* Loan Amount Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-extrabold text-[#0B3D71]">
                    {isHindi ? "लोन राशि (₹)" : "Loan Amount (₹)"}
                  </label>
                  <span className="text-xl font-black text-[#0B75C9]">
                    ₹ {loanAmount ? parseInt(loanAmount).toLocaleString(isHindi ? 'en-IN' : 'en-US') : '0'}
                  </span>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="5000000"
                  step="10000"
                  value={loanAmount || '100000'}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full h-2 bg-[#BFDBFE] rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #0B75C9 0%, #0B75C9 ${((loanAmount || 100000) - 10000) / (5000000 - 10000) * 100}%, #BFDBFE ${((loanAmount || 100000) - 10000) / (5000000 - 10000) * 100}%, #BFDBFE 100%)`
                  }}
                />
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>₹10,000</span>
                  <span>₹50,00,000</span>
                </div>
              </div>

              {/* Loan Tenure Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-extrabold text-[#0B3D71]">
                    {isHindi ? "ऋण अवधि (वर्ष)" : "Loan Tenure (Years)"}
                  </label>
                  <span className="text-xl font-black text-[#0B75C9]">
                    {loanTenure || '1'} {isHindi ? 'वर्ष' : 'yrs'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={loanTenure || '5'}
                  onChange={(e) => setLoanTenure(e.target.value)}
                  className="w-full h-2 bg-[#BFDBFE] rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #15803D 0%, #15803D ${((loanTenure || 5) - 1) / (30 - 1) * 100}%, #BFDBFE ${((loanTenure || 5) - 1) / (30 - 1) * 100}%, #BFDBFE 100%)`
                  }}
                />
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>1 {isHindi ? 'वर्ष' : 'year'}</span>
                  <span>30 {isHindi ? 'वर्ष' : 'years'}</span>
                </div>
                {loanTenure && (
                  <p className="text-xs text-[#0B75C9] font-bold bg-blue-50 p-2 rounded">
                    = {parseInt(loanTenure) * 12} {isHindi ? 'महीने' : 'months'}
                  </p>
                )}
              </div>

              {/* Interest Rate Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-extrabold text-[#0B3D71]">
                    {isHindi ? "ब्याज दर (% वार्षिक)" : "Interest Rate (% p.a.)"}
                  </label>
                  <span className="text-xl font-black text-[#D97706]">
                    {interestRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="12"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full h-2 bg-[#BFDBFE] rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #D97706 0%, #D97706 ${(interestRate - 4) / (12 - 4) * 100}%, #BFDBFE ${(interestRate - 4) / (12 - 4) * 100}%, #BFDBFE 100%)`
                  }}
                />
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>4%</span>
                  <span>12%</span>
                </div>
                <div className="bg-[#FEF3C7] border border-[#FDE68A] p-2 rounded text-xs font-bold text-[#92400E]">
                  {interestRate === '5.5' && (isHindi ? 'PM मुद्रा - सबसे कम' : 'PM Mudra - Lowest')}
                  {interestRate === '6.5' && (isHindi ? 'PM स्टैंड-अप इंडिया' : 'PM Stand-up India')}
                  {interestRate === '7' && 'PMEGP'}
                  {interestRate === '7.5' && (isHindi ? 'PM KUSUM' : 'PM KUSUM')}
                  {interestRate === '8' && (isHindi ? 'सामान्य दर' : 'Standard Rate')}
                  {interestRate === '8.5' && (isHindi ? 'सामान्य + दर' : 'Standard+ Rate')}
                  {!['5.5', '6.5', '7', '7.5', '8', '8.5'].includes(interestRate) && (isHindi ? 'कस्टम दर' : 'Custom Rate')}
                </div>
              </div>
            </div>

            {/* Right Side: Results Display */}
            <div className="space-y-4">
              <div className="bg-white border-2 border-[#BFDBFE] rounded-xl p-6 space-y-5">
                
                {emiResult ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {isHindi ? "मासिक किस्त" : "Monthly EMI"}
                      </p>
                      <p className="text-4xl font-black text-[#0B75C9]">
                        ₹ {parseInt(emiResult.emi).toLocaleString(isHindi ? 'en-IN' : 'en-US')}
                      </p>
                    </div>

                    <div className="border-t-2 border-slate-200 pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">
                          {isHindi ? "कुल राशि" : "Total Amount"}
                        </span>
                        <span className="text-lg font-black text-[#0B3D71]">
                          ₹ {parseInt(emiResult.totalAmount).toLocaleString(isHindi ? 'en-IN' : 'en-US')}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">
                          {isHindi ? "कुल ब्याज" : "Total Interest"}
                        </span>
                        <span className="text-lg font-black text-[#D97706]">
                          ₹ {parseInt(emiResult.totalInterest).toLocaleString(isHindi ? 'en-IN' : 'en-US')}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#E8F5E9] border-l-4 border-[#15803D] p-4 rounded-lg">
                      <p className="text-xs font-bold text-[#065F46] uppercase tracking-widest mb-1">
                        {isHindi ? "सूचना" : "Note"}
                      </p>
                      <p className="text-sm text-[#15803D] font-semibold leading-relaxed">
                        {isHindi 
                          ? "यह एक अनुमानित गणना है। वास्तविक EMI बैंक के नियमों के अनुसार भिन्न हो सकता है। सटीक जानकारी के लिए बैंक से संपर्क करें।"
                          : "This is an estimate. Actual EMI may vary as per bank policies. Contact your bank for exact details."}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-[#E0E7FF] flex items-center justify-center text-2xl">
                      📊
                    </div>
                    <p className="text-center text-slate-600 font-semibold">
                      {isHindi 
                        ? "लोन राशि, वर्ष और ब्याज दर दर्ज करके EMI देखें"
                        : "Enter loan amount, tenure and rate to see your EMI"}
                    </p>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-[#FEF3C7] border-2 border-[#FDE68A] rounded-lg p-4 space-y-2">
                <p className="text-xs font-extrabold text-[#78350F] uppercase tracking-widest">
                  {isHindi ? "मुख्य योजनाएँ" : "Popular Schemes"}
                </p>
                <ul className="text-sm text-[#92400E] font-semibold space-y-1.5">
                  <li>• PM मुद्रा: ₹50,000 - ₹10 लाख</li>
                  <li>• PMEGP: ₹25 - ₹100 लाख</li>
                  <li>• PM किसान: कृषि ऋण सहायता</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      </div>
    </div>
  );
}
