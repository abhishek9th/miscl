import React from 'react';
import { X, Trophy } from 'lucide-react';
import { useI18n } from '../i18n';

// Side-by-side comparison of the user's matching schemes (§21). Uses only the
// deterministic engine outputs already on each scheme; conflict/deadline
// columns are shown as "—" honestly until that verified data exists.
export default function ComparisonModal({ schemes, onClose, onOpenScheme }) {
  const { tr } = useI18n();
  const list = schemes.slice(0, 4); // keep the table readable

  const rows = [
    { label_en: 'Potential benefit', label_hi: 'संभावित लाभ', get: (s) => s.benefit_label_en ? tr(s.benefit_label_en, s.benefit_label_en) : '—' },
    { label_en: 'Eligibility match', label_hi: 'पात्रता मिलान', get: (s) => `${s.match_score}%` },
    { label_en: 'Documents ready', label_hi: 'दस्तावेज़ तैयार', get: (s) => s.readiness_score !== null ? `${s.readiness_score}%` : '—' },
    { label_en: 'Status', label_hi: 'स्थिति', get: (s) => STATUS_LABEL(s.bucket, tr) },
    { label_en: 'Deadline', label_hi: 'अंतिम तिथि', get: () => tr('Not verified', 'सत्यापित नहीं') },
    { label_en: 'Known conflicts', label_hi: 'ज्ञात टकराव', get: () => tr('None known', 'कोई ज्ञात नहीं') },
  ];

  return (
    <div className="fixed inset-0 z-[66] bg-black/40 flex justify-center items-stretch sm:items-center p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-md shadow-xl flex flex-col overflow-hidden">
        <div className="shrink-0 bg-gov-navy text-white px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-black">{tr('Compare your matches', 'अपने मिलानों की तुलना करें')}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[420px]">
              <thead>
                <tr>
                  <th className="text-left p-2 text-xs font-black text-slate-400 uppercase">{tr('Scheme', 'योजना')}</th>
                  {list.map((s) => (
                    <th key={s.scheme_id} className="p-2 text-left align-top">
                      <button onClick={() => onOpenScheme(s.scheme_id)} className="font-extrabold text-gov-navy text-sm hover:underline text-left">
                        {tr(s.name, s.name_hi)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label_en} className="border-t border-slate-100">
                    <td className="p-2 font-semibold text-slate-500 text-xs whitespace-nowrap">{tr(r.label_en, r.label_hi)}</td>
                    {list.map((s) => <td key={s.scheme_id} className="p-2 font-bold text-slate-800">{r.get(s)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommended order — the list is already engine-ranked (ready →
              action → potential, then match, then readiness). */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-black text-gov-navy"><Trophy className="w-4 h-4 text-amber-500" /> {tr('Suggested order', 'सुझाया गया क्रम')}</h3>
            <ol className="mt-2 space-y-1.5 text-sm">
              {list.map((s, i) => (
                <li key={s.scheme_id} className="flex gap-2">
                  <span className="font-black text-slate-400">{['🥇', '🥈', '🥉'][i] || `${i + 1}.`}</span>
                  <span className="text-slate-700"><span className="font-bold">{tr(s.name, s.name_hi)}</span> — {reasonFor(s, tr)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function STATUS_LABEL(bucket, tr) {
  return {
    ready: tr('Ready to apply', 'तैयार'),
    action_required: tr('Needs documents', 'दस्तावेज़ चाहिए'),
    potential: tr('Potential', 'संभावित'),
  }[bucket] || bucket;
}

function reasonFor(s, tr) {
  if (s.bucket === 'ready') return tr('all documents ready, apply now', 'सभी दस्तावेज़ तैयार, अभी आवेदन करें');
  if (s.bucket === 'action_required') return tr(`${s.readiness_score}% documents ready`, `${s.readiness_score}% दस्तावेज़ तैयार`);
  return tr('add profile details to confirm', 'पुष्टि हेतु प्रोफ़ाइल जानकारी जोड़ें');
}
