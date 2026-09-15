-- ============================================================================
-- SchemeSetu — permanent eligibility-profile additions.
--
-- Most of the "permanent user profile" described in this spec ALREADY EXISTS
-- from earlier migrations — reused, not duplicated:
--   §1 Personal            -> profiles (full_name/first_name/.../date_of_birth/
--                              gender/marital_status/fathers_name/mothers_name/
--                              spouse_name) — 20260911, 20260915, 20260918
--   §2 Location             -> addresses (permanent row: state/district/
--                              sub_district/village/city/pincode) — 20260915.
--                              Only `block` is genuinely new (added below).
--   §3 Social/Demographic   -> profiles.social_category + eligibility_profile
--                              (caste_community, minority_status, bpl_status,
--                              ration_card_status/number, disability_*,
--                              ex_serviceman_status, ews) — 20260915
--   §4 Family (size/deps)   -> profiles.family_size/number_of_dependents
--                              (20260918/20260915) + family_members rows.
--                              Aggregate counts (earning members, children,
--                              seniors, PWD-in-household, household head) are
--                              genuinely new — added below.
--   §5 Income                -> profiles.annual_income/annual_personal_income
--                              (20260915/18) + user_documents
--                              (document_type='income_certificate', with its
--                              existing verification_status/expiry_date —
--                              this already tracks "certificate available /
--                              verified / expiry", no new table needed).
--                              Income SOURCE/category is new — added below.
--   §6 Education              -> education table (20260915).
--   §7 Employment              -> employment table (20260915).
--   §8 Agricultural status     -> agriculture_profile (20260915).
--   §9 Disability/special      -> eligibility_profile (20260915).
--   §12 Document availability  -> user_documents + document_availability
--                              (20260911/20260916/20260919) — already
--                              distinguishes available/missing/verified/expired.
--
-- GENUINELY NEW in this migration:
--   1. addresses.block column.
--   2. Household aggregate counts + income-source fields on profiles.
--   3. government_registrations table (§10).
--   4. existing_benefits table (§11).
-- Safe to run on an existing project. Idempotent. Non-destructive.
-- ============================================================================

alter table public.addresses add column if not exists block text;

alter table public.profiles add column if not exists number_of_earning_members integer;
alter table public.profiles add column if not exists number_of_children         integer;
alter table public.profiles add column if not exists number_of_children_below_5 integer;
alter table public.profiles add column if not exists number_of_senior_citizens  integer;
alter table public.profiles add column if not exists number_of_disabled_members integer;
alter table public.profiles add column if not exists is_household_head          boolean;
alter table public.profiles add column if not exists primary_income_source      text;   -- salary|business|agriculture|pension|daily_wage|self_employment|other
alter table public.profiles add column if not exists secondary_income_source    text;
alter table public.profiles add column if not exists income_category            text;   -- free text / band, e.g. 'BPL', 'APL' — distinct from the numeric annual_income

-- ---------------------------------------------------------------------------
-- GOVERNMENT_REGISTRATIONS — existence/status of registrations that can
-- affect eligibility (Udyam, e-Shram, KCC, etc.). Recording that one EXISTS
-- never by itself implies eligibility for any particular scheme — the
-- requirement engine decides that per-scheme.
-- ---------------------------------------------------------------------------
create table if not exists public.government_registrations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  registration_type text not null,   -- udyam|e_shram|farmer_registration|kisan_credit_card|labour_registration|shg_membership|startup_recognition|other
  registration_number text,
  status          text not null default 'active',  -- active|inactive|expired|unknown
  issued_date     date,
  expiry_date     date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, registration_type)
);

drop trigger if exists trg_government_registrations_updated_at on public.government_registrations;
create trigger trg_government_registrations_updated_at before update on public.government_registrations
  for each row execute function public.set_updated_at();

alter table public.government_registrations enable row level security;
drop policy if exists "govt_reg_select_own" on public.government_registrations;
create policy "govt_reg_select_own" on public.government_registrations for select using (auth.uid() = user_id);
drop policy if exists "govt_reg_insert_own" on public.government_registrations;
create policy "govt_reg_insert_own" on public.government_registrations for insert with check (auth.uid() = user_id);
drop policy if exists "govt_reg_update_own" on public.government_registrations;
create policy "govt_reg_update_own" on public.government_registrations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "govt_reg_delete_own" on public.government_registrations;
create policy "govt_reg_delete_own" on public.government_registrations for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- EXISTING_BENEFITS — schemes/benefits the user has already received, used to
-- detect duplicate-benefit exclusions. scheme_id is a free-text reference
-- (not FK'd to schemes.scheme_id) since users may report benefits from
-- schemes SchemeSetu hasn't catalogued.
-- ---------------------------------------------------------------------------
create table if not exists public.existing_benefits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  scheme_name   text not null,
  scheme_id     text,
  benefit_type  text,
  date_received date,
  status        text not null default 'active',  -- active|inactive|unknown
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists existing_benefits_user_idx on public.existing_benefits (user_id);

drop trigger if exists trg_existing_benefits_updated_at on public.existing_benefits;
create trigger trg_existing_benefits_updated_at before update on public.existing_benefits
  for each row execute function public.set_updated_at();

alter table public.existing_benefits enable row level security;
drop policy if exists "existing_benefits_select_own" on public.existing_benefits;
create policy "existing_benefits_select_own" on public.existing_benefits for select using (auth.uid() = user_id);
drop policy if exists "existing_benefits_insert_own" on public.existing_benefits;
create policy "existing_benefits_insert_own" on public.existing_benefits for insert with check (auth.uid() = user_id);
drop policy if exists "existing_benefits_update_own" on public.existing_benefits;
create policy "existing_benefits_update_own" on public.existing_benefits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "existing_benefits_delete_own" on public.existing_benefits;
create policy "existing_benefits_delete_own" on public.existing_benefits for delete using (auth.uid() = user_id);
-- ============================================================================
