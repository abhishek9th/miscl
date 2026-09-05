import React from 'react';
import { ArrowRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { readTextAloud, stopTextAloud } from '../services/audioService';
import { useEffect, useState } from 'react';
import { getTranslation } from '../data/translations';

export default function ResultsScreen({ 
  schemes, 
  userCriteria, 
  onSelectScheme, 
  onRestart,
  currentLang
}) {
  const [speaking, setSpeaking] = useState(false);
  const t = (key) => getTranslation(currentLang, key);
  const isHindi = currentLang !== 'en';
  const readResults = () => {
    if (speaking) { stopTextAloud(); setSpeaking(false); return; }
    const top = schemes[0];
    if (!top) return;
    const title = isHindi ? (top.name_hi || top.name) : top.name;
    const benefit = (top.description_hi || '').split('।')[0];
    const message = isHindi
      ? `आपके लिए ${schemes.length} योजनाएँ मिली हैं। सबसे उपयुक्त योजना ${title} है। ${benefit}`
      : `We found ${schemes.length} schemes. The top result is ${title}. ${benefit}`;
    if (readTextAloud(message, currentLang, () => setSpeaking(false))) setSpeaking(true);
  };

  useEffect(() => {
    if (userCriteria.voiceMode && schemes.length) {
      const timer = window.setTimeout(readResults, 250);
      return () => window.clearTimeout(timer);
    }
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gov-navy text-white rounded-2xl p-5 sm:p-6 shadow-md border-b-4 border-gov-saffron flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-emerald-700 text-white font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
            🟢 {t('matching_schemes')}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
            {schemes.length} {t('matching_schemes')}
          </h2>
          <p className="text-sm text-amber-200">
            {isHindi ? 'आपकी दी गई जानकारी के आधार पर, ये योजनाएँ आपके लिए उपयुक्त हो सकती हैं:' : 'Based on your input, here are the government schemes you may qualify for:'}
          </p>
        </div>

        <button
          onClick={onRestart}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-bold py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 shrink-0 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{t('restart')}</span>
        </button>
        <button onClick={readResults} className="bg-amber-100 hover:bg-amber-200 text-gov-navy border border-amber-300 font-bold py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 shrink-0 transition-colors">
          {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {speaking ? (isHindi ? 'रोकें' : 'Stop') : (isHindi ? 'परिणाम सुनें' : 'Listen to results')}
        </button>
      </div>

      {/* Scheme Cards List */}
      <div className="space-y-4">
        {schemes.map((scheme) => {
          const isPartial = scheme.isPartialMatch;
          const schemeTitle = (currentLang === 'hi' || currentLang === 'pa' || currentLang === 'bn' || currentLang === 'ta' || currentLang === 'te' || currentLang === 'mr' || currentLang === 'gu' || currentLang === 'kn' || currentLang === 'ml' || currentLang === 'or' || currentLang === 'ur') 
            ? (scheme.name_hi || scheme.name) 
            : scheme.name;

          return (
            <div 
              key={scheme.id}
              className="gov-card p-5 sm:p-6 space-y-4 hover:shadow-md transition-all border-l-8 border-l-gov-navy"
            >
              {/* Card Top Title & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <h3 className="text-xl sm:text-2xl font-extrabold text-gov-navy leading-tight">
                  {schemeTitle}
                </h3>
                
                {isPartial ? (
                  <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 border border-amber-300 font-extrabold text-sm px-3 py-1 rounded-full shrink-0">
                    🟡 {t('partial_match_badge')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold text-sm px-3 py-1 rounded-full shrink-0">
                    🟢 {t('eligible_badge')}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-base text-slate-700 leading-relaxed">
                {isHindi ? scheme.description_hi : scheme.description_hi}
              </p>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-sm">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">{isHindi ? 'अधिकतम सहायता' : 'Max Assistance'}</div>
                    <div className="text-gov-navy text-base">{isHindi ? '₹' : 'Up to ₹'}{(scheme.max_financial_assistance / 100000).toFixed(1)} {isHindi ? 'लाख तक' : 'Lakhs'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">{isHindi ? 'सब्सिडी / ब्याज' : 'Subsidy / Interest'}</div>
                    <div className="text-emerald-800 text-base">{scheme.subsidy_percentage || scheme.interest_rate}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">{isHindi ? 'लागू क्षेत्र' : 'Scope'}</div>
                    <div className="text-slate-800 text-base">
                      {scheme.scope === 'central' ? (isHindi ? 'अखिल भारतीय योजना' : 'All India Scheme') : (scheme.states ? scheme.states.join(', ') : (isHindi ? 'राज्य योजना' : 'State Scheme'))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => onSelectScheme(scheme)}
                className="gov-btn-accent w-full py-4 text-xl flex items-center justify-center gap-2 shadow"
              >
                <span>{t('view_details')}</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
