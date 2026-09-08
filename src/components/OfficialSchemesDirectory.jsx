import React from 'react';
import { ArrowLeft, ExternalLink, Landmark, ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n';

// Counts are displayed by the official myScheme catalogue and intentionally stay
// as a directory, rather than becoming a stale copy of thousands of schemes.
const CATEGORIES = [
  ['Social welfare & Empowerment', 'सामाजिक कल्याण और सशक्तिकरण', '1,453'],
  ['Education & Learning', 'शिक्षा और सीखना', '1,110'],
  ['Agriculture, Rural & Environment', 'कृषि, ग्रामीण और पर्यावरण', '862'],
  ['Business & Entrepreneurship', 'व्यवसाय और उद्यमिता', '772'],
  ['Women and Child', 'महिला और बाल', '470'],
  ['Skills & Employment', 'कौशल और रोजगार', '401'],
  ['Banking, Financial Services and Insurance', 'बैंकिंग, वित्तीय सेवाएँ और बीमा', '336'],
  ['Health & Wellness', 'स्वास्थ्य और कल्याण', '286'],
  ['Sports & Culture', 'खेल और संस्कृति', '280'],
  ['Housing & Shelter', 'आवास और आश्रय', '136'],
  ['Science, IT & Communications', 'विज्ञान, आईटी और संचार', '121'],
  ['Transport & Infrastructure', 'परिवहन और अवसंरचना', '104'],
  ['Travel & Tourism', 'यात्रा और पर्यटन', '96'],
  ['Utility & Sanitation', 'उपयोगिताएँ और स्वच्छता', '58'],
  ['Public Safety, Law & Justice', 'लोक सुरक्षा, कानून और न्याय', '34'],
];

const MY_SCHEME_URL = 'https://www.myscheme.gov.in/search';

export default function OfficialSchemesDirectory({ onBack }) {
  const { tr } = useI18n();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200">
      <button onClick={onBack} className="flex items-center gap-1.5 text-gov-navy font-extrabold hover:underline">
        <ArrowLeft className="w-5 h-5" />
        {tr('Back to home', 'होम पर वापस जाएँ')}
      </button>

      <section className="bg-gov-navy text-white rounded-2xl p-6 sm:p-8 border-b-4 border-gov-saffron shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm uppercase tracking-wide">
              <Landmark className="w-5 h-5" />
              {tr('Official government directory', 'आधिकारिक सरकारी निर्देशिका')}
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black">
              {tr('All available Government of India schemes', 'भारत की सभी उपलब्ध योजनाएँ')}
            </h2>
            <p className="mt-3 text-slate-200 text-base leading-relaxed">
              {tr('Search 4,770+ Central, State and Union Territory schemes through the Government of India’s myScheme portal. This catalogue is maintained at the official source.', 'केंद्र, राज्य और केंद्र शासित प्रदेशों की 4,770+ योजनाओं को भारत सरकार के myScheme पोर्टल पर खोजें। यह सूची आधिकारिक स्रोत से लगातार अपडेट होती रहती है।')}
            </p>
          </div>
          <a href={MY_SCHEME_URL} target="_blank" rel="noopener noreferrer" className="gov-btn-accent shrink-0 py-3 px-5 flex items-center justify-center gap-2 text-center">
            {tr('Browse all schemes', 'सभी योजनाएँ खोजें')} <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </section>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3 text-emerald-950">
        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-700" />
        <p className="text-sm font-semibold leading-relaxed">
          {tr('SchemeSetu’s eligibility search only recommends schemes whose rules are verified here. For every available government scheme, open a category below and use the official myScheme catalogue for current details and applications.', 'SchemeSetu की पात्रता खोज केवल उन योजनाओं के लिए है जिनके नियम यहाँ सत्यापित किए गए हैं। हर उपलब्ध सरकारी योजना के लिए नीचे की श्रेणी खोलें और आधिकारिक myScheme सूची में आवेदन विवरण देखें।')}
        </p>
      </div>

      <section>
        <h3 className="text-2xl font-black text-gov-navy">{tr('Schemes by category', 'श्रेणी के अनुसार योजनाएँ')}</h3>
        <p className="mt-1 text-sm text-slate-600 font-medium">{tr('Current counts shown by myScheme', 'myScheme पर प्रदर्शित वर्तमान संख्या')}</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map(([name, nameHi, count]) => (
            <a key={name} href={MY_SCHEME_URL} target="_blank" rel="noopener noreferrer" className="gov-card p-4 hover:shadow-md hover:border-gov-saffron transition-all flex items-center justify-between gap-3">
              <div>
                <div className="font-extrabold text-gov-navy leading-snug">{tr(name, nameHi)}</div>
                <div className="mt-1 text-xs text-slate-500 font-bold">{count} {tr('schemes', 'योजनाएँ')}</div>
              </div>
              <ExternalLink className="w-5 h-5 shrink-0 text-gov-saffron" />
            </a>
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-500 text-center pb-2">
        {tr('Source: Government of India myScheme national platform. Counts verified on 5 September 2026.', 'स्रोत: भारत सरकार का myScheme राष्ट्रीय प्लेटफ़ॉर्म। संख्या 5 सितंबर 2026 को सत्यापित की गई।')}
      </p>
    </div>
  );
}
