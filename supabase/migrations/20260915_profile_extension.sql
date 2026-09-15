-- ============================================================================
-- SchemeSetu — Reusable onboarding profile schema (part 1/3)
-- Non-sensitive, broadly-reusable profile data collected at first-time
-- onboarding: name parts, address, eligibility, family, education, employment,
-- agriculture, and consent records.
--
-- DESIGN PRINCIPLE (§17 of the spec):
--   USER PROFILE → STANDARDIZED DATA → SCHEME FIELD MAPPING → FORM FIELD
-- These tables hold the standardized, reusable profile. Scheme-specific data
-- lives in user_scheme_data (see 20260917_scheme_field_mapping.sql), not here.
--
-- REUSE, NOT DUPLICATION — before adding a column/table this migration checks
-- what already exists in public.profiles (from 20260911_schemesetu_profiles.sql):
--   already have -> reused as-is, NOT duplicated:
--     full_name, gender, marital_status, social_category (= "category"),
--     disability_status (= "pwd_status"), state (kept as current-location
--     state used by scheme filtering), district, occupation, education_level,
--     family_size, annual_income (kept as the primary/household income figure
--     already read by filterService.js — NOT renamed, to avoid breaking the
--     existing matching code), date_of_birth, aadhaar_number, pan_number.
--   aadhaar_number / pan_number already exist on profiles as PLAINTEXT columns
--     — that contradicts the "highly sensitive, encrypted" requirement. They
--     are superseded by the new encrypted public.identity_documents_sensitive
--     table (part 2). We do NOT drop them here (non-destructive migration);
--     20260916_sensitive_identity_bank.sql backfills any existing plaintext
--     values into the encrypted table via a Node script, then nulls them out.
--   new columns actually needed -> added below.
-- Safe to run on an existing project. Idempotent. Non-destructive.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES — additive columns only.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists first_name           text;
alter table public.profiles add column if not exists middle_name          text;
alter table public.profiles add column if not exists last_name            text;
alter table public.profiles add column if not exists fathers_name         text;
alter table public.profiles add column if not exists mothers_name         text;
alter table public.profiles add column if not exists spouse_name          text;
alter table public.profiles add column if not exists nationality          text default 'Indian';
-- domicile_state is deliberately distinct from `state` (which the existing app
-- uses as "current location for scheme discovery" — see filterService.js /
-- App.jsx userState). A user's official domicile can differ from where they
-- currently are; keeping both avoids silently changing existing behaviour.
alter table public.profiles add column if not exists domicile_state       text;
alter table public.profiles add column if not exists preferred_language   text; -- e.g. 'en','hi','ta'... matches src/i18n.jsx language codes
alter table public.profiles add column if not exists annual_personal_income numeric;
alter table public.profiles add column if not exists number_of_dependents   integer;
-- NOTE: `profile_photo` is intentionally NOT a new column — the existing
-- `live_photo_url` (private "faces" bucket) already serves as the user's
-- profile photo everywhere in the UI (Header, ProfilePanel). Adding a second
-- photo field would duplicate a value the app already has.

-- full_name becomes DERIVED once name parts exist, instead of being
-- independently editable (spec §1). Existing rows that only ever had a single
-- `full_name` (no parts) are left untouched — the trigger only recomputes it
-- once first_name is populated (e.g. via the onboarding wizard), so it never
-- overwrites a legacy value with nulls.
create or replace function public.compute_profile_full_name()
returns trigger language plpgsql as $$
begin
  if new.first_name is not null and length(trim(new.first_name)) > 0 then
    new.full_name := trim(regexp_replace(
      concat_ws(' ', new.first_name, nullif(trim(coalesce(new.middle_name, '')), ''), new.last_name),
      '\s+', ' ', 'g'
    ));
  end if;
  return new;
end $$;

drop trigger if exists trg_profiles_full_name on public.profiles;
create trigger trg_profiles_full_name
  before insert or update of first_name, middle_name, last_name on public.profiles
  for each row execute function public.compute_profile_full_name();

create index if not exists profiles_domicile_state_idx on public.profiles (domicile_state);

-- ---------------------------------------------------------------------------
-- 2. ADDRESSES — supports multiple addresses per user (permanent / current).
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  address_id     uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  address_type   text not null default 'current',   -- 'permanent' | 'current'
  address_line_1 text,
  address_line_2 text,
  village        text,
  locality       text,
  city           text,
  district       text,
  sub_district   text,          -- tehsil
  state          text,
  country        text not null default 'India',
  pincode        text,
  is_primary     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint addresses_type_chk check (address_type in ('permanent','current')),
  -- Loose but useful format guard; India PIN codes are 6 digits.
  constraint addresses_pincode_chk check (pincode is null or pincode ~ '^[0-9]{6}$'),
  unique (user_id, address_type)  -- one permanent + one current row per user
);

