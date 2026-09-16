import React from 'react';
import { ArrowRight, RotateCcw, Volume2, VolumeX, Search, Sparkles, ExternalLink } from 'lucide-react';
import { readTextAloud, stopTextAloud } from '../services/audioService';
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { getEligibleCatalogueSchemes } from '../services/catalogueService';
import SchemeStatusStrip from './SchemeStatusStrip';

// Map the discovery-flow intent to the benefit types the matcher filters on, so
// an "education loan" search surfaces loan schemes from the full catalogue, a
// "scholarship" search surfaces scholarships, etc.
function deriveBenefitTypes(c = {}) {
  if (c.student_type) {
    const m = {
      scholarship: ['scholarship', 'stipend', 'fellowship'],
      education_loan: ['loan'],
      coaching_support: ['training', 'scholarship'],
      hostel_support: ['housing', 'subsidy', 'scholarship'],
      overseas: ['scholarship', 'loan', 'fellowship'],
    };
    return m[c.student_type] || ['scholarship', 'loan'];
  }
  if (c.field || c.business_status || c.financial_need) return ['loan', 'subsidy', 'grant', 'equipment'];
  return ['training', 'stipend']; // skills & employment
}

export default function ResultsScreen({
  schemes,
  userCriteria,
  onSelectScheme,
  onRestart
}) {
  const { t, tr, trText, lang: currentLang } = useI18n();
  const [speaking, setSpeaking] = useState(false);
  const isHindi = currentLang !== 'en';

  // Beyond SchemeSetu's own ~20 verified schemes, match the signed-in user's
  // profile against the FULL myScheme catalogue (4,600+ schemes) using the
  // AI-extracted eligibility criteria. Clearly separated below and never merged
  // with the verified count — these are AI-assisted and must be confirmed on the
  // official portal.
  const [eligibleExtra, setEligibleExtra] = useState(null); // null = loading, [] = none
  useEffect(() => {
    let active = true;
    setEligibleExtra(null);
    getEligibleCatalogueSchemes(deriveBenefitTypes(userCriteria), 12)
      .then((list) => { if (active) setEligibleExtra(list); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCriteria]);
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

      {/* Full-catalogue matches — the signed-in user's profile checked against
          every myScheme scheme via AI-extracted eligibility. Deliberately
          separate and differently styled: AI-assisted, NOT hand-verified, and
          never merged into the "matching schemes" count above. */}
      {(eligibleExtra === null || eligibleExtra.length > 0) && (
        <div className="border-t-2 border-dashed border-slate-300 pt-6 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-extrabold text-slate-700">
              {tr('More schemes you may be eligible for', 'और योजनाएँ जिनके लिए आप पात्र हो सकते हैं')}
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {tr(
              'Matched against the full Government of India myScheme catalogue (4,600+ schemes) using AI-assisted eligibility. Confirm details and apply on the official portal.',
              'भारत सरकार के पूरे myScheme कैटलॉग (4,600+ योजनाएँ) से AI-सहायता प्राप्त पात्रता के आधार पर मिलान। विवरण की पुष्टि कर आधिकारिक पोर्टल पर आवेदन करें।'
            )}
          </p>

          {eligibleExtra === null && (
            <p className="text-sm text-slate-400 italic">{tr('Checking the full catalogue…', 'पूरा कैटलॉग जाँचा जा रहा है…')}</p>
          )}

          {Array.isArray(eligibleExtra) && eligibleExtra.map((s) => (
            <div key={s.slug} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-slate-800">{trText(s.name, 'en')}</div>
                {s.short_description && <div className="text-sm text-slate-600 mt-0.5 line-clamp-2">{trText(s.short_description, 'en')}</div>}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-200 rounded px-1.5 py-0.5">
                    {s.level === 'state' ? tr('State Scheme', 'राज्य योजना') : tr('Central Scheme', 'केंद्रीय योजना')}
                  </span>
                  {(s.benefit_types || []).slice(0, 3).map((b) => (
                    <span key={b} className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-100 rounded px-1.5 py-0.5">{b}</span>
                  ))}
                </div>
              </div>
              <a
                href={s.source_url || `https://www.myscheme.gov.in/schemes/${s.slug}`}
                target="_blank" rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 text-sm font-bold text-gov-navy hover:underline whitespace-nowrap"
              >
                <Search className="w-4 h-4" /> {tr('View', 'देखें')} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
