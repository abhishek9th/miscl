import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n';
import { PROVIDERS } from '../services/digilockerDemo';

// "Fetched from DigiLocker" marker. Shown only for DigiLocker-sourced documents
// — documents from any other provider (e.g. NeSL) carry no label.
export default function SourceBadge({ provider }) {
  const { tr } = useI18n();
  if (provider !== 'digilocker') return null;
  const p = PROVIDERS.digilocker;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
      <ShieldCheck className="w-3 h-3" /> {tr(p.fetchedEn, p.fetchedHi)}
    </span>
  );
}
