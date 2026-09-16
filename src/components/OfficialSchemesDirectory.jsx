import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search, Landmark, ShieldCheck, ChevronLeft, ChevronRight, X, CheckCircle2, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n';
import { searchCatalogue, getCatalogueFilters } from '../services/catalogueService';
import { getEligibilityDashboard } from '../services/eligibilityService';
import CatalogueSchemeDetail from './CatalogueSchemeDetail';

const PAGE_SIZE = 20;

// Native, searchable directory over SchemeSetu's own myScheme catalogue —
// every scheme is shown and read INSIDE SchemeSetu (backend/routes/catalogue.js
// -> public.myscheme_catalogue), never a redirect to the official site.
export default function OfficialSchemesDirectory({ onBack, session, onOpenScheme }) {
  const { tr, trText } = useI18n();
  // 'all' = full scraped catalogue search; 'mine' = engine-evaluated schemes
  // the signed-in user actually matches (§53). "Eligible for me" is backed by
  // the real eligibility engine, not a keyword filter.
  const [mode, setMode] = useState('all');

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [level, setLevel] = useState('');
  const [ministry, setMinistry] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({ ministries: [], states: [] });
  const [results, setResults] = useState(null); // null = loading
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(null);

  useEffect(() => {
    getCatalogueFilters().then(setFilters).catch(() => {});
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => { setDebouncedQuery(query); setPage(1); }, 400);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => { setPage(1); }, [level, ministry, state]);

  useEffect(() => {
    let active = true;
    setResults(null);
    setError(false);
    searchCatalogue({ q: debouncedQuery, level, ministry, state, page, pageSize: PAGE_SIZE })
      .then((data) => { if (active) { setResults(data.schemes); setTotal(data.total); } })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [debouncedQuery, level, ministry, state, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const hasActiveFilters = query || level || ministry || state;
  const clearFilters = () => { setQuery(''); setLevel(''); setMinistry(''); setState(''); };

  if (selectedSlug) {
    return <CatalogueSchemeDetail slug={selectedSlug} onBack={() => setSelectedSlug(null)} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
      <button onClick={onBack} className="flex items-center gap-1.5 text-gov-navy font-extrabold hover:underline">
        <ArrowLeft className="w-5 h-5" />
        {tr('Back to home', 'होम पर वापस जाएँ')}
      </button>

      <section className="bg-gov-navy text-white rounded-2xl p-6 sm:p-8 border-b-4 border-gov-saffron shadow-md space-y-2">
        <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm uppercase tracking-wide">
          <Landmark className="w-5 h-5" />
          {tr('Official government directory', 'आधिकारिक सरकारी निर्देशिका')}
        </div>
        <h2 className="text-3xl sm:text-4xl font-black">
          {tr('All Government of India schemes', 'भारत की सभी सरकारी योजनाएँ')}
        </h2>
        <p className="text-slate-200 text-base leading-relaxed max-w-3xl">
          {tr('Search every Central, State and Union Territory scheme — shown here on SchemeSetu, sourced from the Government of India’s myScheme platform.', 'हर केंद्रीय, राज्य और केंद्र शासित प्रदेश योजना को यहीं SchemeSetu पर खोजें — जानकारी भारत सरकार के myScheme प्लेटफ़ॉर्म से ली गई है।')}
        </p>
      </section>

      {/* Mode toggle — "Explore all" vs "Eligible for me" (§53) */}
      {session && (
        <div className="flex gap-2 border-b border-slate-200">
          {[
            { id: 'all', en: 'Explore all schemes', hi: 'सभी योजनाएँ देखें' },
            { id: 'mine', en: 'Eligible for me', hi: 'मेरे लिए पात्र' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setMode(tab.id)}
              className={`px-4 py-2.5 font-extrabold text-sm border-b-2 -mb-px transition ${mode === tab.id ? 'border-gov-navy text-gov-navy' : 'border-transparent text-slate-500 hover:text-gov-navy'}`}>
              {tr(tab.en, tab.hi)}
            </button>
          ))}
        </div>
      )}

      {mode === 'mine' ? (
        <EligibleForMeList tr={tr} onOpenScheme={onOpenScheme} />
      ) : (
      <>
      {/* Search + filters */}
      <div className="gov-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr('Search scheme name or description…', 'योजना का नाम या विवरण खोजें…')}
            className="w-full pl-11 pr-4 py-3 border-2 border-slate-300 rounded-xl text-base font-semibold focus:border-gov-navy focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-bold">
            <option value="">{tr('All levels', 'सभी स्तर')}</option>
            <option value="central">{tr('Central', 'केंद्रीय')}</option>
            <option value="state">{tr('State / UT', 'राज्य / केंद्र शासित प्रदेश')}</option>
          </select>

          <select value={state} onChange={(e) => setState(e.target.value)} className="px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-bold max-w-[180px]">
            <option value="">{tr('All states/UTs', 'सभी राज्य/केंद्र शासित प्रदेश')}</option>
            {filters.states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm font-bold text-slate-500 hover:text-gov-navy">
              <X className="w-4 h-4" /> {tr('Clear', 'साफ़ करें')}
            </button>
          )}
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-full px-5 py-3 flex items-center gap-3 text-emerald-950 overflow-hidden">
        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-700" />
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="marquee-track flex w-max whitespace-nowrap">
            {[0, 1].map((copy) => (
              <p key={copy} className="text-sm font-semibold pr-16" aria-hidden={copy === 1}>
                {tr('Every scheme below is real, scraped from the Government of India myScheme platform — never AI-generated.', 'नीचे दी गई हर योजना वास्तविक है, भारत सरकार के myScheme प्लेटफ़ॉर्म से ली गई है — कभी भी AI-निर्मित नहीं।')}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {error && (
        <p className="text-center text-slate-500 py-10">{tr('Could not load schemes right now. Please try again.', 'योजनाएँ अभी लोड नहीं हो सकीं। कृपया पुनः प्रयास करें।')}</p>
      )}

      {!error && results === null && (
        <p className="text-center text-slate-400 py-10 italic">{tr('Searching…', 'खोजा जा रहा है…')}</p>
      )}

      {!error && results && results.length === 0 && (
        <p className="text-center text-slate-500 py-10">{tr('No schemes matched your search.', 'आपकी खोज से कोई योजना नहीं मिली।')}</p>
      )}

      {!error && results && results.length > 0 && (
        <>
          <p className="text-sm text-slate-500 font-semibold">
            {tr('Showing', 'दिखाया जा रहा है')} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} {tr('of', 'में से')} {total.toLocaleString()}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((s) => (
              <button
                key={s.slug}
                onClick={() => setSelectedSlug(s.slug)}
                className="gov-card p-4 text-left hover:shadow-md hover:border-gov-saffron transition-all space-y-2"
              >
                <span className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${s.level === 'state' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'}`}>
                  {s.level === 'state' ? tr('State/UT', 'राज्य/केंद्रशासित') : tr('Central', 'केंद्रीय')}
                </span>
                <div className="font-extrabold text-gov-navy leading-snug">{trText(s.name, 'en')}</div>
                {(s.ministries?.[0] || s.states?.[0]) && (
                  <div className="text-xs text-slate-500 font-bold">{s.ministries?.[0] || s.states?.[0]}</div>
                )}
                {s.short_description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{trText(s.short_description, 'en')}</p>
                )}
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border-2 border-slate-300 disabled:opacity-40 hover:border-gov-navy"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-bold text-slate-600">{tr('Page', 'पृष्ठ')} {page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border-2 border-slate-300 disabled:opacity-40 hover:border-gov-navy"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
      </>
      )}
    </div>
  );
}

const MINE_STATUS = {
  ready: { dot: '🟢', en: 'Ready to apply', hi: 'तैयार', cls: 'bg-emerald-100 text-emerald-900' },
  action_required: { dot: '🟡', en: 'Needs documents', hi: 'दस्तावेज़ चाहिए', cls: 'bg-amber-100 text-amber-900' },
  potential: { dot: '🔵', en: 'Potential', hi: 'संभावित', cls: 'bg-blue-100 text-blue-900' },
};

// "Eligible for me" — engine-evaluated curated schemes the user matches (§53).
function EligibleForMeList({ tr, onOpenScheme }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => { getEligibilityDashboard().then(setData).catch(() => setError(true)); }, []);

  if (error) return <p className="text-center text-slate-500 py-10">{tr('Could not load your eligible schemes right now.', 'आपकी पात्र योजनाएँ अभी लोड नहीं हो सकीं।')}</p>;
  if (!data) return <div className="flex items-center gap-2 justify-center py-10 text-slate-500 font-semibold"><Loader2 className="w-5 h-5 animate-spin" /> {tr('Checking your eligibility…', 'आपकी पात्रता जाँची जा रही है…')}</div>;

  const claimable = data.schemes.filter((s) => ['ready', 'action_required', 'potential'].includes(s.bucket));
  if (!claimable.length) return <p className="text-center text-slate-500 py-10">{tr('No matching schemes yet — complete your profile to see more.', 'अभी कोई मिलती योजना नहीं — अधिक देखने के लिए अपनी प्रोफ़ाइल पूरी करें।')}</p>;

  return (
    <div className="space-y-3">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-start gap-2 text-emerald-950">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-700" />
        <p className="text-sm font-semibold">{tr('These are checked against your profile and each scheme’s published criteria. Final eligibility is decided by the government department.', 'ये आपकी प्रोफ़ाइल और प्रत्येक योजना के प्रकाशित मानदंडों के आधार पर जाँची गई हैं। अंतिम पात्रता सरकारी विभाग तय करता है।')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {claimable.map((s) => {
          const meta = MINE_STATUS[s.bucket];
          return (
            <button key={s.scheme_id} onClick={() => onOpenScheme(s.scheme_id)} className="gov-card p-4 text-left hover:shadow-md hover:border-gov-saffron transition space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="font-extrabold text-gov-navy leading-snug">{tr(s.name, s.name_hi)}</div>
                <span className={`shrink-0 text-[10px] font-extrabold uppercase rounded px-1.5 py-0.5 ${meta.cls}`}>{meta.dot} {tr(meta.en, meta.hi)}</span>
              </div>
              {s.benefit_label_en && <div className="text-sm font-bold text-emerald-700">{s.benefit_label_en}</div>}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {s.match_score}% {tr('eligibility match', 'पात्रता मिलान')}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
