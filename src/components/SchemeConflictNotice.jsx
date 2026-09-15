import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, ExternalLink, Info } from 'lucide-react';
import { useI18n } from '../i18n';
import { getSchemeConflicts } from '../services/conflictService';

const STATUS_LABEL = {
  UNDER_REVIEW: { en: 'Under review', hi: 'समीक्षाधीन' },
  SUBMITTED: { en: 'Applied', hi: 'आवेदित' },
  APPROVED: { en: 'Approved', hi: 'स्वीकृत' },
  BENEFIT_ACTIVE: { en: 'Receiving benefit', hi: 'लाभ प्राप्त' },
  BENEFIT_RECEIVED: { en: 'Benefit received', hi: 'लाभ प्राप्त' },
};

// "Scheme compatibility" section (§16/§17/§18). Backend decides the conflict;
// this only renders it. Nothing shows for a clean NO_CONFLICT except a small
// reassurance line (§18 — no giant green box).
export default function SchemeConflictNotice({ schemeId }) {
  const { tr, lang } = useI18n();
  const [data, setData] = useState(undefined); // undefined = loading, null = n/a

  useEffect(() => {
    let active = true;
    getSchemeConflicts(schemeId).then((d) => { if (active) setData(d); });
    return () => { active = false; };
  }, [schemeId]);

  if (data === undefined || data === null) return null;
  if (data.status === 'NO_CONFLICT') {
    return (
      <p className="mt-5 flex items-center gap-1.5 text-sm text-emerald-700 font-semibold no-print">
        <ShieldCheck className="w-4 h-4" /> {tr('No known conflict with your other schemes.', 'आपकी अन्य योजनाओं के साथ कोई ज्ञात टकराव नहीं।')}
      </p>
    );
  }

  const blocking = data.status === 'CONFLICT';
  const cls = blocking ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900';

  return (
    <section className={`mt-5 border rounded-lg p-5 no-print ${cls}`}>
      <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
        <AlertTriangle className="w-6 h-6" />
        {blocking
          ? tr('This scheme may not be available to you', 'यह योजना आपके लिए उपलब्ध नहीं हो सकती')
          : tr('Possible conflict — please verify', 'संभावित टकराव — कृपया जाँच लें')}
      </h2>
      <p className="mt-1 text-sm font-semibold">
        {blocking
          ? tr('An existing benefit conflicts with this scheme according to the official rules.', 'आधिकारिक नियमों के अनुसार आपका मौजूदा लाभ इस योजना से टकराता है।')
          : tr('An existing scheme may overlap with this one. SchemeSetu could not confirm this with certainty — verify the combination rule before applying.', 'आपकी एक मौजूदा योजना इससे टकरा सकती है। SchemeSetu निश्चितता से इसकी पुष्टि नहीं कर सका — आवेदन से पहले नियम जाँच लें।')}
      </p>

      {data.count > 1 && (
        <p className="mt-2 text-sm font-bold">{data.count} {tr('conflicts detected', 'टकराव पाए गए')}</p>
      )}

      <div className="mt-3 space-y-3">
        {data.conflicts.map((c, i) => {
          const st = STATUS_LABEL[c.existing_status] || { en: c.existing_status, hi: c.existing_status };
          return (
            <div key={i} className="bg-white/70 border border-white rounded-md p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-slate-800">{c.existing_scheme_name}</span>
                <span className="text-[11px] font-bold uppercase text-slate-500">{tr(st.en, st.hi)}</span>
              </div>
              <p className="mt-1.5 text-sm text-slate-700">{lang === 'en' ? c.description_en : c.description_hi}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px]">
                {c.existing_status_source === 'USER_REPORTED' && (
                  <span className="text-slate-400 flex items-center gap-1"><Info className="w-3 h-3" /> {tr('Status you reported', 'आपके द्वारा बताई स्थिति')}</span>
                )}
                {c.source?.url && (
                  <a href={c.source.url} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-600 hover:underline inline-flex items-center gap-0.5">
                    {tr('View official rule', 'आधिकारिक नियम देखें')} <ExternalLink className="w-3 h-3" />
                    {c.source.verification_status !== 'verified' && ` · ${tr('unverified', 'असत्यापित')}`}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs font-semibold">
        {tr('What you should do: review the scheme’s combination/exclusion rules before submitting another application. Do not withdraw an existing application unless the official rules require it.', 'क्या करें: दूसरा आवेदन करने से पहले योजना के संयोजन/बहिष्करण नियम देखें। जब तक आधिकारिक नियम आवश्यक न करें, मौजूदा आवेदन वापस न लें।')}
      </p>
    </section>
  );
}