create index if not exists addresses_user_idx on public.addresses (user_id);

drop trigger if exists trg_addresses_updated_at on public.addresses;
create trigger trg_addresses_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

alter table public.addresses enable row level security;
drop policy if exists "addresses_select_own" on public.addresses;
create policy "addresses_select_own" on public.addresses for select using (auth.uid() = user_id);
drop policy if exists "addresses_insert_own" on public.addresses;
create policy "addresses_insert_own" on public.addresses for insert with check (auth.uid() = user_id);
drop policy if exists "addresses_update_own" on public.addresses;
create policy "addresses_update_own" on public.addresses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "addresses_delete_own" on public.addresses;
create policy "addresses_delete_own" on public.addresses for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. ELIGIBILITY_PROFILE — one row per user. Reuses profiles.social_category
--    (as "category") and profiles.disability_status (as "pwd_status") rather
--    than duplicating them here; only the fields NOT already on profiles live
--    in this table.
-- ---------------------------------------------------------------------------
create table if not exists public.eligibility_profile (
  user_id                          uuid primary key references auth.users(id) on delete cascade,
  caste_community                  text,        -- free text, only when relevant (e.g. specific SC/ST/OBC sub-caste)
  minority_status                  boolean,
  disability_percentage            numeric,
  disability_type                  text,
  rural_urban                      text,        -- 'rural' | 'urban'
  bpl_status                       boolean,
  ration_card_status               boolean,
  ration_card_number               text,
  economically_weaker_section_status boolean,
  ex_serviceman_status             boolean,
  government_employee_status       boolean,
  created_at                       timestamptz not null default now(),
  updated_at                       timestamptz not null default now(),
  constraint eligibility_rural_urban_chk check (rural_urban is null or rural_urban in ('rural','urban'))
);

drop trigger if exists trg_eligibility_updated_at on public.eligibility_profile;
create trigger trg_eligibility_updated_at before update on public.eligibility_profile
  for each row execute function public.set_updated_at();

