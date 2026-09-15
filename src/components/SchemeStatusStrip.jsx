import React from 'react';
import { useI18n } from '../i18n';

// Full-width status strip for the top of a scheme card. Replaces the old
// corner "ball" badge: the status text scrolls right-to-left across the whole
// card top (reuses the .marquee-track animation from index.css). One variant
// per eligibility state.
const VARIANTS = {
  available:   { bg: 'bg-emerald-600', en: 'Scheme Available', hi: 'योजना उपलब्ध' },
  potential:   { bg: 'bg-blue-600',    en: 'Potential Match',  hi: 'संभावित मिलान' },
  needs_docs:  { bg: 'bg-amber-500',   en: 'Documents Needed', hi: 'दस्तावेज़ आवश्यक' },
  unavailable: { bg: 'bg-red-600',     en: 'Unavailable',      hi: 'अनुपलब्ध' },
};

export default function SchemeStatusStrip({ status = 'available' }) {
  const { tr } = useI18n();
  const v = VARIANTS[status] || VARIANTS.available;
  const label = tr(v.en, v.hi);

  return (
    <div className={`${v.bg} text-white overflow-hidden`} aria-label={label}>
      <div className="marquee-track flex w-max whitespace-nowrap py-1.5">
        {/* Two copies back-to-back so the -50% loop seams invisibly. Each copy
            repeats the label a few times so the strip is filled across wide cards. */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex" aria-hidden={copy === 1}>
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="text-[11px] font-extrabold uppercase tracking-wider px-6">
                {label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
