import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, CheckCircle2, FileText, ListChecks, HelpCircle, Landmark, ClipboardList } from 'lucide-react';
import { useI18n } from '../i18n';
import { getCatalogueScheme } from '../services/catalogueService';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import ApplicationReadiness from './ApplicationReadiness';

// Some scraped fields (application_process, documents_required, faqs) were
// stored double-encoded — e.g. the STRING '["Online\\nStep 1:..."]' instead of a
// real array — so printed raw they show brackets, quotes and literal "\n". They
// also sometimes leaked the page footer as trailing junk. This normalises any of
// those shapes into clean, line-broken text and stops at the first junk marker.
const JUNK_RE = /^(frequently asked questions|disclaimer|terms\s*&?\s*conditions|dashboard|useful links|get in touch|last updated on|accessibility options|created by|copyright|©)/i;
function scrapedToText(v) {
  if (v == null) return '';
  let val = v;
  if (typeof val === 'string') {
    const t = val.trim();
    if (t.startsWith('[') || t.startsWith('{')) { try { val = JSON.parse(t); } catch { /* keep as-is */ } }
  }
  const parts = Array.isArray(val) ? val : [val];
  const out = [];
  for (const part of parts) {
    for (const raw of String(part ?? '').split('\n')) {
      const line = raw.replace(/﻿/g, '').trim();
      if (JUNK_RE.test(line)) return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      out.push(line);
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Full detail view for a scheme from the native myScheme catalogue (not the
// small curated SCHEMES[] set). Shows exactly what was scraped from the
// government's own site — no AI-generated eligibility/benefit text here.
export default function CatalogueSchemeDetail({ slug, onBack }) {
  const { tr, trText } = useI18n();
  const [scheme, setScheme] = useState(null);
  const [error, setError] = useState(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    setScheme(null);
    setError(null);
    getCatalogueScheme(slug)
      .then((s) => { if (active) setScheme(s); })
      .catch(() => { if (active) setError(true); });
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data }) => { if (active) setSignedIn(!!data?.session); });
    }
    return () => { active = false; };
  }, [slug]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center space-y-3">
        <p className="text-slate-600 font-semibold">{tr('Could not load this scheme right now.', 'यह योजना अभी लोड नहीं हो सकी।')}</p>
        <button onClick={onBack} className="text-gov-navy font-extrabold hover:underline">{tr('Go back', 'वापस जाएँ')}</button>
      </div>
    );
  }

  if (!scheme) {
    return <div className="max-w-3xl mx-auto px-4 py-10 text-center text-slate-500">{tr('Loading…', 'लोड हो रहा है…')}</div>;
  }

  const Section = ({ icon: Icon, title, hiTitle, text }) => {
    if (!text) return null;
    return (
      <section className="gov-card p-5 space-y-2">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-gov-navy">
          <Icon className="w-5 h-5 text-gov-saffron" /> {tr(title, hiTitle)}
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{trText(text, 'en')}</p>
      </section>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-in fade-in duration-200">
      <button onClick={onBack} className="flex items-center gap-1.5 text-gov-navy font-extrabold hover:underline">
        <ArrowLeft className="w-5 h-5" /> {tr('Back to search', 'खोज पर वापस जाएँ')}
      </button>

      <div className="bg-gov-navy text-white rounded-2xl p-5 sm:p-6 border-b-4 border-gov-saffron space-y-2">
        <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/30 text-xs font-extrabold px-3 py-1 rounded-full uppercase">
          {scheme.level === 'state' ? tr('State / UT Scheme', 'राज्य / केंद्र शासित प्रदेश योजना') : tr('Central Scheme', 'केंद्रीय योजना')}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black leading-tight">{trText(scheme.name, 'en')}</h2>
        {(scheme.ministries?.length > 0 || scheme.states?.length > 0) && (
          <p className="text-sm text-slate-200 flex items-center gap-1.5">
            <Landmark className="w-4 h-4" /> {[...(scheme.ministries || []), ...(scheme.states || [])].join(' · ')}
          </p>
        )}
        {scheme.short_description && <p className="text-slate-100 text-sm leading-relaxed">{trText(scheme.short_description, 'en')}</p>}
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3 text-emerald-950">
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-700" />
        <p className="text-xs sm:text-sm font-semibold leading-relaxed">
          {tr('Scraped directly from the Government of India myScheme platform.', 'यह जानकारी सीधे भारत सरकार के myScheme प्लेटफ़ॉर्म से ली गई है।')}
          {' '}
          {scheme.detail_scraped_at
            ? tr('Last verified ', 'अंतिम सत्यापन ') + new Date(scheme.detail_scraped_at).toLocaleDateString()
            : tr('Full details are being added for this scheme — check back soon or view it on the official site below.', 'इस योजना का पूरा विवरण जल्द जोड़ा जा रहा है — कृपया बाद में देखें या नीचे आधिकारिक साइट पर देखें।')}
        </p>
      </div>

      <Section icon={FileText} title="About this scheme" hiTitle="योजना के बारे में" text={scrapedToText(scheme.details_text)} />
      <Section icon={CheckCircle2} title="Benefits" hiTitle="लाभ" text={scrapedToText(scheme.benefits_text)} />
      <Section icon={ListChecks} title="Eligibility" hiTitle="पात्रता" text={scrapedToText(scheme.eligibility_text)} />
      <Section icon={ListChecks} title="Application Process" hiTitle="आवेदन प्रक्रिया" text={scrapedToText(scheme.application_process)} />
      <Section icon={FileText} title="Documents Required" hiTitle="आवश्यक दस्तावेज़" text={scrapedToText(scheme.documents_required)} />

      {/* Personalised readiness — runs the same engine used for curated schemes
          against this scheme's decomposed requirements. Signed-in users only. */}
      {signedIn && (
        <section className="gov-card p-5 space-y-2">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-gov-navy">
            <ClipboardList className="w-5 h-5 text-gov-saffron" /> {tr('Your application readiness', 'आपकी आवेदन तैयारी')}
          </h3>
          <p className="text-xs text-slate-500 mb-1">{tr('SchemeSetu checks each requirement of this scheme against your profile and documents.', 'SchemeSetu इस योजना की हर आवश्यकता की तुलना आपकी प्रोफ़ाइल और दस्तावेज़ों से करता है।')}</p>
          <ApplicationReadiness scheme={{ id: slug, name: scheme.name, name_hi: scheme.name }} />
        </section>
      )}

      <Section icon={HelpCircle} title="Frequently Asked Questions" hiTitle="अक्सर पूछे जाने वाले प्रश्न" text={scrapedToText(scheme.faqs)} />

      {scheme.official_website && (
        <a
          href={scheme.official_website}
          target="_blank" rel="noopener noreferrer"
          className="gov-btn-accent w-full py-4 text-lg flex items-center justify-center gap-2 shadow"
        >
          {tr('Go to Official Application Portal', 'आधिकारिक आवेदन पोर्टल पर जाएँ')} <ExternalLink className="w-5 h-5" />
        </a>
      )}
      <a
        href={scheme.source_url}
        target="_blank" rel="noopener noreferrer"
        className="block text-center text-xs text-slate-500 hover:text-gov-navy hover:underline"
      >
        {tr('View source on myScheme.gov.in', 'myScheme.gov.in पर स्रोत देखें')}
      </a>
    </div>
  );
}