alter table public.eligibility_profile enable row level security;
drop policy if exists "eligibility_select_own" on public.eligibility_profile;
create policy "eligibility_select_own" on public.eligibility_profile for select using (auth.uid() = user_id);
drop policy if exists "eligibility_insert_own" on public.eligibility_profile;
create policy "eligibility_insert_own" on public.eligibility_profile for insert with check (auth.uid() = user_id);
drop policy if exists "eligibility_update_own" on public.eligibility_profile;
create policy "eligibility_update_own" on public.eligibility_profile for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "eligibility_delete_own" on public.eligibility_profile;
create policy "eligibility_delete_own" on public.eligibility_profile for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. FAMILY_MEMBERS — multiple rows per user.
-- ---------------------------------------------------------------------------
create table if not exists public.family_members (
  family_member_id       uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  name                   text not null,
  relationship           text,
  date_of_birth          date,
  gender                 text,
  occupation             text,
  education_level        text,
  annual_income          numeric,
  dependent_status       boolean,
  disability_status      boolean,
  government_employee_status boolean,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists family_members_user_idx on public.family_members (user_id);

drop trigger if exists trg_family_members_updated_at on public.family_members;
create trigger trg_family_members_updated_at before update on public.family_members
  for each row execute function public.set_updated_at();

alter table public.family_members enable row level security;
drop policy if exists "family_select_own" on public.family_members;
create policy "family_select_own" on public.family_members for select using (auth.uid() = user_id);
drop policy if exists "family_insert_own" on public.family_members;
create policy "family_insert_own" on public.family_members for insert with check (auth.uid() = user_id);
drop policy if exists "family_update_own" on public.family_members;
create policy "family_update_own" on public.family_members for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "family_delete_own" on public.family_members;
create policy "family_delete_own" on public.family_members for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. EDUCATION — multiple rows per user (a person may hold several qualifications).
-- ---------------------------------------------------------------------------
create table if not exists public.education (
  education_id       uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  education_level    text not null,  -- school|10th|12th|diploma|undergraduate|postgraduate|phd|vocational|other
  institution_name   text,
  course_name        text,
  specialization     text,
  board_or_university text,
  enrollment_number  text,
  roll_number        text,
  year_of_study      integer,
  admission_year     integer,
  passing_year       integer,
  percentage         numeric,
  cgpa               numeric,
  result_status      text,   -- 'pursuing' | 'passed' | 'failed' | 'awaited'
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint education_level_chk check (education_level in
    ('school','10th','12th','diploma','undergraduate','postgraduate','phd','vocational','other'))
);

create index if not exists education_user_idx on public.education (user_id);

drop trigger if exists trg_education_updated_at on public.education;
create trigger trg_education_updated_at before update on public.education
  for each row execute function public.set_updated_at();

alter table public.education enable row level security;
drop policy if exists "education_select_own" on public.education;
create policy "education_select_own" on public.education for select using (auth.uid() = user_id);
drop policy if exists "education_insert_own" on public.education;
create policy "education_insert_own" on public.education for insert with check (auth.uid() = user_id);
drop policy if exists "education_update_own" on public.education;
create policy "education_update_own" on public.education for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "education_delete_own" on public.education;
create policy "education_delete_own" on public.education for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. EMPLOYMENT — current employment/occupation snapshot(s).
-- ---------------------------------------------------------------------------
create table if not exists public.employment (
  employment_id    uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  employment_status text not null, -- student|employed|self_employed|unemployed|farmer|homemaker|retired|other
  occupation       text,
  employer_name    text,
  employment_type  text,     -- e.g. 'full_time' | 'part_time' | 'contract' | 'daily_wage'
  monthly_income   numeric,
  annual_income    numeric,
  business_type    text,
  work_location    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint employment_status_chk check (employment_status in
    ('student','employed','self_employed','unemployed','farmer','homemaker','retired','other'))
);

create index if not exists employment_user_idx on public.employment (user_id);

drop trigger if exists trg_employment_updated_at on public.employment;
create trigger trg_employment_updated_at before update on public.employment
  for each row execute function public.set_updated_at();

alter table public.employment enable row level security;
drop policy if exists "employment_select_own" on public.employment;
create policy "employment_select_own" on public.employment for select using (auth.uid() = user_id);
drop policy if exists "employment_insert_own" on public.employment;
create policy "employment_insert_own" on public.employment for insert with check (auth.uid() = user_id);
drop policy if exists "employment_update_own" on public.employment;
create policy "employment_update_own" on public.employment for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "employment_delete_own" on public.employment;
create policy "employment_delete_own" on public.employment for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. AGRICULTURE_PROFILE — only populated when the user identifies as a
--    farmer. One row per user (extend to multiple land parcels later if needed).
-- ---------------------------------------------------------------------------
create table if not exists public.agriculture_profile (
  agriculture_id     uuid primary key default gen_random_uuid(),
  user_id            uuid not null unique references auth.users(id) on delete cascade,
  farmer_status      boolean not null default true,
  land_ownership_status text,   -- 'owned' | 'leased' | 'shared' | 'landless'
  total_land_area    numeric,
  land_area_unit     text,      -- 'acre' | 'hectare' | 'bigha' | ...
  state              text,
  district           text,
  tehsil             text,
  village            text,
  survey_number      text,
  khasra_number      text,
  irrigation_status  text,      -- 'irrigated' | 'rain_fed' | 'partially_irrigated'
  crop_details       jsonb not null default '[]'::jsonb,  -- [{crop, season, area}, ...]
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists trg_agriculture_updated_at on public.agriculture_profile;
create trigger trg_agriculture_updated_at before update on public.agriculture_profile
  for each row execute function public.set_updated_at();

alter table public.agriculture_profile enable row level security;
drop policy if exists "agriculture_select_own" on public.agriculture_profile;
create policy "agriculture_select_own" on public.agriculture_profile for select using (auth.uid() = user_id);
drop policy if exists "agriculture_insert_own" on public.agriculture_profile;
create policy "agriculture_insert_own" on public.agriculture_profile for insert with check (auth.uid() = user_id);
drop policy if exists "agriculture_update_own" on public.agriculture_profile;
create policy "agriculture_update_own" on public.agriculture_profile for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "agriculture_delete_own" on public.agriculture_profile;
create policy "agriculture_delete_own" on public.agriculture_profile for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 8. USER_CONSENTS — an explicit, auditable record per consent type. Written
--    by the backend (service role) so `ip_address` can be captured server-side
--    reliably (see backend/routes/consents.js) — the frontend never invents it.
-- ---------------------------------------------------------------------------
create table if not exists public.user_consents (
  consent_id         uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  consent_type       text not null,
  consent_text_version text not null,
  granted            boolean not null,
  granted_at         timestamptz,
  revoked_at         timestamptz,
  ip_address         text,
  user_agent         text,
  created_at         timestamptz not null default now(),
  constraint user_consents_type_chk check (consent_type in (
    'profile_data_storage','document_storage','sensitive_data_processing',
    'auto_fill','government_portal_submission','aadhaar_verification','bank_verification'
  ))
);

create index if not exists user_consents_user_idx on public.user_consents (user_id, consent_type);

alter table public.user_consents enable row level security;
drop policy if exists "consents_select_own" on public.user_consents;
create policy "consents_select_own" on public.user_consents for select using (auth.uid() = user_id);
-- No anon insert/update/delete — consents are written only via the backend
-- (service role) so the IP/user-agent audit trail can't be forged by the client.

-- ============================================================================
