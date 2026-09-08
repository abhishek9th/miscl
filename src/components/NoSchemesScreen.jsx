import React from 'react';
import { RotateCcw, Edit3, ArrowRight, AlertTriangle } from 'lucide-react';
import { SCHEMES } from '../data/schemes';
import { useI18n } from '../i18n';

export default function NoSchemesScreen({
  lastReason,
  userCriteria,
  onEditInfo,
  onRestart,
  onSelectScheme
}) {
  const { t, tr, trText } = useI18n();
  const closestMatches = SCHEMES.slice(0, 2);

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Friendly Zero Matches Box */}
      <div className="bg-white border-4 border-slate-300 rounded-2xl p-6 text-center space-y-4 shadow-lg">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-4xl mx-auto border-2 border-amber-300">
          📭
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gov-navy leading-tight font-sans">
            {t('no_schemes_title')}
          </h2>
          <p className="text-base text-slate-700 leading-relaxed font-medium">
            {t('no_schemes_desc')}
          </p>
        </div>

        {/* Highlight Last Filtering Factor */}
        {lastReason && (
          <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl text-left space-y-1">
            <div className="flex items-center gap-2 text-red-900 font-extrabold text-sm uppercase tracking-wide">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{t('last_filter_reason')}</span>
            </div>
            <p className="text-base text-red-950 font-bold pl-7">
              {trText(lastReason, 'hi')}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-3">
          <button
            onClick={onEditInfo}
            className="gov-btn-accent w-full py-4 text-xl flex items-center justify-center gap-2"
          >
            <Edit3 className="w-6 h-6" />
            <span>{t('edit_info')}</span>
          </button>

          <button
            onClick={onRestart}
            className="gov-btn-secondary w-full py-3.5 text-lg border-slate-400 text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{t('restart')}</span>
          </button>
        </div>
      </div>

      {/* Closest Matches / Alternatives Section */}
      {closestMatches.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-slate-700 font-extrabold text-lg">
            <span>💡 {t('closest_matches')}</span>
          </div>

          <div className="space-y-3">
            {closestMatches.map((scheme) => (
              <div key={scheme.id} className="gov-card p-4 space-y-2 border-slate-300">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-lg font-bold text-gov-navy">{tr(scheme.name, scheme.name_hi || scheme.name)}</h4>
                  <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded border border-slate-300 shrink-0">
                    {tr('Closest Match', 'निकटतम विकल्प')}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{trText(scheme.description_hi, 'hi')}</p>
                <button
                  onClick={() => onSelectScheme(scheme)}
                  className="text-sm font-bold text-gov-navy hover:underline flex items-center gap-1 mt-1"
                >
                  <span>{t('view_details')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
