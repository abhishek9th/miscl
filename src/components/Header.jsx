import React, { useState } from 'react';
import { Languages, Check, ChevronDown, Accessibility } from 'lucide-react';
import { LANGUAGES, getTranslation } from '../data/translations';

export default function Header({ currentLang, onLanguageChange, onGoHome, onOpenDirectory }) {
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState('normal'); // normal | large | xlarge

  const t = (key) => getTranslation(currentLang, key);
  const activeLangObj = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];
  const isHindi = currentLang === 'hi';

  const handleSelectLang = (code) => {
    onLanguageChange(code);
    setIsLangModalOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        {/* Government utility strip */}
        <div className="bg-[#f4f5f6] border-b border-slate-200 px-4 py-2 text-slate-700">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
            
            {/* Left: Ministry & Govt of India Info */}
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl grayscale">🏛️</span>
                <div className="leading-tight">
                  <div className="text-xs font-bold">भारत सरकार</div>
                  <div className="text-xs">Government of India</div>
                </div>
              </div>
              <span className="hidden sm:block h-8 border-l border-slate-500"></span>
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-bold">सामाजिक न्याय और अधिकारिता मंत्रालय</div>
                <div className="text-xs">Ministry of Social Justice and Empowerment</div>
              </div>
            </div>

            {/* Accessibility and language controls */}
            <div className="flex items-center gap-3 text-xs font-semibold text-gov-navy">
              <button className="hidden xl:block hover:text-gov-saffron transition-colors">
                {isHindi ? 'मुख्य सामग्री पर जाएं' : 'Skip to main content'}
              </button>
              <span className="hidden xl:inline text-slate-400">|</span>
              <button className="hover:text-gov-saffron transition-colors flex items-center gap-1">
                <Accessibility className="w-3 h-3" />
                <span>{isHindi ? "स्क्रीन रीडर के लिए" : "Screen Reader Access"}</span>
              </button>
              <span className="text-slate-400">|</span>
              <div className="flex items-center gap-1 font-mono font-bold">
                <button onClick={() => setFontSize('normal')} className="hover:text-gov-saffron px-0.5">A-</button>
                <button onClick={() => setFontSize('normal')} className="hover:text-gov-saffron px-0.5">A</button>
                <button onClick={() => setFontSize('large')} className="hover:text-gov-saffron px-0.5">A+</button>
              </div>
              <span className="text-slate-400">|</span>
              <button onClick={() => setIsLangModalOpen(true)} className="bg-white border border-slate-300 text-gov-navy font-extrabold py-2 px-3 flex items-center gap-2 shadow-sm hover:bg-slate-50">
                <Languages className="w-4 h-4" />
                <span>{activeLangObj.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

          </div>
        </div>

        {/* Main Header Content */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Logo & Portal Title */}
          <button 
            onClick={onGoHome}
            className="flex items-center gap-3 text-left group focus:outline-none"
            aria-label="SchemeSetu Home"
          >
            <svg
              viewBox="0 0 82 70"
              className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 group-hover:scale-105 transition-transform"
              aria-hidden="true"
            >
              <circle cx="27" cy="12" r="10" fill="#F97316" />
              <circle cx="11" cy="23" r="8" fill="#FB923C" />
              <path d="M7 52C18 44 24 37 29 28c7 8 13 14 21 17C37 52 25 57 13 62Z" fill="#F97316" />
              <path d="M17 64c14-4 22-16 27-29 5-13 12-22 28-31-9 15-17 30-23 45-5 13-16 19-32 15Z" fill="#15803D" />
              <path d="M30 31c-8 4-14 4-22 1 7-1 13-5 18-11 3 2 5 6 4 10Z" fill="#16A34A" />
            </svg>
            <div className="leading-none">
              <h1 className="text-[29px] sm:text-[34px] font-extrabold tracking-tight font-sans whitespace-nowrap">
                <span className="text-[#0B3D71]">Scheme</span><span className="text-[#15803D]">Setu</span>
              </h1>
              <p className="mt-1 text-[11px] sm:text-sm font-bold text-slate-600 whitespace-nowrap">
                {isHindi ? "सरकारी योजनाओं से सशक्त भविष्य" : "Empowering Future with Government Schemes"}
              </p>
            </div>
          </button>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 font-bold text-sm text-slate-800">
            <button onClick={onGoHome} className="text-gov-navy hover:text-gov-saffron transition-colors border-b-2 border-gov-navy py-1">
              {isHindi ? "होम" : "Home"}
            </button>
            <button onClick={onOpenDirectory} className="hover:text-gov-saffron transition-colors py-1">
              {isHindi ? "योजनाओं की सूची" : "Schemes Directory"}
            </button>
            <button onClick={onGoHome} className="hover:text-gov-saffron transition-colors py-1">
              {isHindi ? "सहायता केंद्र" : "Help Center"}
            </button>
            <button onClick={onGoHome} className="hover:text-gov-saffron transition-colors py-1">
              {isHindi ? "महत्वपूर्ण लिंक" : "Important Links"}
            </button>
            <button onClick={onGoHome} className="hover:text-gov-saffron transition-colors py-1">
              {isHindi ? "हमसे संपर्क करें" : "Contact Us"}
            </button>
          </nav>

        </div>

        {/* Tricolour divider below the primary navigation */}
        <div
          className="h-1.5"
          style={{ backgroundImage: 'linear-gradient(to right, #EA580C 0 30%, #ffffff 30% 34%, #15803D 34% 100%)' }}
        ></div>
      </header>

      {/* Language Selection Modal */}
      {isLangModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border-2 border-gov-navy overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gov-navy text-white p-4 flex items-center justify-between border-b-4 border-gov-saffron">
              <div className="flex items-center gap-2">
                <Languages className="w-6 h-6 text-amber-400" />
                <h2 className="text-xl font-bold">{t('select_language')}</h2>
              </div>
              <button
                onClick={() => setIsLangModalOpen(false)}
                className="text-white hover:text-amber-400 text-2xl font-bold px-2 py-1"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Language Grid */}
            <div className="p-4 overflow-y-auto grid grid-cols-2 gap-3 sm:grid-cols-3">
              {LANGUAGES.map((lang) => {
                const isSelected = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectLang(lang.code)}
                    className={`p-3.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 min-h-[64px] ${
                      isSelected
                        ? 'bg-amber-50 border-gov-saffron text-gov-navy font-extrabold shadow-sm ring-2 ring-amber-400/40'
                        : 'bg-white border-slate-200 hover:border-gov-navy text-slate-800 font-bold hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">{lang.label}</span>
                    <span className="text-xs text-slate-500 font-normal">{lang.name}</span>
                    {isSelected && (
                      <span className="mt-1 bg-gov-saffron text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 text-center">
              <button
                onClick={() => setIsLangModalOpen(false)}
                className="gov-btn-primary w-full py-3"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
