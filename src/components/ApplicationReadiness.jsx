import React, { useEffect, useState } from 'react';
import {
  CheckCircle2, AlertTriangle, XCircle, HelpCircle, FileText, ExternalLink,
  MapPin, Loader2, ShieldCheck, ListChecks, Info,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { getReadinessReport, findNearbyPartners, markDocumentAvailability } from '../services/readinessService';
import { detectUserLocation } from '../services/locationService';

const RISK_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const RISK_STYLE = {
  CRITICAL: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: '🔴' },
  HIGH: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: '🟠' },
  MEDIUM: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: '🟡' },
  LOW: { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', dot: '⚪' },
};

const STATUS_ICON = {
  READY: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
  UPLOADED: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
  VERIFICATION_REQUIRED: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
  MISSING: <XCircle className="w-4 h-4 text-red-600 shrink-0" />,
  EXPIRED: <XCircle className="w-4 h-4 text-red-600 shrink-0" />,
  CONDITIONAL: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
  UNKNOWN: <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />,
};

// Renders inline in the scheme detail page — no button/click needed. It
// fetches and shows the readiness report as soon as the scheme is known, so
// what's ready and what's missing is visible immediately.
export default function ApplicationReadiness({ scheme }) {
  const { tr, lang } = useI18n();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState(null);
  const [showNearby, setShowNearby] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setErrorCode(null);
    getReadinessReport(scheme.id, lang === 'en' ? 'en' : 'hi')
      .then((r) => { if (active) setReport(r); })
      .catch((e) => {
        if (!active) return;
        setError(e.message || tr('Could not load the readiness report.', 'तैयारी रिपोर्ट लोड नहीं हो सकी।'));
        setErrorCode(e.code || null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheme.id, lang]);

  const markPhysical = async (documentType) => {
    try {
      await markDocumentAvailability(documentType, 'available_physical');
      // Re-fetch so the readiness score reflects the update.
      const r = await getReadinessReport(scheme.id, lang === 'en' ? 'en' : 'hi');
      setReport(r);
    } catch { /* soft-fail, non-critical */ }
  };

  return (
    <div className="space-y-6">
      {loading && (
        <div className="flex items-center gap-2 text-slate-600 font-semibold py-10 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> {tr('Analyzing your profile against this scheme…', 'आपकी प्रोफ़ाइल का इस योजना से मिलान किया जा रहा है…')}
        </div>
      )}

      {!loading && error && errorCode === 'REQUIREMENTS_NOT_AVAILABLE' && (
        <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3.5">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
          <span>{tr('SchemeSetu hasn’t mapped this scheme’s exact document checklist yet, so a readiness score isn’t available here. Check the official portal (below) for its full eligibility and document requirements.', 'SchemeSetu ने अभी इस योजना की सटीक दस्तावेज़ सूची तैयार नहीं की है, इसलिए यहाँ तैयारी स्कोर उपलब्ध नहीं है। पूर्ण पात्रता व दस्तावेज़ आवश्यकताओं के लिए कृपया नीचे दिए गए आधिकारिक पोर्टल पर देखें।')}</span>
        </div>
      )}

      {!loading && error && errorCode !== 'REQUIREMENTS_NOT_AVAILABLE' && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {!loading && report && (
        <ReadinessBody report={report} tr={tr} onMarkPhysical={markPhysical}
          showNearby={showNearby} onOpenNearby={() => setShowNearby(true)} onCloseNearby={() => setShowNearby(false)} />
      )}
    </div>
  );
}

function ReadinessBody({ report, tr, onMarkPhysical, showNearby, onOpenNearby, onCloseNearby }) {
  const { eligibility, readiness, results, missing_by_priority: missingByPriority, category_specific: categorySpecific, explanation } = report;

  const applicableResults = results.filter((r) => r.applies);
  const readyResults = applicableResults.filter((r) => r.status === 'READY' || r.status === 'UPLOADED');

  const eligibilityLabel = {
    ELIGIBLE: { text: tr('You appear eligible', 'आप पात्र प्रतीत होते हैं'), color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', Icon: CheckCircle2 },
    NOT_ELIGIBLE: { text: tr('You do not appear to meet basic eligibility', 'आप बुनियादी पात्रता को पूरा नहीं करते प्रतीत होते'), color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', Icon: XCircle },
    UNKNOWN: { text: tr('SchemeSetu could not fully determine your eligibility', 'SchemeSetu आपकी पात्रता पूरी तरह निर्धारित नहीं कर सका'), color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', Icon: HelpCircle },
  }[eligibility.status] || {};

  return (
    <>
      {/* ELIGIBILITY — kept strictly separate from readiness */}
      <section className={`border ${eligibilityLabel.border} ${eligibilityLabel.bg} rounded-md p-4`}>
        <div className="flex items-center gap-2">
          <eligibilityLabel.Icon className={`w-5 h-5 ${eligibilityLabel.color}`} />
          <h3 className={`text-base font-black ${eligibilityLabel.color}`}>{tr('Eligibility Status', 'पात्रता स्थिति')}</h3>
        </div>
        <p className={`mt-1.5 text-sm font-semibold ${eligibilityLabel.color}`}>{eligibilityLabel.text}</p>
        {eligibility.failedChecks?.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {eligibility.failedChecks.map((c) => <li key={c.requirement_key}>• {c.requirement_name}</li>)}
          </ul>
        )}
      </section>

      {/* APPLICATION READINESS SCORE — with the real applicable/satisfied counts */}
      <section>
        <h3 className="text-base font-black text-gov-navy flex items-center gap-2"><ListChecks className="w-5 h-5" />{tr('Application Readiness', 'आवेदन तैयारी')}</h3>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-black text-gov-navy">{readiness.score}%</span>
          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gov-navy rounded-full transition-all" style={{ width: `${readiness.score}%` }} />
          </div>
        </div>
        {readiness.applicable_count !== undefined && (
          <p className="mt-1.5 text-sm font-bold text-slate-600">
            {readiness.satisfied_count} {tr('of', 'में से')} {readiness.applicable_count} {tr('applicable requirements satisfied', 'लागू आवश्यकताएँ पूरी')}
            {readiness.conditional_count > 0 && ` · ${readiness.conditional_count} ${tr('need info', 'जानकारी चाहिए')}`}
            {readiness.not_applicable_count > 0 && ` · ${readiness.not_applicable_count} ${tr('not applicable', 'लागू नहीं')}`}
          </p>
        )}
        {explanation?.summary && <p className="mt-2.5 text-sm text-slate-700 leading-relaxed">{explanation.summary}</p>}
      </section>

      {/* COMPLETE REQUIREMENT CHECKLIST — every requirement, grouped, each with
          its own individual status (§8/§16/§17). Never sliced or collapsed. */}
      {Array.isArray(report.grouped_requirements) && report.grouped_requirements.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wide">{tr('Your application requirements', 'आपकी आवेदन आवश्यकताएँ')}</h3>
          {report.grouped_requirements.map(({ category, items }) => (
            <div key={category}>
              <h4 className="text-xs font-black text-gov-navy uppercase tracking-wider mb-1.5">{tr(category, category)}</h4>
              <div className="border border-slate-200 rounded-md divide-y divide-slate-100">
                {items.map((r) => <RequirementRow key={r.requirement_key} r={r} tr={tr} onMarkPhysical={onMarkPhysical} />)}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* NEXT STEPS */}
      {explanation?.next_steps?.length > 0 && (
        <section>
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wide mb-2">{tr('Next Steps', 'अगले कदम')}</h3>
          <ol className="space-y-1.5">
            {explanation.next_steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-slate-800">
                <span className="w-5 h-5 rounded-full bg-gov-navy text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {report.explanation_error === 'GROQ_NOT_CONFIGURED' && (
        <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md p-3">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {tr('Plain-language explanations are unavailable right now — the structured results above are still accurate.', 'सरल भाषा में स्पष्टीकरण अभी उपलब्ध नहीं है — ऊपर दिए गए संरचित परिणाम अभी भी सटीक हैं।')}
        </div>
      )}

      {/* FIND HELP NEAR ME */}
      <section className="border-t border-slate-200 pt-4">
        {!showNearby ? (
          <button onClick={onOpenNearby}
            className="w-full bg-gov-navy hover:bg-[#083d71] text-white rounded-md py-3 px-4 font-extrabold flex items-center justify-center gap-2">
            <MapPin className="w-5 h-5" /> {tr('Find an Application Assistance Center', 'आवेदन सहायता केंद्र खोजें')} →
          </button>
        ) : (
          <NearbyAssistance tr={tr} onClose={onCloseNearby} />
        )}
      </section>
    </>
  );
}

// One requirement row in the complete grouped checklist. Every requirement is
// rendered with its own individual status — satisfied (incl. via an accepted
// alternative), missing, not-applicable (with reason), conditional (asks a
// question), or pending verification. Document requirements offer "I have this".
const REQ_STATUS = {
  READY: { Icon: CheckCircle2, color: 'text-emerald-600', label_en: 'Available', label_hi: 'उपलब्ध' },
  UPLOADED: { Icon: CheckCircle2, color: 'text-emerald-600', label_en: 'Available', label_hi: 'उपलब्ध' },
  ALTERNATIVE_SATISFIED: { Icon: CheckCircle2, color: 'text-emerald-600', label_en: 'Available', label_hi: 'उपलब्ध' },
  VERIFICATION_REQUIRED: { Icon: AlertTriangle, color: 'text-amber-600', label_en: 'Uploaded — pending', label_hi: 'अपलोड — लंबित' },
  MISSING: { Icon: XCircle, color: 'text-red-500', label_en: 'Missing', label_hi: 'नहीं है' },
  EXPIRED: { Icon: XCircle, color: 'text-red-500', label_en: 'Expired', label_hi: 'समाप्त' },
  NOT_APPLICABLE: { Icon: Info, color: 'text-slate-400', label_en: 'Not applicable', label_hi: 'लागू नहीं' },
  CONDITIONAL: { Icon: HelpCircle, color: 'text-blue-500', label_en: 'Needs info', label_hi: 'जानकारी चाहिए' },
  UNKNOWN: { Icon: HelpCircle, color: 'text-slate-400', label_en: 'Unknown', label_hi: 'अज्ञात' },
};
const NON_DOC = ['eligibility', 'personal_information', 'application_specific'];

function RequirementRow({ r, tr, onMarkPhysical }) {
  const meta = REQ_STATUS[r.status] || REQ_STATUS.UNKNOWN;
  const isDoc = !NON_DOC.includes(r.requirement_type);
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-2.5">
      <meta.Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta.color}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm font-semibold ${r.status === 'NOT_APPLICABLE' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
            {r.requirement_name}
            {!r.mandatory && <span className="ml-1.5 text-[10px] font-bold uppercase text-slate-400">{tr('optional', 'वैकल्पिक')}</span>}
          </span>
          <span className={`text-[11px] font-bold uppercase shrink-0 ${meta.color}`}>{tr(meta.label_en, meta.label_hi)}</span>
        </div>

        {r.status === 'ALTERNATIVE_SATISFIED' && r.satisfied_by && (
          <p className="text-xs text-emerald-700 mt-0.5">{tr(`Satisfied by ${r.satisfied_by}`, `${r.satisfied_by} द्वारा पूरा`)}</p>
        )}
        {r.accepted_alternatives?.length > 0 && r.status !== 'ALTERNATIVE_SATISFIED' && (
          <p className="text-[11px] text-slate-400 mt-0.5">{tr('Accepted: ', 'स्वीकार्य: ')}{r.accepted_alternatives.join(' / ')}</p>
        )}
        {r.status === 'NOT_APPLICABLE' && r.not_applicable_reason && (
          <p className="text-xs text-slate-400 mt-0.5">{tr(r.not_applicable_reason, r.not_applicable_reason)}</p>
        )}
        {r.status === 'CONDITIONAL' && r.condition_question && (
          <p className="text-xs text-blue-600 mt-0.5">{tr(r.condition_question, r.condition_question)}</p>
        )}
        {r.description && r.status !== 'NOT_APPLICABLE' && (
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{tr(r.description, r.description)}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          {isDoc && (r.status === 'MISSING' || r.status === 'EXPIRED') && (
            <button onClick={() => onMarkPhysical(r.requirement_key)} className="text-[11px] font-bold text-gov-navy hover:underline">
              {tr('I have this', 'मेरे पास है')}
            </button>
          )}
          {r.source_url && (
            <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-slate-400 hover:text-gov-navy inline-flex items-center gap-0.5">
              {tr('Why is this required?', 'यह क्यों आवश्यक है?')} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function SourceLine({ item, tr }) {
  if (!item.source_name) return null;
  return (
    <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
      {tr('Requirement source', 'आवश्यकता स्रोत')}: <span className="font-semibold">{item.source_name}</span>
      {item.source_url && (
        <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-gov-navy font-bold inline-flex items-center gap-0.5 hover:underline">
          {tr('View source', 'स्रोत देखें')} <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </p>
  );
}

const CENTER_TYPE_LABEL = {
  'CSC': { en: 'Common Service Centre (CSC)', hi: 'सामान्य सेवा केंद्र (CSC)' },
  'Jan Seva Kendra': { en: 'Jan Seva Kendra', hi: 'जन सेवा केंद्र' },
  'SchemeSetu Partner': { en: 'SchemeSetu Partner', hi: 'SchemeSetu पार्टनर' },
  'Government Service Center': { en: 'Government Service Center', hi: 'सरकारी सेवा केंद्र' },
  'Private Assistance Center': { en: 'Private Assistance Center', hi: 'निजी सहायता केंद्र' },
};

const VERIFICATION_LABEL = {
  verified: { en: 'Verified', hi: 'सत्यापित', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  unverified: { en: 'Unverified', hi: 'असत्यापित', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  unknown: { en: 'Verification unknown', hi: 'सत्यापन अज्ञात', color: 'text-slate-500 bg-slate-50 border-slate-200' },
};

function NearbyAssistance({ tr, onClose }) {
  const [status, setStatus] = useState('loading'); // loading | done | error
  const [centers, setCenters] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loc = await detectUserLocation().catch(() => null);
        const params = loc?.lat ? { lat: loc.lat, lon: loc.lon } : { state: loc?.state };
        const r = await findNearbyPartners(params);
        if (active) { setCenters(r.centers || []); setStatus('done'); }
      } catch (e) {
        if (active) { setErrorMsg(e.message); setStatus('error'); }
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-black text-gov-navy">{tr('Nearby Assistance', 'नज़दीकी सहायता')}</h4>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">{tr('Hide', 'छिपाएँ')}</button>
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-4 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> {tr('Searching…', 'खोजा जा रहा है…')}</div>
      )}
      {status === 'error' && <p className="text-sm text-red-600">{errorMsg}</p>}
      {status === 'done' && centers.length === 0 && (
        <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3.5">
          {tr('SchemeSetu does not have a verified assistance center listed near you yet. You can visit your nearest government-recognised CSC or Jan Seva Kendra to complete your application.', 'SchemeSetu के पास आपके पास अभी तक कोई सत्यापित सहायता केंद्र सूचीबद्ध नहीं है। आप अपना आवेदन पूरा करने के लिए निकटतम सरकारी मान्यता प्राप्त CSC या जन सेवा केंद्र पर जा सकते हैं।')}
        </div>
      )}
      {status === 'done' && centers.length > 0 && (
        <ul className="space-y-2">
          {centers.map((c) => {
            const typeLabel = CENTER_TYPE_LABEL[c.center_type] || { en: c.center_type, hi: c.center_type };
            const verLabel = VERIFICATION_LABEL[c.verification_status] || VERIFICATION_LABEL.unknown;
            return (
              <li key={c.id} className="border border-slate-200 rounded-md p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                    <div className="text-xs text-slate-500">{tr(typeLabel.en, typeLabel.hi)}</div>
                  </div>
                  {c.distance_km != null && <span className="text-xs font-bold text-slate-600 shrink-0">{c.distance_km} km</span>}
                </div>
                <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase border rounded px-1.5 py-0.5 ${verLabel.color}`}>
                  {tr(verLabel.en, verLabel.hi)}{c.government_affiliation ? ` · ${c.government_affiliation}` : ''}
                </span>
                {c.address && <p className="mt-1.5 text-xs text-slate-600">{c.address}</p>}
                {c.phone && <p className="mt-0.5 text-xs text-slate-500">{tr('Phone', 'फ़ोन')}: {c.phone}</p>}
                {c.opening_hours && <p className="mt-0.5 text-xs text-slate-500">{c.opening_hours}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
