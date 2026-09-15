-- ============================================================================
-- SchemeSetu — Application Readiness & Document Checker
--
-- REUSE CHECK (no duplicate tables created):
--   - User profile data: public.profiles, eligibility_profile, employment,
--     education, agriculture_profile, family_members (20260915), identity
--     status via identity_documents_sensitive (20260916, masked only).
--   - Uploaded documents: public.user_documents (20260911 + 20260916 extension)
--     — already has document_type, verification_status, expiry_date.
--   - Scheme catalogue key: public.schemes (20260917) — scheme_requirements
--     below references the SAME scheme_id used everywhere (SCHEMES[].id in
--     src/data/schemes.js).
--
-- NEW in this migration (nothing above covers these):
--   1. scheme_requirements — the data-driven, verifiable source of truth for
--      what a scheme actually requires, per official sources. This is what
--      the requirement engine evaluates; Groq never invents rules (see
--      backend/services/requirementEngine.js).
--   2. document_availability — lets a user mark "I have this physically" for
--      a document type WITHOUT uploading a file to SchemeSetu. user_documents
--      requires a real file_path (NOT NULL) so it cannot represent this state;
--      this table is the honest, separate tracker for that.
--   3. partner_centers — CSC / Jan Seva Kendra / verified-partner directory
--      for "Find help near me". Seeded EMPTY on purpose — SchemeSetu must
--      never fabricate a physical partner or its verification status; real
--      rows must be added from verified sources before this feature can
--      recommend anywhere.
-- Safe to run on an existing project. Idempotent. Non-destructive.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. SCHEME_REQUIREMENTS
-- ---------------------------------------------------------------------------
create table if not exists public.scheme_requirements (
  id                          uuid primary key default gen_random_uuid(),
  scheme_id                   text not null references public.schemes(scheme_id) on delete cascade,
  requirement_key             text not null,           -- e.g. 'sc_certificate'
  requirement_name            text not null,           -- e.g. 'SC Certificate'
  description                 text,
  requirement_type            text not null,
  required                    boolean not null default true,
  condition                   jsonb not null default '{}'::jsonb, -- free-form extra condition, e.g. {min_disability_percent: 40}

  -- Applicability filters — a requirement only applies when the user's
  -- profile matches ALL of the non-null filters below (arrays = "one of").
  -- Leaving a filter null/empty means "applies to everyone".
  applicable_categories       text[],   -- e.g. {sc,st} — matches profiles.social_category
  applicable_gender           text[],   -- e.g. {female}
  applicable_disability_status boolean, -- true = only PWD applicants
  applicable_occupation       text[],   -- matches employment.employment_status, e.g. {farmer}
  applicable_age_min          integer,
  applicable_age_max          integer,

  -- Provenance (§ Scheme Requirement Sources) — never treated as authoritative
  -- without these; UI always shows source_name + link.
  source_url                  text,
  source_name                 text not null,
  source_type                 text not null default 'official_portal',
  source_last_verified        date,

  priority                    integer not null default 3,  -- 1 (most critical) .. 5
  delay_risk                  text not null default 'MEDIUM',
  rejection_risk              text not null default 'MEDIUM',

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  unique (scheme_id, requirement_key),
  constraint scheme_req_type_chk check (requirement_type in (
    'eligibility','document','personal_information','financial_information','education',
    'address','identity','bank','project_information','category_specific',
    'disability_specific','gender_specific','occupation_specific','application_specific'
  )),
  constraint scheme_req_source_type_chk check (source_type in (
    'official_portal','ministry_website','official_notification','official_pdf'
  )),
  constraint scheme_req_delay_risk_chk check (delay_risk in ('CRITICAL','HIGH','MEDIUM','LOW')),
  constraint scheme_req_rejection_risk_chk check (rejection_risk in ('CRITICAL','HIGH','MEDIUM','LOW'))
);

create index if not exists scheme_requirements_scheme_idx on public.scheme_requirements (scheme_id);

drop trigger if exists trg_scheme_requirements_updated_at on public.scheme_requirements;
create trigger trg_scheme_requirements_updated_at before update on public.scheme_requirements
  for each row execute function public.set_updated_at();

alter table public.scheme_requirements enable row level security;
drop policy if exists "scheme_requirements_select_all" on public.scheme_requirements;
create policy "scheme_requirements_select_all" on public.scheme_requirements
  for select using (auth.role() = 'authenticated');
-- Writable only by the service role — this is curated reference data, not user data.

-- ---------------------------------------------------------------------------
-- 2. DOCUMENT_AVAILABILITY — per-document-type state that doesn't require an
--    uploaded file. Complements user_documents (which represents an actually
--    uploaded file) rather than replacing it.
-- ---------------------------------------------------------------------------
create table if not exists public.document_availability (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  status       text not null default 'unknown',
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, document_type),
  constraint document_availability_status_chk check (status in (
    'available_online','available_physical','uploaded','verified','missing','expired','unknown'
  ))
);

