import React, { useEffect, useState, useCallback } from 'react';
import {
  X, ShieldCheck, Loader2, CheckCircle2, Circle, KeyRound, FileText, PenLine,
  AlertTriangle, RefreshCw, ExternalLink, Clock, Activity,
} from 'lucide-react';
import { useI18n } from '../i18n';
import {
  startJourney, provideJourneyInput, checkJourneyStatus, getJourneyEvents,
} from '../services/journeyService';

// Journey milestones shown to the user (§20).
const MILESTONES = [
  ['eligible', 'Eligibility confirmed', 'पात्रता की पुष्टि'],
  ['profile', 'Profile information ready', 'प्रोफ़ाइल जानकारी तैयार'],
  ['registration', 'Portal registration', 'पोर्टल पंजीकरण'],
  ['otp', 'OTP verification', 'ओटीपी सत्यापन'],
  ['form', 'Application form', 'आवेदन फॉर्म'],
  ['documents', 'Documents', 'दस्तावेज़'],
  ['review', 'Review', 'समीक्षा'],
  ['submitted', 'Submitted', 'जमा किया गया'],
  ['tracking', 'Status tracking', 'स्थिति ट्रैकिंग'],
];

// Highest milestone index reached for a given state.
const STATE_MILESTONE = {
  DISCOVERED: 0, ELIGIBLE: 1, REGISTRATION_REQUIRED: 2, REGISTERING: 2,
  LOGIN_REQUIRED: 2, LOGGING_IN: 2, OTP_REQUIRED: 3, ACCOUNT_CREATED: 4,
  AUTHENTICATED: 4, FORM_FILLING: 4, USER_INPUT_REQUIRED: 4,
  DOCUMENT_REQUIRED: 5, DOCUMENT_UPLOADING: 5, READY_FOR_REVIEW: 6, USER_REVIEW: 6,
  SUBMITTING: 7, SUBMITTED: 7, UNDER_REVIEW: 8, APPROVED: 8, REJECTED: 8,
  FAILED: 0, PAUSED: 0,
};

