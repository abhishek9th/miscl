-- ============================================================================
-- SchemeSetu — Loan/EMI details for the myScheme catalogue.
--
-- Adds structured, source-attributed loan fields to public.myscheme_catalogue so
-- the EMI calculator on a scheme's detail page can compute real numbers instead
-- of guessing an interest rate. Filled by an offline extractor
-- (backend/scripts/extractCatalogueLoanDetails.mjs) that reads ONLY the scheme's
-- own scraped benefits/eligibility prose.
--
-- HONESTY (§5/§36, same policy as 20260923_catalogue_eligibility.sql): a rate is
-- stored ONLY when the official text states one. rate_type distinguishes what
-- kind of number it is so the UI never presents an estimate as a guaranteed
-- rate. null/'{}'/'not_specified' means "not stated", never a fabricated value.
-- Safe to run on an existing project. Idempotent. Non-destructive.
-- ============================================================================

alter table public.myscheme_catalogue add column if not exists is_loan_scheme        boolean not null default false; -- scheme extends a loan / credit facility
alter table public.myscheme_catalogue add column if not exists loan_amount_min       numeric;          -- official minimum loan amount (rupees); null = not stated
alter table public.myscheme_catalogue add column if not exists loan_amount_max       numeric;          -- official maximum loan amount (rupees); null = not stated
alter table public.myscheme_catalogue add column if not exists tenure_min_months     integer;          -- official minimum repayment tenure
alter table public.myscheme_catalogue add column if not exists tenure_max_months     integer;          -- official maximum repayment tenure
alter table public.myscheme_catalogue add column if not exists interest_rate         numeric;          -- official FIXED annual rate (%); set only when rate_type='official_fixed'
alter table public.myscheme_catalogue add column if not exists interest_rate_min     numeric;          -- lower bound of an official published range/lender spread (%)
alter table public.myscheme_catalogue add column if not exists interest_rate_max     numeric;          -- upper bound of an official published range/lender spread (%)
alter table public.myscheme_catalogue add column if not exists rate_type             text;             -- official_fixed | official_range | lender_specific | benchmark_linked | subsidy | not_specified
alter table public.myscheme_catalogue add column if not exists interest_subsidy_pct  numeric;          -- government interest subsidy/subvention (percentage points), distinct from the base lending rate
alter table public.myscheme_catalogue add column if not exists interest_subsidy_note text;             -- how the subsidy applies (e.g. "50% interest reimbursement, capped at Rs.1,00,000, for 5 years")
alter table public.myscheme_catalogue add column if not exists lender_specific_rates jsonb not null default '[]'; -- [{"lender":"SBI","rate":7.5}, ...] when different banks quote different official rates
alter table public.myscheme_catalogue add column if not exists rate_source          text;             -- e.g. "Official Scheme Guidelines", "RBI circular", "NABARD notification"
alter table public.myscheme_catalogue add column if not exists rate_source_url      text;             -- deep link to the official document/page the rate was read from, if available
alter table public.myscheme_catalogue add column if not exists rate_confidence      text;             -- high | medium | low — high=explicit official number, low=inferred/indicative
alter table public.myscheme_catalogue add column if not exists loan_extracted       boolean not null default false;
alter table public.myscheme_catalogue add column if not exists loan_extracted_at    timestamptz;

create index if not exists myscheme_catalogue_is_loan_idx on public.myscheme_catalogue (is_loan_scheme);
-- ============================================================================