drop trigger if exists trg_document_availability_updated_at on public.document_availability;
create trigger trg_document_availability_updated_at before update on public.document_availability
  for each row execute function public.set_updated_at();

alter table public.document_availability enable row level security;
drop policy if exists "doc_avail_select_own" on public.document_availability;
create policy "doc_avail_select_own" on public.document_availability for select using (auth.uid() = user_id);
drop policy if exists "doc_avail_insert_own" on public.document_availability;
create policy "doc_avail_insert_own" on public.document_availability for insert with check (auth.uid() = user_id);
drop policy if exists "doc_avail_update_own" on public.document_availability;
create policy "doc_avail_update_own" on public.document_availability for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "doc_avail_delete_own" on public.document_availability;
create policy "doc_avail_delete_own" on public.document_availability for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. PARTNER_CENTERS — CSC / Jan Seva Kendra / verified partner directory.
--    Seeded EMPTY (see header). The frontend must never imply government
--    authorization unless verification_status = 'verified' AND
--    government_affiliation is set.
-- ---------------------------------------------------------------------------
create table if not exists public.partner_centers (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  center_type           text not null,
  address               text,
  state                 text,
  district              text,
  city                  text,
  pincode               text,
  latitude              numeric,
  longitude             numeric,
  phone                 text,
  email                 text,
  services              text[] not null default '{}',
  verification_status   text not null default 'unknown',
  government_affiliation text,   -- e.g. 'CSC SPV', 'State IT Department' — null if none
  scheme_support        text[] not null default '{}',  -- scheme_id[] this center can help with, empty = general
  opening_hours         text,
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint partner_center_type_chk check (center_type in (
    'CSC','Jan Seva Kendra','SchemeSetu Partner','Government Service Center','Private Assistance Center'
  )),
  constraint partner_verification_chk check (verification_status in (
    'verified','unverified','unknown'
  )),
  constraint partner_pincode_chk check (pincode is null or pincode ~ '^[0-9]{6}$')
);

create index if not exists partner_centers_state_idx on public.partner_centers (state, district);
create index if not exists partner_centers_active_idx on public.partner_centers (active) where active = true;

drop trigger if exists trg_partner_centers_updated_at on public.partner_centers;
create trigger trg_partner_centers_updated_at before update on public.partner_centers
  for each row execute function public.set_updated_at();

alter table public.partner_centers enable row level security;
drop policy if exists "partner_centers_select_active" on public.partner_centers;
create policy "partner_centers_select_active" on public.partner_centers
  for select using (auth.role() = 'authenticated' and active = true);
-- Writable only by the service role — center verification must be curated,
-- never self-declared by a client request.

-- ---------------------------------------------------------------------------
-- 4. SEED — PMEGP requirements only, as the flagship worked example. Sourced
--    from the publicly published PMEGP/KVIC guidelines (kviconline.gov.in).
--    This is a STARTING set covering the commonly-published rules, not a
--    substitute for legal text — extend/correct via this table as official
--    guidelines are verified for more schemes and finer conditions.
-- ---------------------------------------------------------------------------
do $$
declare
  v_source_name text := 'KVIC — PMEGP Guidelines';
  v_source_url  text := 'https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp';
