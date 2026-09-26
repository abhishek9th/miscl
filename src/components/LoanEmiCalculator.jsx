import React, { useMemo, useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { useI18n } from '../i18n';
import {
  loanDetailsFromScheme, resolveRate, calculateEmi, clampToBounds, monthsToLabel,
} from '../utils/loanCalculator';

const rupee = (n) => (Number.isFinite(n) ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—');

// Loan & EMI Calculator for a single scheme's detail page. Renders ONLY when
// the scheme is flagged is_loan_scheme (AI-extracted from its own official
// text — see extractCatalogueLoanDetails.mjs). Never fabricates an interest
// rate: resolveRate() decides, from the scheme's own data, whether a real EMI
// can be computed at all, and every number stays labelled with its source.
export default function LoanEmiCalculator({ scheme }) {
  const { tr } = useI18n();
  const loanDetails = useMemo(() => loanDetailsFromScheme(scheme), [scheme]);

  const minAmount = loanDetails?.minLoanAmount ?? 0;
  const maxAmount = loanDetails?.maxLoanAmount ?? (loanDetails?.minLoanAmount ? loanDetails.minLoanAmount * 10 : 1000000);
  const minTenure = loanDetails?.minTenureMonths ?? 1;
  const maxTenure = loanDetails?.maxTenureMonths ?? (loanDetails?.minTenureMonths ? loanDetails.minTenureMonths : 12);

  const [amount, setAmount] = useState(() => clampToBounds(loanDetails?.maxLoanAmount ?? loanDetails?.minLoanAmount ?? minAmount, minAmount, maxAmount));
  const [tenure, setTenure] = useState(() => clampToBounds(loanDetails?.maxTenureMonths ?? loanDetails?.minTenureMonths ?? maxTenure, minTenure, maxTenure));

  if (!loanDetails) return null;

  const rateInfo = resolveRate(loanDetails);
  const result = rateInfo.canCalculate ? calculateEmi(amount, rateInfo.rate, tenure) : null;

  const hasAmountRange = Number.isFinite(loanDetails.minLoanAmount) || Number.isFinite(loanDetails.maxLoanAmount);
  const hasTenureRange = Number.isFinite(loanDetails.minTenureMonths) || Number.isFinite(loanDetails.maxTenureMonths);

  return (
    <section className="gov-card p-5 space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-extrabold text-gov-navy">
        <Calculator className="w-5 h-5 text-gov-saffron" /> {tr('Loan & EMI Calculator', 'ऋण एवं ईएमआई कैलकुलेटर')}
      </h3>

      {hasAmountRange ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">{tr('Loan Amount', 'ऋण राशि')}</span>
            <span className="font-extrabold text-gov-navy">{rupee(amount)}</span>
          </div>
          <input
            type="range" min={minAmount} max={maxAmount} step={Math.max(1000, Math.round((maxAmount - minAmount) / 100) || 1000)}
            value={amount} onChange={(e) => setAmount(clampToBounds(Number(e.target.value), minAmount, maxAmount))}
            className="w-full accent-gov-saffron"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{rupee(minAmount)}</span>
            <span>{rupee(maxAmount)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">{tr('Official minimum/maximum loan amount not specified for this scheme.', 'इस योजना के लिए न्यूनतम/अधिकतम ऋण राशि निर्दिष्ट नहीं है।')}</p>
      )}

      {hasTenureRange ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">{tr('Loan Tenure', 'ऋण अवधि')}</span>
            <span className="font-extrabold text-gov-navy">{monthsToLabel(tenure)}</span>
          </div>
          <input
            type="range" min={minTenure} max={maxTenure} step={1}
            value={tenure} onChange={(e) => setTenure(clampToBounds(Number(e.target.value), minTenure, maxTenure))}
            className="w-full accent-gov-saffron"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{monthsToLabel(minTenure)}</span>
            <span>{monthsToLabel(maxTenure)}</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">{tr('Official repayment tenure not specified for this scheme.', 'इस योजना के लिए आधिकारिक चुकौती अवधि निर्दिष्ट नहीं है।')}</p>
      )}

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">{tr('Interest Rate', 'ब्याज दर')}</span>
          <span className="font-extrabold text-gov-navy">{rateInfo.label || tr('Not specified', 'निर्दिष्ट नहीं')}</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">{rateInfo.note}</p>
        {rateInfo.mode === 'subsidy' && Number.isFinite(rateInfo.baseRate) && (
          <div className="text-xs text-slate-600 pt-1 space-y-0.5">
            <p>{tr('Base Interest Rate', 'मूल ब्याज दर')}: <b>{round1(rateInfo.baseRate)}%</b></p>
            {Number.isFinite(rateInfo.subsidyPct) && <p>{tr('Government Interest Subsidy', 'सरकारी ब्याज सब्सिडी')}: <b>{round1(rateInfo.subsidyPct)}%</b></p>}
            <p>{tr('Effective Interest Cost', 'प्रभावी ब्याज लागत')}: <b>{round1(rateInfo.rate)}%</b></p>
          </div>
        )}
        {rateInfo.mode === 'lender_specific' && Array.isArray(rateInfo.lenderRates) && rateInfo.lenderRates.length > 0 && (
          <ul className="text-xs text-slate-600 pt-1 space-y-0.5">
            {rateInfo.lenderRates.map((lr, i) => (
              <li key={i}>{lr.lender}: <b>{lr.rate}%</b></li>
            ))}
          </ul>
        )}
      </div>

      {result ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label={tr('Monthly EMI', 'मासिक ईएमआई')} value={rupee(result.emi)} highlight />
          <Stat label={tr('Total Interest', 'कुल ब्याज')} value={rupee(result.totalInterest)} />
          <Stat label={tr('Total Repayment', 'कुल भुगतान')} value={rupee(result.totalRepayment)} />
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-amber-900">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">{tr("EMI cannot be calculated until the lending institution confirms a rate. The loan amount and tenure shown above are still this scheme's official limits.", 'ऋणदाता संस्था द्वारा दर तय होने तक ईएमआई की गणना नहीं की जा सकती। ऊपर दी गई ऋण राशि और अवधि अभी भी इस योजना की आधिकारिक सीमाएँ हैं।')}</p>
        </div>
      )}

      <p className="text-[11px] text-slate-400 leading-relaxed">
        {tr('Assumes a standard reducing-balance monthly EMI. Actual schedule may differ (moratorium, processing fees, collateral, or non-monthly repayment set by the lender).', 'मानक घटते शेष मासिक ईएमआई पर आधारित अनुमान। वास्तविक अनुसूची भिन्न हो सकती है (मोरेटोरियम, प्रोसेसिंग शुल्क, संपार्श्विक, या ऋणदाता द्वारा तय गैर-मासिक चुकौती)।')}
      </p>
      <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
        {tr('Source & rate information: ', 'स्रोत एवं दर जानकारी: ')}
        {loanDetails.rateSource || tr('Official scheme text (AI-extracted)', 'आधिकारिक योजना पाठ (एआई-निष्कर्षित)')}
        {loanDetails.rateConfidence ? ` · ${tr('confidence', 'विश्वास')}: ${loanDetails.rateConfidence}` : ''}
      </p>
    </section>
  );
}

function round1(n) { return Math.round(n * 10) / 10; }

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? 'bg-gov-navy text-white' : 'bg-white border border-slate-200'}`}>
      <p className={`text-[11px] font-semibold ${highlight ? 'text-slate-200' : 'text-slate-500'}`}>{label}</p>
      <p className={`text-lg font-black ${highlight ? 'text-white' : 'text-gov-navy'}`}>{value}</p>
    </div>
  );
}
