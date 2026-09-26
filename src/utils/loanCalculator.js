// Loan/EMI math for scheme detail pages. Pure functions, no React — usable from
// the UI component and from a plain `node` test script.
//
// HONESTY RULE: this module NEVER invents an interest rate. It only computes an
// EMI when the scheme's own extracted `loanDetails` supplies a usable rate, and
// it labels every number with where it came from (official / estimated /
// indicative), per rate_type. See supabase/migrations/20260926_catalogue_loan_details.sql
// and backend/scripts/extractCatalogueLoanDetails.mjs for how loanDetails is filled.

export const RATE_TYPES = {
  OFFICIAL_FIXED: 'official_fixed',
  OFFICIAL_RANGE: 'official_range',
  LENDER_SPECIFIC: 'lender_specific',
  BENCHMARK_LINKED: 'benchmark_linked',
  SUBSIDY: 'subsidy',
  NOT_SPECIFIED: 'not_specified',
};

const round = (n) => Math.round(n);

// Reads the raw catalogue row's loan_* columns into the loanDetails shape used
// by the calculator. Returns null if the scheme isn't flagged as a loan scheme.
export function loanDetailsFromScheme(scheme) {
  if (!scheme || !scheme.is_loan_scheme) return null;
  return {
    isLoanScheme: true,
    minLoanAmount: numOrNull(scheme.loan_amount_min),
    maxLoanAmount: numOrNull(scheme.loan_amount_max),
    minTenureMonths: numOrNull(scheme.tenure_min_months),
    maxTenureMonths: numOrNull(scheme.tenure_max_months),
    interestRate: numOrNull(scheme.interest_rate),
    interestRateMin: numOrNull(scheme.interest_rate_min),
    interestRateMax: numOrNull(scheme.interest_rate_max),
    rateType: scheme.rate_type || RATE_TYPES.NOT_SPECIFIED,
    interestSubsidyPct: numOrNull(scheme.interest_subsidy_pct),
    interestSubsidyNote: scheme.interest_subsidy_note || null,
    lenderSpecificRates: Array.isArray(scheme.lender_specific_rates) ? scheme.lender_specific_rates : [],
    rateSource: scheme.rate_source || null,
    rateSourceUrl: scheme.rate_source_url || null,
    rateConfidence: scheme.rate_confidence || null,
  };
}

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Resolves loanDetails into: { rate, rateLabel, rateIsEstimate, canCalculate, mode, subsidy }
// `mode` mirrors the spec's Cases A-F so the UI can render the right disclaimer.
export function resolveRate(loanDetails) {
  const d = loanDetails || {};
  const lenderRates = (d.lenderSpecificRates || [])
    .map((r) => Number(r?.rate))
    .filter((n) => Number.isFinite(n));

  // Case A: official fixed rate
  if (d.rateType === RATE_TYPES.OFFICIAL_FIXED && Number.isFinite(d.interestRate)) {
    return {
      mode: 'official_fixed',
      rate: d.interestRate,
      rateIsEstimate: false,
      canCalculate: true,
      label: `${d.interestRate}%`,
      note: 'Official scheme rate',
    };
  }

  // Case B: official range → midpoint is an ESTIMATE only
  if (d.rateType === RATE_TYPES.OFFICIAL_RANGE && Number.isFinite(d.interestRateMin) && Number.isFinite(d.interestRateMax)) {
    const mid = (d.interestRateMin + d.interestRateMax) / 2;
    return {
      mode: 'official_range',
      rate: mid,
      rateIsEstimate: true,
      canCalculate: true,
      label: `~${round1(mid)}%`,
      note: `Estimated rate: ${round1(mid)}% (based on the official published range of ${d.interestRateMin}%–${d.interestRateMax}%)`,
    };
  }

  // Case C: multiple lenders — mode if data supports "typical", else indicative
  if (d.rateType === RATE_TYPES.LENDER_SPECIFIC && lenderRates.length > 0) {
    const modeRate = computeMode(lenderRates);
    // "Typical"/"most common" only when the mode actually represents at least
    // half the observed lenders (and isn't just one of several tied values).
    const isTypical = modeRate.count >= 2 && modeRate.count >= Math.ceil(lenderRates.length / 2);
    return {
      mode: 'lender_specific',
      rate: modeRate.value,
      rateIsEstimate: !isTypical,
      canCalculate: true,
      label: `${round1(modeRate.value)}%`,
      note: isTypical
        ? `Most common rate among participating lenders: ${round1(modeRate.value)}% (${modeRate.count} of ${lenderRates.length} lenders)`
        : 'Rates vary by lender. Showing an indicative rate based on available lender data.',
      lenderRates: d.lenderSpecificRates,
    };
  }

  // Case D: interest subsidy — keep base rate and subsidy separate
  if (d.rateType === RATE_TYPES.SUBSIDY) {
    const base = Number.isFinite(d.interestRate) ? d.interestRate : (Number.isFinite(d.interestRateMin) && Number.isFinite(d.interestRateMax) ? (d.interestRateMin + d.interestRateMax) / 2 : null);
    if (base == null) {
      return {
        mode: 'subsidy_no_base_rate',
        rate: null,
        rateIsEstimate: false,
        canCalculate: false,
        label: null,
        note: 'This scheme provides an interest subsidy, but the base lending rate is set by the lender and not specified in official scheme information.',
        subsidyPct: d.interestSubsidyPct,
        subsidyNote: d.interestSubsidyNote,
      };
    }
    const effective = Number.isFinite(d.interestSubsidyPct) ? Math.max(0, base - d.interestSubsidyPct) : base;
    return {
      mode: 'subsidy',
      rate: effective,
      rateIsEstimate: !Number.isFinite(d.interestRate),
      canCalculate: true,
      label: `${round1(effective)}%`,
      note: d.interestSubsidyNote || 'Government interest subsidy applied to the base lending rate.',
      baseRate: base,
      subsidyPct: d.interestSubsidyPct,
    };
  }

  // Case E: benchmark-linked / profile-dependent
  if (d.rateType === RATE_TYPES.BENCHMARK_LINKED) {
    const indicative = Number.isFinite(d.interestRate) ? d.interestRate
      : (Number.isFinite(d.interestRateMin) && Number.isFinite(d.interestRateMax) ? (d.interestRateMin + d.interestRateMax) / 2 : null);
    return {
      mode: 'benchmark_linked',
      rate: indicative,
      rateIsEstimate: indicative != null,
      canCalculate: indicative != null,
      label: indicative != null ? `~${round1(indicative)}% (Indicative)` : null,
      note: 'Interest rate is lender/profile dependent. Final rate will be determined by the lending institution.',
    };
  }

  // Case F: nothing reliable
  return {
    mode: 'not_specified',
    rate: null,
    rateIsEstimate: false,
    canCalculate: false,
    label: null,
    note: 'Interest rate not specified in the available official scheme information. Final EMI will depend on the lending institution.',
  };
}