begin
  -- Ensure the scheme row exists (schemes table from 20260917 migration).
  insert into public.schemes (scheme_id, name, is_active)
  values ('scheme_pmegp', 'Prime Minister Employment Generation Programme (PMEGP)', true)
  on conflict (scheme_id) do nothing;

  insert into public.scheme_requirements
    (scheme_id, requirement_key, requirement_name, description, requirement_type, required,
     condition, applicable_categories, applicable_gender, applicable_disability_status,
     applicable_occupation, applicable_age_min, applicable_age_max,
     source_url, source_name, source_type, source_last_verified, priority, delay_risk, rejection_risk)
  values
    ('scheme_pmegp', 'min_age', 'Minimum age 18 years', 'Applicant must be at least 18 years old at the time of application.',
     -- The 18-year threshold lives in `condition`, NOT applicable_age_min —
     -- that column is an APPLICABILITY filter (see requirementEngine.js);
     -- using it here would hide a failing check as "not applicable" instead
     -- of correctly failing it.
     'eligibility', true, '{"min_age": 18}', null, null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 1, 'CRITICAL', 'CRITICAL'),

    ('scheme_pmegp', 'min_education', 'Minimum education: 8th pass',
     'For projects above ₹10 lakh (manufacturing) / ₹5 lakh (service), at least Class 8 pass is required.',
     'education', true, '{}', null, null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 2, 'HIGH', 'MEDIUM'),

    ('scheme_pmegp', 'identity_proof', 'Identity Proof', 'Aadhaar card or another accepted government photo ID.',
     'identity', true, '{}', null, null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 1, 'CRITICAL', 'CRITICAL'),

    ('scheme_pmegp', 'address_proof', 'Address / Domicile Proof', 'Proof of residence in the area the unit will be set up.',
     'address', true, '{}', null, null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 1, 'HIGH', 'HIGH'),

    ('scheme_pmegp', 'sc_certificate', 'SC Certificate', 'Valid Scheduled Caste certificate issued by a competent authority.',
     'category_specific', true, '{}', array['sc'], null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 1, 'HIGH', 'HIGH'),

    ('scheme_pmegp', 'st_certificate', 'ST Certificate', 'Valid Scheduled Tribe certificate issued by a competent authority.',
     'category_specific', true, '{}', array['st'], null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 1, 'HIGH', 'HIGH'),

    ('scheme_pmegp', 'obc_certificate', 'OBC (Non-Creamy Layer) Certificate', 'Valid OBC certificate with non-creamy-layer status, issued within the validity period specified by the scheme.',
     'category_specific', true, '{}', array['obc'], null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 1, 'HIGH', 'HIGH'),

    ('scheme_pmegp', 'ews_certificate', 'EWS Certificate', 'Economically Weaker Section certificate, if claiming EWS-category benefit.',
     'category_specific', true, '{}', array['ews'], null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 2, 'MEDIUM', 'MEDIUM'),

    ('scheme_pmegp', 'minority_certificate', 'Minority Community Certificate', 'Certificate confirming minority-community status, if applicable to the concession claimed.',
     'category_specific', false, '{}', array['minorities'], null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 3, 'LOW', 'LOW'),

    ('scheme_pmegp', 'disability_certificate', 'Disability Certificate', 'Valid disability certificate, required to claim PwD category benefits/relaxation.',
     'disability_specific', true, '{}', null, null, true, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 1, 'HIGH', 'HIGH'),

    -- The age relaxation (35 -> 45) applies if ANY ONE of category/gender/
    -- disability qualifies — real-world eligibility is an OR across these
    -- attributes. The requirement engine only ANDs filters within a single
    -- row, so this is modelled as three independent rows (one per qualifying
    -- attribute) rather than one row with all three ANDed together, which
    -- would incorrectly require SC/ST/OBC *and* female *and* PwD all at once.
    ('scheme_pmegp', 'age_relaxation_category', 'Relaxed age limit (up to 45 years) — SC/ST/OBC',
     'The upper age limit of 35 years is relaxed to 45 years for SC/ST/OBC applicants.',
     'eligibility', false, '{}', array['sc','st','obc'], null, null, null, null, 45,
     v_source_url, v_source_name, 'official_portal', current_date, 3, 'LOW', 'LOW'),

    ('scheme_pmegp', 'age_relaxation_gender', 'Relaxed age limit (up to 45 years) — Women',
     'The upper age limit of 35 years is relaxed to 45 years for women applicants.',
     'eligibility', false, '{}', null, array['female'], null, null, null, 45,
     v_source_url, v_source_name, 'official_portal', current_date, 3, 'LOW', 'LOW'),

    ('scheme_pmegp', 'age_relaxation_disability', 'Relaxed age limit (up to 45 years) — PwD',
     'The upper age limit of 35 years is relaxed to 45 years for persons with disabilities.',
     'eligibility', false, '{}', null, null, true, null, null, 45,
     v_source_url, v_source_name, 'official_portal', current_date, 3, 'LOW', 'LOW'),

    ('scheme_pmegp', 'income_certificate', 'Income Certificate', 'PMEGP has no family-income ceiling, but many implementing banks/DIC offices still request an income certificate to process the loan application.',
     'financial_information', true, '{}', null, null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 2, 'MEDIUM', 'MEDIUM'),

    ('scheme_pmegp', 'bank_account', 'Bank Account Details', 'An active bank account is required to disburse the loan and subsidy.',
     'bank', true, '{}', null, null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 1, 'HIGH', 'HIGH'),

    ('scheme_pmegp', 'project_report', 'Project Report', 'A detailed project report describing the proposed micro-enterprise, cost, and viability.',
     'project_information', true, '{}', null, null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 1, 'CRITICAL', 'HIGH'),

    ('scheme_pmegp', 'business_new', 'New unit only', 'PMEGP funds only NEW micro-enterprises — existing units already availing subsidy under PMEGP/REGP/other government schemes are not eligible.',
     'eligibility', true, '{}', null, null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 1, 'CRITICAL', 'CRITICAL'),

    ('scheme_pmegp', 'education_certificate', 'Educational Qualification Certificate', 'Marksheet/certificate proving the minimum education requirement where the project cost requires it.',
     'education', false, '{}', null, null, null, null, null, null,
     v_source_url, v_source_name, 'official_portal', current_date, 2, 'MEDIUM', 'LOW')
  on conflict do nothing;
end $$;
-- ============================================================================
