import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useI18n } from '../i18n';

// Shown in the scheme-search flows when the saved profile is missing a field
// the matching logic relies on (income, gender, social category, state).
// Search still proceeds — this only makes the gap visible instead of silently
// matching against a blank value, which can under- or over-match schemes.
export default function IncompleteProfileNotice({ fields, onOpenProfile }) {
  const { tr } = useI18n();
  if (!fields?.length) return null;

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900">
          {tr('Your profile is missing some details', 'आपकी प्रोफ़ाइल में कुछ जानकारी छूट रही है')}
        </p>
        <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
          {tr(
            'These help us match you to the right schemes accurately: ',
            'ये जानकारी सही योजनाओं से मिलान करने में मदद करती है: '
          )}
          <span className="font-semibold">{fields.map((f) => tr(f.en, f.hi)).join(tr(', ', ', '))}</span>.{' '}
          {tr('Results shown now may be less accurate until this is added.', 'यह जानकारी जोड़ने तक दिखाए गए परिणाम कम सटीक हो सकते हैं।')}
        </p>
        {onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 hover:underline"
          >
            {tr('Complete your profile', 'अपनी प्रोफ़ाइल पूरी करें')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
