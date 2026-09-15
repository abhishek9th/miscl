import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, Loader2, FileText, Unlock, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n';
import { getDocumentVault } from '../services/documentVaultService';
import { markDocumentAvailability } from '../services/readinessService';

// Central document vault (§17) with the "one document → many schemes" insight
// (§18/§19): each missing document shows how many schemes it would make
// application-ready, and marking one available surfaces exactly what it
// unlocked. Marking "I have this" records availability (not a file upload) —
// honest about the difference.
export default function DocumentVault({ onClose }) {
  const { tr } = useI18n();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [savingKey, setSavingKey] = useState(null);
  const [justUnlocked, setJustUnlocked] = useState(null); // { name, count }

  const load = () => getDocumentVault().then(setData).catch(() => setError(true));
  useEffect(() => { load(); }, []);

  const markHave = async (doc) => {
    setSavingKey(doc.key);
    try {
      await markDocumentAvailability(doc.key, 'available_physical');
      if (doc.unlocks > 0) setJustUnlocked({ name: doc.name, count: doc.unlocks });
      await load();
    } catch { /* soft-fail */ } finally { setSavingKey(null); }
  };

  return (
    <div className="fixed inset-0 z-[65] bg-black/40 flex justify-center items-stretch sm:items-center p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-md shadow-xl flex flex-col overflow-hidden">
        <div className="shrink-0 bg-gov-navy text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-200" />
            <h2 className="text-lg font-black">{tr('My Documents', 'मेरे दस्तावेज़')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {error && <p className="text-sm text-red-600">{tr('Could not load your documents right now.', 'आपके दस्तावेज़ अभी लोड नहीं हो सके।')}</p>}
          {!error && !data && <div className="flex items-center gap-2 justify-center py-10 text-slate-500 font-semibold"><Loader2 className="w-5 h-5 animate-spin" /> {tr('Loading…', 'लोड हो रहा है…')}</div>}

          {justUnlocked && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3.5 flex items-start gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-900">
                {tr(`Great — "${justUnlocked.name}" made ${justUnlocked.count} scheme${justUnlocked.count === 1 ? '' : 's'} ready to apply.`,
                    `बढ़िया — "${justUnlocked.name}" ने ${justUnlocked.count} योजना${justUnlocked.count === 1 ? '' : 'एँ'} आवेदन के लिए तैयार कर दी।`)}
              </p>
            </div>
          )}

          {data && (
            <>
              <p className="text-sm text-slate-500 font-semibold">
                {tr(`You have ${data.have} of ${data.total} documents that these schemes ask for.`, `इन योजनाओं द्वारा माँगे गए ${data.total} में से ${data.have} दस्तावेज़ आपके पास हैं।`)}
              </p>
              <ul className="space-y-2">
                {data.documents.map((doc) => (
                  <li key={doc.key} className={`rounded-md border p-3.5 flex items-center justify-between gap-3 ${doc.satisfied ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-start gap-2.5 min-w-0">
                      {doc.satisfied
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        : <XCircle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />}
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-sm">{doc.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {doc.satisfied
                            ? tr('Available', 'उपलब्ध')
                            : tr(`Required by ${doc.required_by} scheme${doc.required_by === 1 ? '' : 's'}`, `${doc.required_by} योजना${doc.required_by === 1 ? '' : 'ओं'} के लिए आवश्यक`)}
                          {!doc.satisfied && doc.unlocks > 0 && (
                            <span className="ml-1.5 inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <Unlock className="w-3 h-3" /> {tr(`unlocks ${doc.unlocks}`, `${doc.unlocks} खोलेगा`)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!doc.satisfied && (
                      <button onClick={() => markHave(doc)} disabled={savingKey === doc.key}
                        className="shrink-0 text-xs font-bold text-gov-navy border border-gov-navy/30 rounded px-2.5 py-1.5 hover:bg-gov-navy hover:text-white transition disabled:opacity-50">
                        {savingKey === doc.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : tr('I have this', 'मेरे पास है')}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-400">
                {tr('“I have this” records that you hold the document — it is not an upload and is not treated as officially verified.', '“मेरे पास है” यह दर्ज करता है कि दस्तावेज़ आपके पास है — यह अपलोड नहीं है और आधिकारिक रूप से सत्यापित नहीं माना जाता।')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
