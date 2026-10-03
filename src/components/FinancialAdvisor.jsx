import React, { useState } from 'react';
import {
  ArrowLeft, Loader2, Wallet, CheckCircle2, AlertTriangle, XCircle, Info, ExternalLink,
  ChevronDown, ChevronUp, Landmark, PiggyBank, Calculator, FileWarning, ShieldCheck,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { getFundingPlan } from '../services/advisorService';

const rupee = (n) => (Number.isFinite(n) ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—');

const SECTORS = [
  ['manufacturing', 'Manufacturing / production', 'विनिर्माण / उत्पादन'],
  ['services', 'Services', 'सेवाएँ'],
  ['retail_trading', 'Retail / trading', 'खुदरा / व्यापार'],
  ['food_processing', 'Food processing', 'खाद्य प्रसंस्करण'],
  ['handicrafts', 'Handicrafts / artisan work', 'हस्तशिल्प / कारीगरी'],
  ['agriculture_allied', 'Agriculture & allied', 'कृषि एवं संबद्ध'],
  ['transport', 'Transport', 'परिवहन'],
  ['tech_it', 'Tech / IT', 'टेक / आईटी'],
  ['healthcare', 'Healthcare', 'स्वास्थ्य सेवा'],
  ['tourism', 'Tourism', 'पर्यटन'],
];
const TENURES = [12, 24, 36, 48, 60, 84, 120];

const EMPTY = {
  goal: 'new', sector: '', area: 'urban', projectCost: '', ownFunds: '',
  monthlyIncome: '', monthlyExpenses: '', existingEmi: '', tenureMonths: '', quotedRate: '',
};

const inputCls = 'w-full h-11 px-3 rounded-md border border-slate-300 text-slate-800 focus:border-gov-navy focus:ring-2 focus:ring-gov-navy/20 outline-none';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-slate-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

function Money({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
      <input inputMode="numeric" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))} className={`${inputCls} pl-7`} />
    </div>
  );
}

const AFF = {
  comfortable: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', en: 'Comfortable', hi: 'सुविधाजनक', Icon: CheckCircle2 },
  stretched: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', en: 'Stretched — manageable but tight', hi: 'खिंचा हुआ — संभव पर तंग', Icon: AlertTriangle },
  risky: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', en: 'Risky', hi: 'जोखिम भरा', Icon: XCircle },
  unaffordable: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', en: 'Not affordable', hi: 'वहन योग्य नहीं', Icon: XCircle },
};

