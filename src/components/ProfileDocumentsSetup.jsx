import React, { useEffect, useState } from 'react';
import {
  FileText, UploadCloud, CheckCircle2, Loader2, ArrowRight, ShieldCheck,
  FolderPlus, Clock, AlertCircle,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { uploadUserDocument, getMyDocuments } from '../services/profileService';

// The documents SchemeSetu asks a new user to store for future applications.
// document_type values match the user_documents table / journey document matcher.
const DOC_TYPES = [
  { type: 'aadhaar', en: 'Aadhaar Card', hi: 'आधार कार्ड' },
  { type: 'pan', en: 'PAN Card', hi: 'पैन कार्ड' },
  { type: 'income_certificate', en: 'Income Certificate', hi: 'आय प्रमाण पत्र' },
  { type: 'domicile_certificate', en: 'Domicile Certificate', hi: 'निवास प्रमाण पत्र' },
  { type: 'caste_certificate', en: 'Caste Certificate', hi: 'जाति प्रमाण पत्र' },
  { type: 'bank_passbook', en: 'Bank Passbook', hi: 'बैंक पासबुक' },
  { type: 'marksheet', en: 'Latest Marksheet', hi: 'नवीनतम अंकतालिका' },
  { type: 'disability_certificate', en: 'Disability Certificate', hi: 'दिव्यांगता प्रमाण पत्र' },
];

export default function ProfileDocumentsSetup({ onDone }) {
  const { tr } = useI18n();
  const [view, setView] = useState('intro'); // intro | upload

  return (
    <div className="min-h-screen bg-[#f5efe3] flex flex-col">
      {/* Slim gov header strip */}
      <div className="bg-gov-navy text-white px-5 py-3 flex items-center gap-3 border-b-4 border-gov-saffron">
        <FolderPlus className="w-6 h-6 text-amber-400" />
        <div>
          <div className="font-black leading-tight">{tr('Profile & Documents', 'प्रोफ़ाइल और दस्तावेज़')}</div>
          <div className="text-xs text-slate-200">{tr('One-time setup for faster applications', 'तेज़ आवेदन के लिए एक-बार सेटअप')}</div>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {view === 'intro' ? <Intro tr={tr} onCreate={() => setView('upload')} onSkip={onDone} />
            : <UploadPage tr={tr} onDone={onDone} />}
        </div>
      </div>
    </div>
  );
}

function Intro({ tr, onCreate, onSkip }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[#f5f1ea] text-gov-navy flex items-center justify-center mx-auto mb-4">
        <FolderPlus className="w-8 h-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-gov-navy">{tr('Create a profile for future use', 'भविष्य के उपयोग के लिए प्रोफ़ाइल बनाएँ')}</h1>
      <p className="mt-3 text-slate-600 leading-relaxed max-w-lg mx-auto">
        {tr(
          'Save your certificates once and SchemeSetu will auto-attach them to future scheme applications — so you never have to hunt for documents again.',
          'अपने प्रमाण पत्र एक बार सहेजें और SchemeSetu उन्हें भविष्य की योजना आवेदनों में स्वतः संलग्न कर देगा — ताकि आपको दोबारा दस्तावेज़ न ढूँढने पड़ें।'
        )}
      </p>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        {tr('Stored privately and encrypted. Only you can access them.', 'निजी रूप से और एन्क्रिप्टेड सहेजा जाता है। केवल आप ही पहुँच सकते हैं।')}
      </div>

      <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onCreate}
          className="bg-gov-saffron hover:bg-orange-700 text-white rounded-md py-3 px-6 font-extrabold inline-flex items-center justify-center gap-2">
          {tr('Create profile', 'प्रोफ़ाइल बनाएँ')} <ArrowRight className="w-5 h-5" />
        </button>
        <button onClick={onSkip}
          className="border-2 border-slate-300 hover:border-gov-navy text-gov-navy rounded-md py-3 px-6 font-bold">
          {tr('Maybe later', 'बाद में')}
        </button>
      </div>
    </div>
  );
}

