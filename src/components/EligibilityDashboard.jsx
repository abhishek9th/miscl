import React, { useEffect, useState } from 'react';
import {
  CheckCircle2, AlertTriangle, HelpCircle, XCircle, ArrowRight, ShieldCheck,
  Loader2, ClipboardCheck, FileWarning, Sparkles, ChevronRight, ChevronDown, UserCog, Ban, ArrowLeft,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { getEligibilityDashboard } from '../services/eligibilityService';
import DocumentVault from './DocumentVault';
import ComparisonModal from './ComparisonModal';

const SNAPSHOT_KEY = 'schemesetu_elig_snapshot_v1';

// Compare the freshly-computed buckets against the last time this browser saw
// them, so we can surface "N new schemes unlocked" after a profile/document
// change (§26/§27). Returns { newlyClaimable, newlyReady } or null on first run.
function diffSnapshot(schemes) {
  const claimable = schemes.filter((s) => ['ready', 'action_required', 'potential'].includes(s.bucket)).map((s) => s.scheme_id);
  const ready = schemes.filter((s) => s.bucket === 'ready').map((s) => s.scheme_id);
  let prev = null;
  try { prev = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || 'null'); } catch { /* ignore */ }
  try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ claimable, ready })); } catch { /* ignore */ }
  if (!prev) return null;
  const newlyClaimable = claimable.filter((id) => !prev.claimable.includes(id));
  const newlyReady = ready.filter((id) => !prev.ready.includes(id) && prev.claimable.includes(id));
  return { newlyClaimable: newlyClaimable.length, newlyReady: newlyReady.length };
}