function round1(n) { return Math.round(n * 10) / 10; }

function computeMode(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  let best = { value: values[0], count: 0 };
  for (const [value, count] of counts) if (count > best.count) best = { value, count };
  return best;
}

// Standard reducing-balance EMI. annualRatePct e.g. 8 for 8%. months = tenure.
// Returns null fields if the rate/months/principal are unusable (rate 0 handled).
export function calculateEmi(principal, annualRatePct, months) {
  const P = Number(principal);
  const n = Number(months);
  if (!Number.isFinite(P) || P <= 0 || !Number.isFinite(n) || n <= 0) return null;

  if (!Number.isFinite(annualRatePct) || annualRatePct <= 0) {
    // 0%/unusable rate → straight-line repayment, no interest.
    const emi = P / n;
    return { emi: round(emi), totalRepayment: round(emi * n), totalInterest: 0 };
  }

  const r = annualRatePct / 12 / 100;
  const factor = Math.pow(1 + r, n);
  const emi = (P * r * factor) / (factor - 1);
  const totalRepayment = emi * n;
  const totalInterest = totalRepayment - P;
  return { emi: round(emi), totalRepayment: round(totalRepayment), totalInterest: round(totalInterest) };
}

// Clamps a requested amount/tenure into the scheme's official bounds.
export function clampToBounds(value, min, max) {
  let v = Number(value);
  if (!Number.isFinite(v)) v = min ?? max ?? 0;
  if (Number.isFinite(min)) v = Math.max(v, min);
  if (Number.isFinite(max)) v = Math.min(v, max);
  return v;
}

export function monthsToLabel(months) {
  if (!Number.isFinite(months)) return '';
  if (months % 12 === 0) return `${months / 12} ${months === 12 ? 'year' : 'years'}`;
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${y}y ${m}m`;
}
