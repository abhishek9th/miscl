import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, Loader2, FileText, Unlock, Sparkles, ShieldCheck, Download } from 'lucide-react';
import { useI18n } from '../i18n';
import { getDocumentVault } from '../services/documentVaultService';
import { markDocumentAvailability } from '../services/readinessService';
import { DEMO_DOCS, linkProvider, getFetchedSources } from '../services/digilockerDemo';
import SourceBadge from './SourceBadge';


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

  const [sources, setSources] = useState({}); // requirement_key -> provider
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(false);

  const load = async () => {
    try {
      const [vault, src] = await Promise.all([getDocumentVault(), getFetchedSources()]);
      setSources(src);
      setFetched(Object.values(src).includes('digilocker'));
      setData(vault);
    } catch { setError(true); }
  };
  useEffect(() => { load(); }, []);

  // Simulated DigiLocker pull (demo): records availability for every scheme
  // requirement the demo documents cover, tagged so the UI can badge them.
  const fetchFromDigiLocker = async () => {
    setFetching(true);
    try {
      await linkProvider('digilocker');
      setFetched(true);
      await load();
    } catch { /* soft-fail */ } finally { setFetching(false); }
  };

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
            <section className="rounded-md border border-blue-200 bg-blue-50/40 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-black text-blue-900">{tr('DigiLocker', 'डिजिलॉकर')} <span className="text-[10px] font-bold uppercase text-slate-400">{tr('demo', 'डेमो')}</span></div>
                    <div className="text-xs text-slate-500">{fetched ? tr('Documents fetched from your DigiLocker', 'आपके डिजिलॉकर से प्राप्त दस्तावेज़') : tr('Fetch your issued documents in one tap', 'अपने जारी दस्तावेज़ एक टैप में प्राप्त करें')}</div>
                  </div>
                </div>
                {!fetched && (
                  <button onClick={fetchFromDigiLocker} disabled={fetching}
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded px-3 py-2 disabled:opacity-60">
                    {fetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {fetching ? tr('Fetching…', 'प्राप्त हो रहा है…') : tr('Fetch from DigiLocker', 'डिजिलॉकर से प्राप्त करें')}
                  </button>
                )}
              </div>
              {fetched && (
                <ul className="mt-3 divide-y divide-blue-100 bg-white border border-blue-100 rounded">
                  {DEMO_DOCS.filter((d) => d.provider === 'digilocker').map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-800 truncate">{tr(d.en, d.hi)}</div>
                          <div className="text-[11px] text-slate-400">{tr('Issued by', 'जारीकर्ता')} {d.issuer}</div>
                        </div>
                      </div>
                      <SourceBadge provider="digilocker" />
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[10px] text-slate-400">{tr('Demo data for the prototype — no real DigiLocker account is connected.', 'प्रोटोटाइप के लिए डेमो डेटा — कोई वास्तविक डिजिलॉकर खाता जुड़ा नहीं है।')}</p>
            </section>
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
                        <div className="font-bold text-slate-800 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                          {doc.name}
                          {doc.satisfied && <SourceBadge provider={sources[doc.key]} />}
                        </div>
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