// Proactive "what can I claim now?" dashboard — shown at the top of the home
// screen for signed-in users. Every number here comes from the deterministic
// backend engine (structured eligibility + document readiness); nothing is
// AI-decided. The government department remains the final authority, stated
// plainly in the UI (§5).
export default function EligibilityDashboard({ variant = 'full', onOpenScheme, onOpenProfile, onSeeMore, onBack }) {
  const { tr, lang } = useI18n();
  const isSummary = variant === 'summary';
  const [data, setData] = useState(null); // null = loading
  const [error, setError] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [changeImpact, setChangeImpact] = useState(null); // { newlyClaimable, newlyReady }

  useEffect(() => {
    let active = true;
    getEligibilityDashboard()
      .then((d) => {
        if (!active) return;
        setData(d);
        // Only diff (and consume the snapshot) on the full page, so the
        // "new schemes unlocked" banner is seen where the schemes are shown.
        if (!isSummary) {
          const diff = diffSnapshot(d.schemes);
          if (diff && (diff.newlyClaimable > 0 || diff.newlyReady > 0)) setChangeImpact(diff);
        }
      })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return null; // silent — the rest of the home screen still works
  if (data === null) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className={`flex items-center gap-2 text-slate-500 font-semibold justify-center border border-slate-200 rounded-lg bg-white ${isSummary ? 'py-5' : 'py-8'}`}>
          <Loader2 className="w-5 h-5 animate-spin" /> {tr('Checking which schemes you can claim…', 'जाँचा जा रहा है कि आप कौन सी योजनाएँ प्राप्त कर सकते हैं…')}
        </div>
      </div>
    );
  }

  const { summary, schemes, completeness, user_name: userName } = data;
  const claimable = schemes.filter((s) => ['ready', 'action_required', 'potential'].includes(s.bucket));
  const conflictSchemes = schemes.filter((s) => s.bucket === 'conflict');
  const notEligible = schemes.filter((s) => s.bucket === 'not_eligible');

  // Nothing structured matched — don't show an empty hero, just a gentle nudge.
  if (claimable.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="border border-slate-200 rounded-lg bg-white p-5 flex items-start gap-3">
          <UserCog className="w-6 h-6 text-gov-navy shrink-0" />
          <div>
            <h2 className="font-black text-gov-navy">{tr('Complete your profile to see schemes you can claim', 'आप जो योजनाएँ प्राप्त कर सकते हैं उन्हें देखने के लिए अपनी प्रोफ़ाइल पूरी करें')}</h2>
            <p className="text-sm text-slate-600 mt-1">{tr('Add your income, category and state so SchemeSetu can check your eligibility automatically.', 'अपनी आय, श्रेणी और राज्य जोड़ें ताकि SchemeSetu स्वतः आपकी पात्रता जाँच सके।')}</p>
            <button onClick={onOpenProfile} className="mt-3 text-gov-navy font-extrabold text-sm hover:underline inline-flex items-center gap-1">
              {tr('Complete profile', 'प्रोफ़ाइल पूरी करें')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUMMARY VARIANT — the compact box shown on the home page. Just the headline,
  // benefit ceiling and status counts, plus a "See more" that opens the full
  // claimable list on its own page. Schemes are NOT listed here.
  if (isSummary) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 font-sans">
        <section className="bg-white border border-slate-200 overflow-hidden">
          <div className="bg-[#0b2341] text-white px-5 sm:px-7 py-6">
            <h2 className="text-xl sm:text-2xl font-black leading-tight">
              {tr(`You may be able to claim ${summary.total_matched} government scheme${summary.total_matched === 1 ? '' : 's'}`,
                 `आप ${summary.total_matched} सरकारी योजना${summary.total_matched === 1 ? '' : 'एँ'} प्राप्त कर सकते हैं`)}
            </h2>
            <p className="mt-1 text-sm text-blue-100">{tr('Checked against your profile and each scheme’s published criteria.', 'आपकी प्रोफ़ाइल और हर योजना के प्रकाशित मानदंडों के आधार पर जाँचा गया।')}</p>
            {summary.max_potential_benefit > 0 && (
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-black">₹{Number(summary.max_potential_benefit).toLocaleString(lang === 'en' ? 'en-US' : 'en-IN')}+</div>
                <div className="text-xs text-blue-200 font-semibold">{tr('Maximum potential benefits across matching schemes (not a guaranteed total)', 'मिलती-जुलती योजनाओं में अधिकतम संभावित लाभ (गारंटीड राशि नहीं)')}</div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              {summary.ready > 0 && <span className="bg-emerald-600/90 rounded-none px-2.5 py-1">{summary.ready} {tr('ready to apply', 'आवेदन के लिए तैयार')}</span>}
              {summary.action_required > 0 && <span className="bg-amber-500/90 rounded-none px-2.5 py-1">{summary.action_required} {tr('need documents', 'दस्तावेज़ चाहिए')}</span>}
              {summary.potential > 0 && <span className="bg-blue-500/90 rounded-none px-2.5 py-1">{summary.potential} {tr('potential matches', 'संभावित')}</span>}
              {summary.already_applied > 0 && <span className="bg-white/15 rounded-none px-2.5 py-1">{summary.already_applied} {tr('already applied', 'पहले से आवेदित')}</span>}
            </div>
            <button onClick={onSeeMore} className="mt-5 inline-flex items-center bg-gov-saffron hover:bg-orange-600 text-white font-extrabold rounded-none px-5 py-2.5 text-sm transition">
              {tr('See my schemes', 'मेरी योजनाएँ देखें')}
            </button>
          </div>
          <div className="px-5 sm:px-7 py-2.5 bg-slate-50 border-t border-slate-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {tr('Eligibility is based on your profile and each scheme’s published criteria. Final eligibility is decided by the relevant government department.', 'पात्रता आपकी प्रोफ़ाइल और प्रत्येक योजना के प्रकाशित मानदंडों पर आधारित है। अंतिम पात्रता संबंधित सरकारी विभाग द्वारा तय की जाती है।')}
            </p>
          </div>
        </section>
      </div>
    );
  }

  const attention = claimable.filter((s) => s.bucket === 'action_required' || s.bucket === 'potential').slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-4 space-y-5">
      {showVault && <DocumentVault onClose={() => setShowVault(false)} />}
      {showCompare && <ComparisonModal schemes={claimable} onClose={() => setShowCompare(false)} onOpenScheme={(id) => { setShowCompare(false); onOpenScheme(id); }} />}

      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-gov-navy font-extrabold hover:underline">
          <ArrowLeft className="w-5 h-5" /> {tr('Back to home', 'होम पर वापस जाएँ')}
        </button>
      )}

      {/* CHANGE IMPACT — what moved since this browser last checked (§26/§27) */}
      {changeImpact && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-start gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold text-emerald-900">
            {changeImpact.newlyClaimable > 0 && tr(`Your profile changed — ${changeImpact.newlyClaimable} new scheme${changeImpact.newlyClaimable === 1 ? '' : 's'} may now be available. `, `आपकी प्रोफ़ाइल बदली — अब ${changeImpact.newlyClaimable} नई योजना${changeImpact.newlyClaimable === 1 ? '' : 'एँ'} उपलब्ध हो सकती हैं। `)}
            {changeImpact.newlyReady > 0 && tr(`${changeImpact.newlyReady} scheme${changeImpact.newlyReady === 1 ? '' : 's'} became ready to apply.`, `${changeImpact.newlyReady} योजना${changeImpact.newlyReady === 1 ? '' : 'एँ'} आवेदन के लिए तैयार हो गईं।`)}
          </p>
        </div>
      )}

      {/* HERO — the defining message (§64) */}
      <section className="bg-white border border-slate-200 overflow-hidden">
        <div className="bg-[#0b2341] text-white px-5 sm:px-7 py-6">
          <p className="text-sm font-semibold text-blue-100">
            {userName ? tr(`Namaste, ${userName}`, `नमस्ते, ${userName}`) : tr('Namaste', 'नमस्ते')}
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black leading-tight">
            {tr(`You may be able to claim ${summary.total_matched} government scheme${summary.total_matched === 1 ? '' : 's'}`,
               `आप ${summary.total_matched} सरकारी योजना${summary.total_matched === 1 ? '' : 'एँ'} प्राप्त कर सकते हैं`)}
          </h2>
          <p className="mt-1 text-sm text-blue-100">
            {tr('Checked against your profile and each scheme’s published criteria.', 'आपकी प्रोफ़ाइल और हर योजना के प्रकाशित मानदंडों के आधार पर जाँचा गया।')}
          </p>
          {summary.max_potential_benefit > 0 && (
            <div className="mt-4">
              <div className="text-3xl font-black">₹{Number(summary.max_potential_benefit).toLocaleString(lang === 'en' ? 'en-US' : 'en-IN')}+</div>
              <div className="text-xs text-blue-200 font-semibold">{tr('Maximum potential benefits across matching schemes (not a guaranteed total)', 'मिलती-जुलती योजनाओं में अधिकतम संभावित लाभ (गारंटीड राशि नहीं)')}</div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
            {summary.ready > 0 && <span className="bg-emerald-600/90 rounded-none px-2.5 py-1">🟢 {summary.ready} {tr('ready to apply', 'आवेदन के लिए तैयार')}</span>}
            {summary.action_required > 0 && <span className="bg-amber-500/90 rounded-none px-2.5 py-1">🟡 {summary.action_required} {tr('need documents', 'दस्तावेज़ चाहिए')}</span>}
            {summary.potential > 0 && <span className="bg-blue-500/90 rounded-none px-2.5 py-1">🔵 {summary.potential} {tr('potential matches', 'संभावित')}</span>}
            {summary.already_applied > 0 && <span className="bg-white/15 rounded-none px-2.5 py-1">{summary.already_applied} {tr('already applied', 'पहले से आवेदित')}</span>}
          </div>
          <button onClick={() => setShowVault(true)} className="mt-4 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/25 rounded-md px-3 py-2 text-sm font-bold transition">
            <ClipboardCheck className="w-4 h-4" /> {tr('View my documents', 'मेरे दस्तावेज़ देखें')}
          </button>
        </div>
        <div className="px-5 sm:px-7 py-2.5 bg-slate-50 border-t border-slate-200 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {tr('Eligibility is based on the information in your profile and each scheme’s published criteria. Final eligibility is decided by the relevant government department.', 'पात्रता आपकी प्रोफ़ाइल की जानकारी और प्रत्येक योजना के प्रकाशित मानदंडों पर आधारित है। अंतिम पात्रता संबंधित सरकारी विभाग द्वारा तय की जाती है।')}
          </p>
        </div>
      </section>

      {/* NEEDS YOUR ATTENTION (§37) */}
      {attention.length > 0 && (
        <section>
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <FileWarning className="w-4 h-4" /> {tr('Needs your attention', 'आपके ध्यान की आवश्यकता')}
          </h3>
          <div className="space-y-2">
            {attention.map((s) => (
              <button key={s.scheme_id} onClick={() => onOpenScheme(s.scheme_id)}
                className={`w-full text-left rounded-lg border p-3.5 flex items-center justify-between gap-3 hover:shadow-sm transition ${s.bucket === 'action_required' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="min-w-0">
                  <div className="font-extrabold text-gov-navy truncate">{tr(s.name, s.name_hi)}</div>
                  <div className="text-xs font-semibold text-slate-600 mt-0.5">
                    {s.bucket === 'action_required'
                      ? tr(`Missing: ${s.missing.map((m) => m.name).slice(0, 2).join(', ')}`, `छूट रहा है: ${s.missing.map((m) => m.name).slice(0, 2).join(', ')}`)
                      : tr('Add more profile details to confirm eligibility', 'पात्रता की पुष्टि हेतु और प्रोफ़ाइल जानकारी जोड़ें')}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* TOP MATCHES */}
      <section>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> {tr('Schemes you can claim', 'योजनाएँ जो आप प्राप्त कर सकते हैं')}
          </h3>
          {claimable.length >= 2 && (
            <button onClick={() => setShowCompare(true)} className="text-xs font-bold text-gov-navy hover:underline shrink-0">
              {tr('Compare', 'तुलना करें')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {claimable.map((s) => <SchemeMatchCard key={s.scheme_id} scheme={s} tr={tr} onOpen={() => onOpenScheme(s.scheme_id)} />)}
        </div>
      </section>

      {/* PROFILE COMPLETENESS (§24) */}
      {completeness.percent < 100 && completeness.missing.length > 0 && (
        <section className="border border-slate-200 rounded-lg bg-white p-4 flex items-start gap-3">
          <div className="shrink-0 w-11 h-11 rounded-full bg-slate-100 text-gov-navy flex items-center justify-center font-black text-sm">{completeness.percent}%</div>
          <div className="flex-1">
            <h4 className="font-black text-gov-navy text-sm">{tr('Your profile is', 'आपकी प्रोफ़ाइल')} {completeness.percent}% {tr('complete', 'पूर्ण')}</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {tr('Adding', 'जोड़ने से')} {completeness.missing.map((m) => (lang === 'en' ? m.label_en : m.label_hi)).slice(0, 3).join(', ')} {tr('could reveal more schemes you can claim.', 'से आप और योजनाएँ प्राप्त कर सकते हैं।')}
            </p>
            <button onClick={onOpenProfile} className="mt-2 text-gov-navy font-extrabold text-sm hover:underline inline-flex items-center gap-1">
              {tr('Complete profile', 'प्रोफ़ाइल पूरी करें')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* NOT CURRENTLY CLAIMABLE — blocked by a scheme conflict (§33/§34) */}
      {conflictSchemes.length > 0 && (
        <section>
          <h3 className="text-sm font-black text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> {tr('Not currently claimable', 'अभी दावा योग्य नहीं')}
          </h3>
          <div className="space-y-2">
            {conflictSchemes.map((s) => (
              <button key={s.scheme_id} onClick={() => onOpenScheme(s.scheme_id)}
                className="w-full text-left rounded-lg border border-red-200 bg-red-50 p-3.5 flex items-center justify-between gap-3 hover:shadow-sm transition">
                <div className="min-w-0">
                  <div className="font-extrabold text-gov-navy truncate">{tr(s.name, s.name_hi)}</div>
                  <div className="text-xs font-semibold text-red-700 mt-0.5">
                    {tr(`Conflicts with ${s.conflict?.items?.[0]?.existing_scheme_name || 'a scheme you already have'}`, `${s.conflict?.items?.[0]?.existing_scheme_name || 'आपकी मौजूदा योजना'} से टकराव`)}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* NOT CURRENTLY ELIGIBLE — honest, explained, no false hope (§8) */}
      {notEligible.length > 0 && <NotEligibleSection schemes={notEligible} tr={tr} lang={lang} />}
    </div>
  );
}

const CHANGEABILITY_NOTE = {
  permanent: { en: 'This is a fixed-criterion restriction. Changing other profile details will not make you eligible.', hi: 'यह एक निश्चित-मानदंड प्रतिबंध है। अन्य प्रोफ़ाइल विवरण बदलने से आप पात्र नहीं होंगे।' },
  income: { en: 'Your income is above this scheme’s limit. This cannot be solved by uploading a document.', hi: 'आपकी आय इस योजना की सीमा से अधिक है। इसे कोई दस्तावेज़ अपलोड करके हल नहीं किया जा सकता।' },
  location: { en: 'This scheme is limited to specific states/UTs.', hi: 'यह योजना विशिष्ट राज्यों/केंद्र शासित प्रदेशों तक सीमित है।' },
};

function NotEligibleSection({ schemes, tr, lang }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  return (
    <section className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50">
        <span className="flex items-center gap-2 text-sm font-black text-slate-600"><Ban className="w-4 h-4 text-slate-400" /> {tr('Not currently eligible', 'अभी पात्र नहीं')} ({schemes.length})</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-slate-200 divide-y divide-slate-100">
          {schemes.map((s) => {
            const isOpen = expanded === s.scheme_id;
            const note = s.main_reason ? CHANGEABILITY_NOTE[s.main_reason.changeability] : null;
            return (
              <div key={s.scheme_id}>
                <button onClick={() => setExpanded(isOpen ? null : s.scheme_id)} className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-700 truncate">{tr(s.name, s.name_hi)}</div>
                    {s.main_reason && (
                      <div className="text-xs text-red-600 font-semibold mt-0.5 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 shrink-0" /> {tr(`Main reason: ${s.main_reason.label}`, `मुख्य कारण: ${tr(s.main_reason.label, s.main_reason.label)}`)}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="rounded-md border border-slate-200 overflow-hidden">
                      <table className="w-full text-xs">
                        <tbody>
                          {s.checks.map((c) => (
                            <tr key={c.key} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2 font-semibold text-slate-600">{tr(c.label, c.label_hi || c.label)}</td>
                              <td className="px-3 py-2 text-slate-500">{c.user_value || tr('Not provided', 'नहीं दिया गया')}</td>
                              <td className="px-3 py-2 text-right">{CHECK_ICON[c.status]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {note && (
                      <div className="flex items-start gap-2 text-xs bg-slate-50 border border-slate-200 rounded-md p-3 text-slate-600">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                        <span><span className="font-bold">{tr('Can this change? ', 'क्या यह बदल सकता है? ')}</span>{tr(note.en, note.hi)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const STATUS_META = {
  ready: { dot: '🟢', label_en: 'Ready to apply', label_hi: 'आवेदन के लिए तैयार', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  action_required: { dot: '🟡', label_en: 'Action required', label_hi: 'कार्रवाई आवश्यक', cls: 'text-amber-800 bg-amber-50 border-amber-200' },
  potential: { dot: '🔵', label_en: 'Potential match', label_hi: 'संभावित मिलान', cls: 'text-blue-800 bg-blue-50 border-blue-200' },
  already_applied: { dot: '✔️', label_en: 'Already applied', label_hi: 'पहले से आवेदित', cls: 'text-slate-600 bg-slate-50 border-slate-200' },
};

const CHECK_ICON = {
  MATCH: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
  NOT_RESTRICTED: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
  UNKNOWN: <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />,
  FAIL: <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />,
};

function SchemeMatchCard({ scheme, tr, onOpen }) {
  const meta = STATUS_META[scheme.bucket] || STATUS_META.potential;
  const shownChecks = scheme.checks.filter((c) => c.status !== 'NOT_RESTRICTED').concat(scheme.checks.filter((c) => c.status === 'NOT_RESTRICTED')).slice(0, 4);

  return (
    <button onClick={onOpen} className="text-left bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-gov-navy transition space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-extrabold text-gov-navy leading-snug">{tr(scheme.name, scheme.name_hi)}</div>
          {scheme.benefit_label_en && <div className="text-sm font-bold text-emerald-700 mt-0.5">{tr(scheme.benefit_label_en, scheme.benefit_label_en)}</div>}
        </div>
        <span className={`shrink-0 text-[10px] font-extrabold uppercase border rounded px-1.5 py-0.5 ${meta.cls}`}>{meta.dot} {tr(meta.label_en, meta.label_hi)}</span>
      </div>

      {/* Eligibility Match vs Application Readiness — kept distinct (§6) */}
      <div className="flex items-center gap-4 text-xs">
        <div>
          <div className="font-black text-gov-navy text-lg leading-none">{scheme.match_score}%</div>
          <div className="text-slate-500 font-semibold">{tr('Eligibility match', 'पात्रता मिलान')}</div>
        </div>
        {scheme.readiness_score !== null && (
          <div>
            <div className="font-black text-slate-700 text-lg leading-none">{scheme.readiness_score}%</div>
            <div className="text-slate-500 font-semibold">{tr('Docs ready', 'दस्तावेज़ तैयार')}</div>
          </div>
        )}
      </div>

      {/* Why (structured evidence, not "AI says so") (§7) */}
      <ul className="space-y-1">
        {shownChecks.map((c) => (
          <li key={c.key} className="flex items-center gap-1.5 text-xs text-slate-700">
            {CHECK_ICON[c.status]}
            <span className="font-semibold">{tr(c.label, c.label_hi || c.label)}</span>
            {c.user_value && <span className="text-slate-400">· {c.user_value}</span>}
          </li>
        ))}
      </ul>

      <div className="text-gov-navy font-extrabold text-sm inline-flex items-center gap-1">
        {tr('See details', 'विवरण देखें')} <ArrowRight className="w-4 h-4" />
      </div>
    </button>
  );
}