export default function FinancialAdvisor({ onBack, onOpenScheme, onOpenProfile }) {
  const { tr, lang } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v && v.target ? v.target.value : v }));

  const run = async (override = {}) => {
    setError(''); setLoading(true);
    try {
      const payload = { ...form, ...override };
      const r = await getFundingPlan(payload, lang === 'hi' ? 'hi' : 'en');
      setResult(r);
      requestAnimationFrame(() => document.getElementById('advisor-result')?.scrollIntoView({ behavior: 'smooth' }));
    } catch (e) {
      setError(e.message || tr('Something went wrong. Please try again.', 'कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें।'));
    } finally { setLoading(false); }
  };
  const submit = (e) => { e.preventDefault(); run(); };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold text-gov-navy hover:underline">
        <ArrowLeft className="w-4 h-4" /> {tr('Back', 'वापस')}
      </button>

      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-[#f5f1ea] text-gov-navy flex items-center justify-center shrink-0"><Wallet className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-black text-gov-navy">{tr('Financial Advisor', 'वित्तीय सलाहकार')}</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            {tr('Tell us about your business and money. SchemeSahayak checks the schemes you qualify for, works out the numbers, and recommends the one that gives you the most government support you can comfortably afford.',
              'अपने व्यवसाय और आर्थिक स्थिति के बारे में बताएँ। SchemeSahayak उन योजनाओं की जाँच करता है जिनके आप पात्र हैं, गणना करता है और वह योजना सुझाता है जो आपकी वहन-क्षमता के भीतर सबसे अधिक सरकारी सहायता दे।')}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="gov-card p-5 space-y-4">
        <h2 className="text-base font-black text-gov-navy">{tr('Your business & money', 'आपका व्यवसाय और धन')}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={tr('Business stage', 'व्यवसाय की स्थिति')}>
            <select value={form.goal} onChange={set('goal')} className={inputCls}>
              <option value="new">{tr('Starting a new business', 'नया व्यवसाय शुरू करना')}</option>
              <option value="existing">{tr('Growing an existing business', 'मौजूदा व्यवसाय बढ़ाना')}</option>
            </select>
          </Field>
          <Field label={tr('Sector', 'क्षेत्र')}>
            <select value={form.sector} onChange={set('sector')} className={inputCls} required>
              <option value="">{tr('Select…', 'चुनें…')}</option>
              {SECTORS.map(([v, en, hi]) => <option key={v} value={v}>{tr(en, hi)}</option>)}
            </select>
          </Field>
          <Field label={tr('Location', 'स्थान')}>
            <select value={form.area} onChange={set('area')} className={inputCls}>
              <option value="urban">{tr('Urban', 'शहरी')}</option>
              <option value="rural">{tr('Rural', 'ग्रामीण')}</option>
            </select>
          </Field>
          <Field label={tr('Total money needed for the project', 'परियोजना के लिए कुल आवश्यक धन')}>
            <Money value={form.projectCost} onChange={set('projectCost')} placeholder="e.g. 500000" />
          </Field>
          <Field label={tr('Your own savings you can put in', 'आपकी अपनी बचत जो लगा सकते हैं')} hint={tr('Enter 0 if none.', 'यदि नहीं है तो 0 डालें।')}>
            <Money value={form.ownFunds} onChange={set('ownFunds')} placeholder="e.g. 100000" />
          </Field>
          <Field label={tr('Monthly household income', 'मासिक घरेलू आय')} hint={tr('What you earn now — we do not assume future business income.', 'जो अभी कमाते हैं — भविष्य की व्यवसाय आय नहीं मानी जाती।')}>
            <Money value={form.monthlyIncome} onChange={set('monthlyIncome')} placeholder="e.g. 40000" />
          </Field>
          <Field label={tr('Monthly household expenses', 'मासिक घरेलू खर्च')}>
            <Money value={form.monthlyExpenses} onChange={set('monthlyExpenses')} placeholder="e.g. 20000" />
          </Field>
          <Field label={tr('Existing loan EMIs per month', 'मौजूदा ऋण की मासिक किस्तें')} hint={tr('Enter 0 if none.', 'यदि नहीं है तो 0 डालें।')}>
            <Money value={form.existingEmi} onChange={set('existingEmi')} placeholder="e.g. 0" />
          </Field>
          <Field label={tr('Repayment period (optional)', 'चुकौती अवधि (वैकल्पिक)')}>
            <select value={form.tenureMonths} onChange={set('tenureMonths')} className={inputCls}>
              <option value="">{tr('Let SchemeSahayak assume', 'SchemeSahayak मान ले')}</option>
              {TENURES.map((m) => <option key={m} value={m}>{m} {tr('months', 'महीने')} ({m / 12} {tr('yrs', 'वर्ष')})</option>)}
            </select>
          </Field>
          <Field label={tr('Interest rate your bank quoted (optional)', 'बैंक द्वारा बताई गई ब्याज दर (वैकल्पिक)')} hint={tr('Only if you already asked a bank. We never guess a bank\'s rate.', 'केवल यदि आपने बैंक से पूछा हो। हम बैंक की दर का अनुमान नहीं लगाते।')}>
            <div className="relative">
              <input inputMode="decimal" value={form.quotedRate} placeholder="e.g. 10.5"
                onChange={(e) => set('quotedRate')(e.target.value.replace(/[^\d.]/g, ''))} className={`${inputCls} pr-8`} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
            </div>
          </Field>
        </div>

        {error && <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 text-sm"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}</div>}
        <button type="submit" disabled={loading}
          className="w-full sm:w-auto bg-gov-navy hover:bg-[#083d71] disabled:opacity-60 text-white font-extrabold rounded-md px-6 py-3 inline-flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
          {loading ? tr('Working out your plan…', 'आपकी योजना तैयार हो रही है…') : tr('Get my funding plan', 'मेरी फंडिंग योजना पाएँ')}
        </button>
      </form>

      {result && <Result result={result} tr={tr} onOpenScheme={onOpenScheme} onOpenProfile={onOpenProfile}
        onRecalc={(rate) => { setForm((f) => ({ ...f, quotedRate: String(rate) })); run({ quotedRate: rate }); }} loading={loading} />}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
function Section({ title, icon: Icon, children }) {
  return (
    <section className="gov-card p-5 space-y-3">
      <h3 className="flex items-center gap-2 text-base font-black text-gov-navy">{Icon && <Icon className="w-5 h-5 text-gov-saffron" />}{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value, strong, note }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <div className={`text-sm ${strong ? 'font-black text-slate-900' : 'text-slate-700'}`}>{label}</div>
        {note && <div className="text-[11px] text-slate-400">{note}</div>}
      </div>
      <div className={`text-sm shrink-0 ${strong ? 'font-black text-gov-navy' : 'font-bold text-slate-800'}`}>{value}</div>
    </div>
  );
}

function Result({ result, tr, onOpenScheme, onOpenProfile, onRecalc, loading }) {
  const { recommended: r, explanation: ex } = result;
  const [showMore, setShowMore] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const hi = result.language === 'hi';
  const name = (p) => (hi ? p.name_hi : p.name);

  return (
    <div id="advisor-result" className="space-y-4">
      {/* Explanation — words only; every figure below is calculated by SchemeSahayak */}
      <div className={`rounded-md border p-5 ${r ? 'bg-[#f0f7ff] border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start gap-2">
          {r ? <CheckCircle2 className="w-6 h-6 text-blue-700 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0" />}
          <div>
            <h2 className="text-lg font-black text-gov-navy">{ex.headline}</h2>
            {ex.why_this_scheme && <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{ex.why_this_scheme}</p>}
            {ex.plan_walkthrough && <p className="mt-2 text-sm text-slate-800 leading-relaxed">{ex.plan_walkthrough}</p>}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-500 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          {ex.source === 'ai'
            ? tr('The wording is AI-written; every rupee figure and the scheme choice are calculated by SchemeSahayak, and figures the calculator did not produce are rejected.', 'शब्दावली एआई द्वारा लिखी गई है; हर रुपये का आँकड़ा और योजना का चयन SchemeSahayak की गणना से है, और जो आँकड़े गणना से नहीं आए वे अस्वीकार कर दिए जाते हैं।')
            : tr('Every figure and the scheme choice are calculated by SchemeSahayak.', 'हर आँकड़ा और योजना का चयन SchemeSahayak द्वारा गणना किया गया है।')}
        </p>
      </div>

      {result.profile_gaps?.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-3">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{tr('Your profile is missing', 'आपकी प्रोफ़ाइल में अधूरा है')}: {result.profile_gaps.join(', ')}. {tr('This can hide schemes you qualify for.', 'इससे वे योजनाएँ छिप सकती हैं जिनके आप पात्र हैं।')}{' '}
            {onOpenProfile && <button onClick={onOpenProfile} className="font-bold underline">{tr('Complete profile', 'प्रोफ़ाइल पूरी करें')}</button>}</span>
        </div>
      )}

      {r && (
        <>
          <Section title={tr('Your funding plan', 'आपकी फंडिंग योजना')} icon={PiggyBank}>
            <div className="text-sm font-bold text-slate-800">{name(r)}</div>
            <div className="divide-y divide-slate-100">
              <Row label={tr('Total project cost', 'कुल परियोजना लागत')} value={rupee(r.funding.projectCost)} strong />
              <Row label={tr('From your own savings', 'आपकी अपनी बचत से')} value={rupee(r.funding.ownFundsNeeded)}
                note={r.funding.ownContributionPct != null ? tr(`${r.funding.ownContributionPct}% own contribution`, `${r.funding.ownContributionPct}% स्वयं का अंशदान`) : tr('The scheme does not state a required contribution', 'योजना में आवश्यक अंशदान निर्दिष्ट नहीं')} />
              {r.funding.uncoveredExcess > 0 && <Row label={tr('Above the scheme\'s limit (you fund this)', 'योजना की सीमा से अधिक (आप वहन करेंगे)')} value={rupee(r.funding.uncoveredExcess)} />}
              <Row label={tr('Loan from the scheme', 'योजना के तहत ऋण')} value={rupee(r.funding.loanPrincipal)} />
              {r.funding.grant && (
                <Row label={tr('Government subsidy / grant', 'सरकारी सब्सिडी / अनुदान')} value={`${r.funding.grant.isCeiling ? tr('up to ', 'अधिकतम ') : ''}${rupee(r.funding.grant.amount)}`}
                  note={{ upfront: tr('Reduces your loan upfront', 'शुरुआत में ऋण घटाता है'), back_ended: tr('Paid later — not deducted from your EMI', 'बाद में मिलती है — ईएमआई से नहीं घटाई'), in_kind: tr('Given as tools/equipment, not cash', 'नकद नहीं, औज़ार/उपकरण के रूप में'), unspecified: tr('Timing not specified', 'समय निर्दिष्ट नहीं') }[r.funding.grant.timing]} />
              )}
            </div>
            {r.funding.surplusOwnFunds > 0 && (
              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded p-2.5">
                {tr(`You have ${rupee(r.funding.surplusOwnFunds)} more savings than this plan needs. Using some of it would mean borrowing less and paying less interest.`,
                  `आपके पास इस योजना की ज़रूरत से ${rupee(r.funding.surplusOwnFunds)} अधिक बचत है। इसका कुछ हिस्सा लगाने से कम उधार और कम ब्याज होगा।`)}
              </p>
            )}
          </Section>

          {r.loan && (
            <Section title={tr('Your loan plan', 'आपकी ऋण योजना')} icon={Landmark}>
              {r.loan.rate ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Stat label={tr('Monthly EMI', 'मासिक ईएमआई')} value={rupee(r.loan.emi)} hi />
                    <Stat label={tr('Total interest', 'कुल ब्याज')} value={rupee(r.loan.totalInterest)} />
                    <Stat label={tr('Total repaid', 'कुल भुगतान')} value={rupee(r.loan.totalRepayment)} />
                  </div>
                  <p className="text-xs text-slate-600">
                    {tr('Rate', 'दर')}: <b>{hi ? r.loan.rate.labelHi : r.loan.rate.label}</b>{r.loan.rate.isEstimate ? ` · ${tr('estimate', 'अनुमान')}` : ''} · {hi ? r.loan.rate.basisHi : r.loan.rate.basis} · {r.loan.tenureMonths} {tr('months', 'महीने')}{r.loan.tenureAssumed ? ` (${tr('assumed', 'मान्य')})` : ''}
                  </p>
                  {r.yearlySchedule?.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="text-left text-slate-500"><th className="py-1">{tr('Year', 'वर्ष')}</th><th>{tr('Principal paid', 'मूलधन')}</th><th>{tr('Interest paid', 'ब्याज')}</th><th>{tr('Balance left', 'शेष')}</th></tr></thead>
                        <tbody>{r.yearlySchedule.map((y) => (
                          <tr key={y.year} className="border-t border-slate-100"><td className="py-1">{y.year}</td><td>{rupee(y.principalPaid)}</td><td>{rupee(y.interestPaid)}</td><td>{rupee(y.closingBalance)}</td></tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3.5 space-y-2.5">
                  <p className="text-sm text-amber-900">
                    {tr(`The bank sets the interest rate for this scheme, so SchemeSahayak will not guess your EMI. The loan would be ${rupee(r.loan.principal)} over ${r.loan.tenureMonths} months.`,
                      `इस योजना की ब्याज दर बैंक तय करता है, इसलिए SchemeSahayak ईएमआई का अनुमान नहीं लगाएगा। ऋण ${rupee(r.loan.principal)} होगा, ${r.loan.tenureMonths} महीनों के लिए।`)}
                  </p>
                  {r.loan.affordableUpToRate != null && (
                    <p className="text-sm font-bold text-amber-900">
                      {tr(`It stays comfortable for you if the bank's rate is ${r.loan.affordableUpToRate}% or lower.`, `यदि बैंक की दर ${r.loan.affordableUpToRate}% या उससे कम है तो यह आपके लिए सुविधाजनक रहेगा।`)}
                    </p>
                  )}
                  <div className="flex gap-2 items-center">
                    <input inputMode="decimal" value={rateInput} onChange={(e) => setRateInput(e.target.value.replace(/[^\d.]/g, ''))}
                      placeholder={tr("Bank's quoted rate %", 'बैंक की बताई दर %')} className={`${inputCls} max-w-[200px]`} />
                    <button type="button" disabled={!rateInput || loading} onClick={() => onRecalc(Number(rateInput))}
                      className="bg-gov-navy text-white text-sm font-bold rounded-md px-4 h-11 disabled:opacity-50">{tr('Calculate EMI', 'ईएमआई निकालें')}</button>
                  </div>
                </div>
              )}
            </Section>
          )}

          {r.affordability && AFF[r.affordability.status] && (
            <div className={`rounded-md border p-4 ${AFF[r.affordability.status].bg}`}>
              <div className={`flex items-center gap-2 font-black ${AFF[r.affordability.status].color}`}>
                {React.createElement(AFF[r.affordability.status].Icon, { className: 'w-5 h-5' })}
                {tr('Affordability', 'वहन-क्षमता')}: {tr(AFF[r.affordability.status].en, AFF[r.affordability.status].hi)}
              </div>
              <p className="mt-1.5 text-sm text-slate-800">
                {tr(`All EMIs would take ${r.affordability.foirPct}% of your monthly income, leaving ${rupee(r.affordability.freeCashAfter)} a month after expenses. `,
                  `सभी किस्तें आपकी मासिक आय का ${r.affordability.foirPct}% लेंगी, खर्चों के बाद ${rupee(r.affordability.freeCashAfter)} प्रति माह बचेंगे। `)}
                {tr('Banks generally like this to stay under about 50%; 35% or less is comfortable.', 'बैंक आम तौर पर इसे लगभग 50% से कम चाहते हैं; 35% या कम सुविधाजनक है।')}
              </p>
            </div>
          )}

          {r.missing_documents?.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 font-black text-red-700 text-sm"><FileWarning className="w-4 h-4" /> {tr('Documents still missing', 'अभी भी छूटे दस्तावेज़')}</div>
              <ul className="mt-1.5 text-sm text-red-900 list-disc pl-5">{r.missing_documents.map((d) => <li key={d}>{d}</li>)}</ul>
              {onOpenScheme && <button onClick={() => onOpenScheme(r.scheme_id)} className="mt-2 text-xs font-bold text-gov-navy underline">{tr('Open the scheme to upload them', 'अपलोड करने के लिए योजना खोलें')}</button>}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {onOpenScheme && <button onClick={() => onOpenScheme(r.scheme_id)} className="bg-gov-saffron hover:bg-orange-700 text-white font-extrabold rounded-md px-5 py-2.5 text-sm">{tr('View scheme & apply', 'योजना देखें और आवेदन करें')}</button>}
            {r.official_link && <a href={r.official_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-gov-navy underline">{tr('Official portal', 'आधिकारिक पोर्टल')} <ExternalLink className="w-3.5 h-3.5" /></a>}
          </div>

          {result.enablers?.length > 0 && (
            <Section title={tr('Also worth asking about', 'यह भी पूछने लायक')} icon={Info}>
              {result.enablers.map((e) => <p key={e.scheme_id} className="text-sm text-slate-700"><b>{hi ? e.name_hi : e.name}:</b> {hi ? e.text_hi : e.text}</p>)}
            </Section>
          )}

          {(r.flags_text?.length > 0) && (
            <Section title={tr('Things to keep in mind', 'ध्यान रखने योग्य बातें')} icon={AlertTriangle}>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">{r.flags_text.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </Section>
          )}
        </>
      )}

      {!r && result.adjustments?.length > 0 && (
        <Section title={tr('What could change this', 'क्या बदलने से बात बन सकती है')} icon={Info}>
          {result.adjustments.map((a) => (
            <div key={a.scheme_id} className="border border-slate-200 rounded-md p-3 text-sm">
              <div className="font-bold text-slate-800">{a.name}</div>
              {a.needs_more_own_funds > 0 && <div className="text-slate-700">{tr(`Needs ${rupee(a.needs_more_own_funds)} more of your own money.`, `आपको अपने पास से ${rupee(a.needs_more_own_funds)} और चाहिए।`)}</div>}
              {a.max_affordable_loan != null && <div className="text-slate-700">{tr(`The most you could comfortably borrow is about ${rupee(a.max_affordable_loan)}.`, `आप आराम से लगभग ${rupee(a.max_affordable_loan)} तक उधार ले सकते हैं।`)}</div>}
            </div>
          ))}
        </Section>
      )}

      {(result.alternatives?.length > 0 || result.blocked?.length > 0 || result.excluded?.length > 0 || result.possible_catalogue_options?.length > 0) && (
        <div>
          <button onClick={() => setShowMore((s) => !s)} className="flex items-center gap-1.5 text-sm font-bold text-gov-navy">
            {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {tr('Other options considered', 'विचार किए गए अन्य विकल्प')}
          </button>
          {showMore && (
            <div className="mt-3 space-y-3">
              {result.alternatives?.length > 0 && <Block title={tr('Also possible for you', 'आपके लिए संभव')}>{result.alternatives.map((a) => (
                <Item key={a.scheme_id} title={name(a)} lines={[a.governmentBenefit > 0 ? tr(`Government support ${rupee(a.governmentBenefit)}`, `सरकारी सहायता ${rupee(a.governmentBenefit)}`) : tr('Loan only — no subsidy', 'केवल ऋण — कोई सब्सिडी नहीं'), a.loan?.emi != null ? tr(`EMI about ${rupee(a.loan.emi)}`, `ईएमआई लगभग ${rupee(a.loan.emi)}`) : null]} />
              ))}</Block>}
              {result.blocked?.length > 0 && <Block title={tr('Eligible, but not workable right now', 'पात्र, पर अभी व्यावहारिक नहीं')}>{result.blocked.map((b) => <Item key={b.scheme_id} title={name(b)} lines={b.reasons_text} />)}</Block>}
              {result.excluded?.length > 0 && <Block title={tr('Not a fit', 'उपयुक्त नहीं')}>{result.excluded.map((b) => <Item key={b.scheme_id} title={name(b)} lines={b.reasons_text} />)}</Block>}
              {result.possible_catalogue_options?.length > 0 && (
                <Block title={tr('Other loan schemes to check (unverified)', 'जाँचने योग्य अन्य ऋण योजनाएँ (असत्यापित)')}>
                  <p className="text-[11px] text-slate-500">{tr('These come from myScheme.gov.in with AI-extracted terms. SchemeSahayak has not verified them — confirm everything on the official page.', 'ये myScheme.gov.in से एआई-निकाली शर्तों के साथ हैं। SchemeSahayak ने इन्हें सत्यापित नहीं किया है — सब कुछ आधिकारिक पेज पर जाँचें।')}</p>
                  {result.possible_catalogue_options.map((o) => (
                    <Item key={o.slug} title={o.name} href={o.official_link}
                      lines={[o.loan_max ? tr(`Up to ${rupee(o.loan_max)}`, `${rupee(o.loan_max)} तक`) : null, o.rate ? `${tr('Rate', 'दर')} ${hi ? o.rate.labelHi : o.rate.label}` : tr('Rate not specified', 'दर निर्दिष्ट नहीं')]} />
                  ))}
                </Block>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3 space-y-1">
        {result.assumptions_text?.filter((a) => !r?.flags_text?.includes(a)).map((a, i) => <p key={i}>• {a}</p>)}
        <p>• {tr('This is guidance, not financial or legal advice. Confirm current terms with the bank and the official scheme portal before you commit.', 'यह मार्गदर्शन है, वित्तीय या कानूनी सलाह नहीं। प्रतिबद्ध होने से पहले बैंक और आधिकारिक पोर्टल से वर्तमान शर्तें जाँचें।')}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, hi }) {
  return (
    <div className={`rounded-md p-3 ${hi ? 'bg-gov-navy text-white' : 'bg-white border border-slate-200'}`}>
      <div className={`text-[11px] font-semibold ${hi ? 'text-slate-200' : 'text-slate-500'}`}>{label}</div>
      <div className={`text-base font-black ${hi ? 'text-white' : 'text-gov-navy'}`}>{value}</div>
    </div>
  );
}
function Block({ title, children }) {
  return <div className="space-y-2"><h4 className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</h4>{children}</div>;
}
function Item({ title, lines = [], href }) {
  return (
    <div className="border border-slate-200 rounded-md p-3">
      <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">{title}{href && <a href={href} target="_blank" rel="noopener noreferrer" className="text-gov-navy"><ExternalLink className="w-3.5 h-3.5" /></a>}</div>
      {lines.filter(Boolean).map((l, i) => <div key={i} className="text-xs text-slate-600">{l}</div>)}
    </div>
  );
}