function UploadPage({ tr, onDone }) {
  // status per type: undefined | 'uploading' | 'done' | 'error'
  const [status, setStatus] = useState({});
  const [errorMsg, setErrorMsg] = useState({});

  // Reflect already-stored documents so re-entry shows what's done.
  useEffect(() => {
    let active = true;
    getMyDocuments().then((docs) => {
      if (!active) return;
      const seen = {};
      for (const d of docs) seen[d.document_type] = 'done';
      setStatus((s) => ({ ...seen, ...s }));
    });
    return () => { active = false; };
  }, []);

  const handleFile = async (type, file) => {
    if (!file) return;
    setErrorMsg((m) => ({ ...m, [type]: '' }));
    setStatus((s) => ({ ...s, [type]: 'uploading' }));
    try {
      await uploadUserDocument(type, file);
      setStatus((s) => ({ ...s, [type]: 'done' }));
    } catch (err) {
      setStatus((s) => ({ ...s, [type]: 'error' }));
      setErrorMsg((m) => ({ ...m, [type]: err.message || tr('Upload failed', 'अपलोड विफल') }));
    }
  };

  const doneCount = Object.values(status).filter((v) => v === 'done').length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-7">
      <h1 className="text-xl sm:text-2xl font-black text-gov-navy">{tr('Upload your documents (PDF)', 'अपने दस्तावेज़ अपलोड करें (PDF)')}</h1>
      <p className="mt-1.5 text-sm text-slate-600">
        {tr('Add PDF copies of the documents you have. You can skip any and add them later from your profile.', 'आपके पास मौजूद दस्तावेज़ों की PDF प्रतियाँ जोड़ें। आप किसी को भी छोड़ सकते हैं और बाद में अपनी प्रोफ़ाइल से जोड़ सकते हैं।')}
      </p>

      <div className="mt-5 divide-y divide-slate-100 border border-slate-200 rounded-lg">
        {DOC_TYPES.map((d) => {
          const st = status[d.type];
          return (
            <div key={d.type} className="flex items-center gap-3 px-3.5 py-3">
              <FileText className="w-6 h-6 text-gov-navy shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-800">{tr(d.en, d.hi)}</div>
                {st === 'error' && <div className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errorMsg[d.type]}</div>}
                {st === 'done' && <div className="text-xs text-emerald-700">{tr('Saved', 'सहेजा गया')}</div>}
              </div>

              {st === 'done' ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> {tr('Done', 'पूर्ण')}
                </span>
              ) : st === 'uploading' ? (
                <span className="inline-flex items-center gap-1 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> {tr('Uploading…', 'अपलोड हो रहा है…')}
                </span>
              ) : (
                <label className="cursor-pointer inline-flex items-center gap-1.5 border border-gov-navy text-gov-navy rounded-md py-1.5 px-3 text-sm font-bold hover:bg-slate-50">
                  <UploadCloud className="w-4 h-4" /> {tr('Choose PDF', 'PDF चुनें')}
                  <input type="file" accept="application/pdf,.pdf" className="hidden"
                    onChange={(e) => handleFile(d.type, e.target.files?.[0])} />
                </label>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Clock className="w-3.5 h-3.5" /> {tr('You can update these anytime from your profile.', 'आप इन्हें कभी भी अपनी प्रोफ़ाइल से अपडेट कर सकते हैं।')}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
        <button onClick={onDone} className="border-2 border-slate-300 hover:border-gov-navy text-gov-navy rounded-md py-2.5 px-6 font-bold">
          {tr('Skip for now', 'अभी छोड़ें')}
        </button>
        <button onClick={onDone}
          className="bg-gov-navy hover:bg-[#083d71] text-white rounded-md py-2.5 px-6 font-extrabold inline-flex items-center justify-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {doneCount > 0 ? tr(`Finish (${doneCount} saved)`, `पूर्ण करें (${doneCount} सहेजे गए)`) : tr('Continue to dashboard', 'डैशबोर्ड पर जाएँ')}
        </button>
      </div>
    </div>
  );
}
