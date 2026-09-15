import React from 'react';
import { ArrowRight, RotateCcw, Volume2, VolumeX, Search, Sparkles, ExternalLink } from 'lucide-react';
import { readTextAloud, stopTextAloud } from '../services/audioService';
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { suggestAdditionalSchemes } from '../services/aiService';
import SchemeStatusStrip from './SchemeStatusStrip';

export default function ResultsScreen({
  schemes,
  userCriteria,
  onSelectScheme,
  onRestart
}) {
  const { t, tr, trText, lang: currentLang } = useI18n();
  const [speaking, setSpeaking] = useState(false);
  const isHindi = currentLang !== 'en';

  // Beyond SchemeSetu's own small verified catalogue, ask Groq to name other
  // REAL government schemes worth checking for this profile — clearly
  // separated below and never merged with the verified results, since these
  // are unverified suggestions the user must confirm on the official portal.
  const [aiSuggestions, setAiSuggestions] = useState(null); // null = loading, [] = none found
  useEffect(() => {
    let active = true;
    setAiSuggestions(null);
    suggestAdditionalSchemes(userCriteria, schemes.map((s) => s.name), currentLang)
      .then((list) => { if (active) setAiSuggestions(list); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemes, currentLang]);
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
      {/* Slim heading with a thin blue underline */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-blue-600 pb-2 font-sans">
        <h2 className="text-lg sm:text-xl font-extrabold text-gov-navy">
          {tr('Available schemes for you', 'आपके लिए उपलब्ध योजनाएँ')}
          <span className="ml-1.5 text-slate-400 font-bold">({schemes.length})</span>
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onRestart} className="text-gov-navy hover:text-gov-saffron font-bold text-sm flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">{t('restart')}</span>
          </button>
          <button onClick={readResults} className="text-gov-navy hover:text-gov-saffron font-bold text-sm flex items-center gap-1.5">
            {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{speaking ? tr('Stop', 'रोकें') : tr('Listen', 'सुनें')}</span>
          </button>
        </div>
      </div>

      {/* Scheme Cards List */}
      <div className="space-y-4">
        {schemes.map((scheme) => {
          const isPartial = scheme.isPartialMatch;
          const schemeTitle = tr(scheme.name, scheme.name_hi || scheme.name);

          return (
            <div
              key={scheme.id}
              className="gov-card overflow-hidden hover:shadow-md transition-all border-l-8 border-l-gov-navy"
            >
              {/* Full-width status strip flowing right-to-left across the card top */}
              <SchemeStatusStrip status={isPartial ? 'potential' : 'available'} />

              <div className="p-5 sm:p-6 space-y-4">
              {/* Card Title */}
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-xl sm:text-2xl font-extrabold text-gov-navy leading-tight">
                  {schemeTitle}
                </h3>
              </div>

              {/* Description */}
              <p className="text-base text-slate-700 leading-relaxed">
                {trText(scheme.description_hi, 'hi')}
              </p>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-sm">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">{tr('Max Assistance', 'अधिकतम सहायता')}</div>
                    <div className="text-gov-navy text-base">₹{(scheme.max_financial_assistance / 100000).toFixed(1)} {tr('Lakhs', 'लाख तक')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">{tr('Subsidy / Interest', 'सब्सिडी / ब्याज')}</div>
                    <div className="text-emerald-800 text-base">{trText(scheme.subsidy_percentage || scheme.interest_rate, 'hi')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <div>
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">{tr('Scope', 'लागू क्षेत्र')}</div>
                    <div className="text-slate-800 text-base">
                      {scheme.scope === 'central' ? tr('All India Scheme', 'अखिल भारतीय योजना') : (scheme.states ? scheme.states.join(', ') : tr('State Scheme', 'राज्य योजना'))}
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
            </div>
          );
        })}
      </div>

      {/* AI-suggested schemes — beyond SchemeSetu's own verified catalogue.
          Deliberately separate and differently styled: these are NOT
          verified entries, just real scheme names Groq recognises as
          potentially relevant, which the user must confirm on the official
          portal. Never merged into the "matching schemes" count above. */}
      {(aiSuggestions === null || aiSuggestions.length > 0) && (
        <div className="border-t-2 border-dashed border-slate-300 pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-extrabold text-slate-700">
              {tr('Other schemes worth checking', 'जाँचने योग्य अन्य योजनाएँ')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {tr(
              'These are additional government schemes SchemeSetu is aware of but has not yet verified in detail. Confirm eligibility and details on the official portal.',
              'ये अतिरिक्त सरकारी योजनाएँ हैं जिनके बारे में SchemeSetu को जानकारी है परंतु अभी तक विस्तार से सत्यापित नहीं किया गया है। कृपया पात्रता व विवरण आधिकारिक पोर्टल पर सत्यापित करें।'
            )}
          </p>

          {aiSuggestions === null && (
            <p className="text-sm text-slate-400 italic">{tr('Checking for more schemes…', 'अधिक योजनाओं की जाँच की जा रही है…')}</p>
          )}

          {Array.isArray(aiSuggestions) && aiSuggestions.map((s, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-slate-800">{s.name}</div>
                <div className="text-sm text-slate-600 mt-0.5">{s.reason}</div>
                {s.category && s.category !== 'unknown' && (
                  <span className="inline-block mt-1.5 text-[10px] font-bold uppercase text-slate-500 bg-slate-200 rounded px-1.5 py-0.5">
                    {s.category === 'central' ? tr('Central Scheme', 'केंद्रीय योजना') : tr('State Scheme', 'राज्य योजना')}
                  </span>
                )}
              </div>
              <a
                href={`https://www.myscheme.gov.in/search/scheme?q=${encodeURIComponent(s.name)}`}
                target="_blank" rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 text-sm font-bold text-gov-navy hover:underline whitespace-nowrap"
              >
                <Search className="w-4 h-4" /> {tr('Search', 'खोजें')} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