const TERMINAL = new Set(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']);

function statusLabel(status, tr) {
  switch (status) {
    case 'SUBMITTED': return tr('Submitted', 'जमा किया गया');
    case 'UNDER_REVIEW': return tr('Under review', 'समीक्षाधीन');
    case 'DOCUMENT_VERIFICATION': return tr('Document verification', 'दस्तावेज़ सत्यापन');
    case 'APPROVED': return tr('Approved', 'स्वीकृत');
    case 'REJECTED': return tr('Rejected', 'अस्वीकृत');
    default: return status || '';
  }
}

export default function ApplicationJourney({ scheme, onClose }) {
  const { tr } = useI18n();
  const [app, setApp] = useState(null);
  const [meta, setMeta] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [consent, setConsent] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const refreshEvents = useCallback(async (id) => {
    try { const r = await getJourneyEvents(id); setEvents(r.events || []); } catch { /* soft */ }
  }, []);

  // Start (or resume) the journey on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await startJourney({ id: scheme.id, name: scheme.name, type: scheme.type, student_type: scheme.student_type });
        if (!active) return;
        setApp(r.application); setMeta(r.meta);
        refreshEvents(r.application.id);
      } catch (e) {
        if (active) setError(e.message || tr('Could not start the application.', 'आवेदन शुरू नहीं हो सका।'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [scheme, refreshEvents, tr]);

  const pending = app?.pending_input;
  const reached = STATE_MILESTONE[app?.state] ?? 0;

  const submitValue = async (value) => {
    if (!app || busy) return;
    setBusy(true); setError(null);
    try {
      const r = await provideJourneyInput(app.id, value);
      setApp(r.application);
      setInputValue(''); setConsent(false);
      refreshEvents(app.id);
    } catch (e) {
      setError(e.message || tr('Could not continue. Please try again.', 'जारी नहीं रख सके। पुनः प्रयास करें।'));
    } finally {
      setBusy(false);
    }
  };

  const runStatusCheck = async () => {
    if (!app || busy) return;
    setBusy(true); setError(null);
    try {
      const r = await checkJourneyStatus(app.id);
      setApp(r.application);
      refreshEvents(app.id);
    } catch (e) {
      setError(e.message || tr('Could not check the status.', 'स्थिति जांच नहीं सके।'));
    } finally {
      setBusy(false);
    }
  };

  const milestoneState = (i) => {
    if (app?.reference_number && i <= 7) return 'done';
    if (app?.current_status && i === 8) return 'done';
    if (i < reached) return 'done';
    if (i === reached) return 'current';
    return 'todo';
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex justify-center overflow-y-auto p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-lg sm:my-4 shadow-xl flex flex-col min-h-full sm:min-h-0">
        {/* Header */}
        <div className="sticky top-0 bg-gov-navy text-white px-5 py-4 flex items-start justify-between gap-3 sm:rounded-t-lg z-10">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gov-saffron" />
              <h2 className="text-lg font-black leading-tight">{tr('Guided application', 'निर्देशित आवेदन')}</h2>
            </div>
            <p className="text-sm text-slate-200 font-semibold mt-0.5">{tr(scheme.name, scheme.name_hi || scheme.name)}</p>
            {app && (
              <span className="inline-block mt-2 text-[11px] font-bold uppercase tracking-wide bg-amber-400 text-amber-950 px-2 py-0.5 rounded">
                {tr('Demo integration', 'डेमो एकीकरण')}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded" aria-label={tr('Close', 'बंद करें')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Honesty note: this is a demo portal, not a real government integration (§22). */}
          {meta?.real_portal && (
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3 leading-relaxed">
              {tr(
                `This is a working demonstration of the end-to-end application flow on a mock portal. Live automation of ${meta.real_portal.name} is not available yet — use the official website to apply for real.`,
                `यह मॉक पोर्टल पर संपूर्ण आवेदन प्रक्रिया का कार्यशील प्रदर्शन है। ${meta.real_portal.name} का वास्तविक स्वचालन अभी उपलब्ध नहीं है — वास्तविक आवेदन के लिए आधिकारिक वेबसाइट का उपयोग करें।`
              )}
              {meta.real_portal.official_url && (
                <a href={meta.real_portal.official_url} target="_blank" rel="noopener noreferrer"
                   className="ml-1 inline-flex items-center gap-1 text-gov-navy font-bold hover:underline">
                  {tr('Official site', 'आधिकारिक साइट')} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-slate-600 font-semibold py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> {tr('Preparing your application…', 'आपका आवेदन तैयार किया जा रहा है…')}
            </div>
          )}

          {!loading && app && (
            <>
              {/* Milestone checklist (§20) */}
              <ol className="space-y-2">
                {MILESTONES.map(([key, en, hi], i) => {
                  const st = milestoneState(i);
                  return (
                    <li key={key} className="flex items-center gap-3">
                      {st === 'done'
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        : st === 'current'
                          ? <Loader2 className="w-5 h-5 text-gov-saffron animate-spin shrink-0" />
                          : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
                      <span className={`text-sm font-semibold ${st === 'todo' ? 'text-slate-400' : 'text-slate-800'}`}>
                        {tr(en, hi)}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
                </div>
              )}

              {/* Active step */}
              {pending && !TERMINAL.has(app.state) && (
                <PendingStep
                  pending={pending} tr={tr} busy={busy}
                  value={inputValue} setValue={setInputValue}
                  consent={consent} setConsent={setConsent}
                  onSubmit={submitValue}
                />
              )}

              {/* Submitted / tracking panel */}
              {TERMINAL.has(app.state) && (
                <SubmittedPanel app={app} tr={tr} busy={busy} onCheck={runStatusCheck} />
              )}

              {app.state === 'FAILED' && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                  {tr('The guided application could not be completed. Please try the official website.', 'निर्देशित आवेदन पूरा नहीं हो सका। कृपया आधिकारिक वेबसाइट का उपयोग करें।')}
                </div>
              )}

              {/* Activity log (§19) */}
              <div className="border-t border-slate-200 pt-4">
                <button onClick={() => setShowLog((s) => !s)} className="flex items-center gap-2 text-sm font-bold text-gov-navy">
                  <Activity className="w-4 h-4" /> {tr('Activity log', 'गतिविधि लॉग')} ({events.length})
                </button>
                {showLog && (
                  <ul className="mt-3 space-y-1.5">
                    {events.map((e, i) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-2">
                        <span className="text-slate-400 shrink-0">{new Date(e.created_at).toLocaleTimeString()}</span>
                        <span className="font-semibold">{e.detail || e.event}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {!loading && !app && error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- one pending human-input step -----------------------------------------
function PendingStep({ pending, tr, busy, value, setValue, consent, setConsent, onSubmit }) {
  const type = pending.type;
  const title = tr(pending.title, pending.title_hi || pending.title);
  const message = tr(pending.message, pending.message_hi || pending.message);

  const Wrap = ({ icon: Icon, children }) => (
    <div className="border-2 border-gov-saffron/60 bg-[#fffaf2] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5 text-gov-saffron" />
        <h3 className="text-base font-black text-gov-navy">{title}</h3>
      </div>
      <p className="text-sm text-slate-700 mb-4 leading-relaxed">{message}</p>
      {children}
    </div>
  );

  if (type === 'OTP') {
    return (
      <Wrap icon={KeyRound}>
        <input
          inputMode="numeric" autoComplete="one-time-code" maxLength={8}
          value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
          placeholder={tr('Enter OTP', 'ओटीपी दर्ज करें')}
          className="w-full sm:w-48 tracking-[0.4em] text-center text-lg font-bold border border-slate-300 rounded-md py-2.5 px-3 mb-2"
        />
        <p className="text-[11px] text-slate-500 mb-3">{tr('This code is used only for this step and is never stored.', 'यह कोड केवल इसी चरण के लिए उपयोग होता है और कभी संग्रहीत नहीं किया जाता।')}</p>
        <ContinueBtn tr={tr} busy={busy} disabled={value.length < 4} onClick={() => onSubmit(value)} />
      </Wrap>
    );
  }

  if (type === 'TEXT' || type === 'NUMBER') {
    return (
      <Wrap icon={PenLine}>
        <input
          inputMode={type === 'NUMBER' ? 'numeric' : 'text'}
          value={value} onChange={(e) => setValue(e.target.value)}
          placeholder={tr(pending.label || 'Enter value', pending.label_hi || 'मान दर्ज करें')}
          className="w-full border border-slate-300 rounded-md py-2.5 px-3 mb-3"
        />
        <ContinueBtn tr={tr} busy={busy} disabled={!value.trim()} onClick={() => onSubmit(value)} />
      </Wrap>
    );
  }

  if (type === 'DOCUMENT') {
    return (
      <Wrap icon={FileText}>
        <p className="text-xs text-slate-500 mb-3">{tr('No matching document was found in your vault for this demo. In a real portal you would attach it here.', 'इस डेमो के लिए आपके वॉल्ट में कोई मिलान दस्तावेज़ नहीं मिला। वास्तविक पोर्टल में आप इसे यहाँ संलग्न करते।')}</p>
        <ContinueBtn tr={tr} busy={busy} label={tr('Mark as attached', 'संलग्न के रूप में चिह्नित करें')} onClick={() => onSubmit('attached')} />
      </Wrap>
    );
  }

  if (type === 'CAPTCHA') {
    return (
      <Wrap icon={ShieldCheck}>
        <p className="text-xs text-slate-500 mb-3">{tr('Complete the verification on the portal, then continue. SchemeSetu never bypasses CAPTCHA.', 'पोर्टल पर सत्यापन पूरा करें, फिर जारी रखें। SchemeSetu कभी CAPTCHA बायपास नहीं करता।')}</p>
        <ContinueBtn tr={tr} busy={busy} label={tr('I have completed it', 'मैंने इसे पूरा कर लिया')} onClick={() => onSubmit('completed')} />
      </Wrap>
    );
  }

  if (type === 'CONSENT') {
    return (
      <Wrap icon={ShieldCheck}>
        {Array.isArray(pending.summary) && pending.summary.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-100 mb-4">
            {pending.summary.map((row) => (
              <div key={row.key} className="flex justify-between gap-3 px-3 py-2 text-sm">
                <span className="text-slate-500 font-semibold">{tr(row.label, row.label_hi || row.label)}</span>
                <span className="text-slate-900 font-bold text-right break-all">{String(row.value)}</span>
              </div>
            ))}
          </div>
        )}
        <label className="flex items-start gap-2 text-sm text-slate-800 font-semibold mb-3 cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span>{message}</span>
        </label>
        <ContinueBtn tr={tr} busy={busy} disabled={!consent} label={tr('Submit application', 'आवेदन जमा करें')} onClick={() => onSubmit(true)} />
      </Wrap>
    );
  }

  if (type === 'YES_NO') {
    return (
      <Wrap icon={PenLine}>
        <div className="flex gap-3">
          <button disabled={busy} onClick={() => onSubmit(true)} className="bg-gov-navy text-white rounded-md py-2.5 px-5 font-bold">{tr('Yes', 'हाँ')}</button>
          <button disabled={busy} onClick={() => onSubmit(false)} className="border border-slate-300 rounded-md py-2.5 px-5 font-bold">{tr('No', 'नहीं')}</button>
        </div>
      </Wrap>
    );
  }

  return null;
}

function ContinueBtn({ tr, busy, disabled, onClick, label }) {
  return (
    <button
      onClick={onClick} disabled={busy || disabled}
      className="bg-gov-saffron hover:bg-orange-700 disabled:opacity-50 text-white rounded-md py-2.5 px-5 font-extrabold inline-flex items-center gap-2">
      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
      {label || tr('Continue', 'जारी रखें')}
    </button>
  );
}

// ---- submitted + status tracking ------------------------------------------
function SubmittedPanel({ app, tr, busy, onCheck }) {
  const approved = app.current_status === 'APPROVED';
  const rejected = app.current_status === 'REJECTED';
  return (
    <div className={`rounded-lg p-5 border ${approved ? 'bg-emerald-50 border-emerald-200' : rejected ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className={`w-6 h-6 ${approved ? 'text-emerald-600' : rejected ? 'text-red-600' : 'text-blue-700'}`} />
        <h3 className="text-lg font-black text-gov-navy">{tr('Application submitted', 'आवेदन जमा किया गया')}</h3>
      </div>
      {app.reference_number && (
        <p className="text-sm text-slate-700 mb-1">
          {tr('Reference number', 'संदर्भ संख्या')}: <span className="font-mono font-bold">{app.reference_number}</span>
        </p>
      )}
      <p className="text-sm text-slate-700 mb-1">
        {tr('Current status', 'वर्तमान स्थिति')}: <span className="font-bold">{statusLabel(app.current_status, tr)}</span>
      </p>
      {app.last_status_check && (
        <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
          <Clock className="w-3 h-3" /> {tr('Last checked', 'अंतिम जांच')}: {new Date(app.last_status_check).toLocaleString()}
        </p>
      )}
      <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold mb-4">
        <ShieldCheck className="w-4 h-4" />
        {tr('Automatic status tracking enabled (reference lookup — no login needed).', 'स्वचालित स्थिति ट्रैकिंग सक्षम (संदर्भ लुकअप — लॉगिन आवश्यक नहीं)।')}
      </div>
      {!approved && !rejected && (
        <button onClick={onCheck} disabled={busy}
          className="bg-gov-navy hover:bg-[#083d71] disabled:opacity-50 text-white rounded-md py-2.5 px-5 font-bold inline-flex items-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {tr('Check status now', 'अभी स्थिति जांचें')}
        </button>
      )}
    </div>
  );
}
