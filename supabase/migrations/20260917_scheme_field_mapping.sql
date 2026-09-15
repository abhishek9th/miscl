-- ============================================================================
-- SchemeSetu — Reusable onboarding profile schema (part 3/3)
-- The flexible scheme/field-mapping structure (§14/§17 of the spec):
--   USER PROFILE → STANDARDIZED DATA → SCHEME FIELD MAPPING → FORM FIELD
-- NOT one fixed government form baked into the schema. Field mappings can
-- change per portal without touching the core profile tables above.
--
-- REUSE CHECK before adding tables:
--   - "applications" (tracking a submitted application + its status) already
--     exists as public.portal_applications (20260913_application_journey.sql)
--     and public.scheme_applications (20260912_scheme_applications.sql) — a
--     third "applications" table is NOT created here to avoid duplication.
--   - public.portals (20260913_application_journey.sql) already models the
--     government portal a scheme submits to; `schemes` below references it.
-- Safe to run on an existing project. Idempotent. Non-destructive.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. SCHEMES — a lightweight automation registry keyed by the same scheme id
--    used throughout the frontend (src/data/schemes.js SCHEMES[].id, e.g.
--    'scheme_pmegp'). Rich display content (name, benefits, eligibility text)
--    intentionally stays in schemes.js — this table exists only so
--    scheme_fields/field_mappings/user_scheme_data have something to key off.
-- ---------------------------------------------------------------------------
create table if not exists public.schemes (
  scheme_id    text primary key,          -- matches SCHEMES[].id
  name         text not null,
  portal_id    text references public.portals(id),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_schemes_updated_at on public.schemes;
create trigger trg_schemes_updated_at before update on public.schemes
  for each row execute function public.set_updated_at();

alter table public.schemes enable row level security;
drop policy if exists "schemes_select_all" on public.schemes;
create policy "schemes_select_all" on public.schemes for select using (auth.role() = 'authenticated');
-- Writable only by the service role (no anon insert/update policy) — this is
-- reference/automation data curated by SchemeSetu, not user data.

-- ---------------------------------------------------------------------------
-- 2. SCHEME_FIELDS — the form fields a given scheme's application asks for,
--    and where SchemeSetu can source each one from.
-- ---------------------------------------------------------------------------
create table if not exists public.scheme_fields (
  field_id            uuid primary key default gen_random_uuid(),
  scheme_id           text not null references public.schemes(scheme_id) on delete cascade,
  field_key           text not null,             -- e.g. 'date_of_birth'
  field_label         text not null,             -- human label shown to the user
  field_type          text not null default 'TEXT', -- TEXT|NUMBER|DATE|SELECT|YES_NO|DOCUMENT|...
  required            boolean not null default false,
  validation_rules    jsonb not null default '{}'::jsonb,   -- {pattern, min, max, ...}
  source_profile_field text,                      -- e.g. 'profile.date_of_birth'
  portal_field_name    text,                      -- e.g. 'applicantDOB'
  conditional_logic    jsonb not null default '{}'::jsonb,  -- {show_if: {field, equals}}
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (scheme_id, field_key)
);

create index if not exists scheme_fields_scheme_idx on public.scheme_fields (scheme_id);

drop trigger if exists trg_scheme_fields_updated_at on public.scheme_fields;
create trigger trg_scheme_fields_updated_at before update on public.scheme_fields
  for each row execute function public.set_updated_at();

alter table public.scheme_fields enable row level security;
drop policy if exists "scheme_fields_select_all" on public.scheme_fields;
create policy "scheme_fields_select_all" on public.scheme_fields for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 3. FIELD_MAPPINGS — internal (standardized) field -> portal-specific field,
--    with confidence/verification metadata for the automation engine.
-- ---------------------------------------------------------------------------
create table if not exists public.field_mappings (
  mapping_id           uuid primary key default gen_random_uuid(),
  scheme_id            text not null references public.schemes(scheme_id) on delete cascade,
  internal_field       text not null,      -- e.g. 'profile.full_name'
  portal_field         text not null,      -- e.g. 'applicant_name'
  portal_field_label   text,
  data_type            text not null default 'text',
  transformation_rule  jsonb not null default '{}'::jsonb,  -- e.g. {format: 'DD/MM/YYYY'}
  required             boolean not null default false,
  confidence           numeric not null default 1.0,        -- 0..1, how reliable this mapping is
  verification_required boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (scheme_id, internal_field, portal_field)
);

create index if not exists field_mappings_scheme_idx on public.field_mappings (scheme_id);

drop trigger if exists trg_field_mappings_updated_at on public.field_mappings;
create trigger trg_field_mappings_updated_at before update on public.field_mappings
  for each row execute function public.set_updated_at();

alter table public.field_mappings enable row level security;
drop policy if exists "field_mappings_select_all" on public.field_mappings;
create policy "field_mappings_select_all" on public.field_mappings for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 4. USER_SCHEME_DATA — scheme-specific answers that are NOT part of the
--    reusable profile (§ "ask only when a particular scheme requires it").
--    Every value tracks its own verification status, per the spec: never
--    claim "officially_verified" just because the user typed it in.
-- ---------------------------------------------------------------------------
create table if not exists public.user_scheme_data (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  scheme_id           text not null references public.schemes(scheme_id) on delete cascade,
  field_key           text not null,
  value                jsonb,
  verification_status text not null default 'unverified',
  verification_method  text,             -- e.g. 'self_declared' | 'document_upload' | 'portal_callback'
  verified_at          timestamptz,
  verified_source      text,             -- e.g. 'income_certificate.pdf' | 'aadhaar_ekyc'
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, scheme_id, field_key),
  constraint user_scheme_data_verification_chk check (verification_status in
    ('unverified','user_verified','document_verified','officially_verified'))
);

create index if not exists user_scheme_data_user_idx on public.user_scheme_data (user_id, scheme_id);

drop trigger if exists trg_user_scheme_data_updated_at on public.user_scheme_data;
create trigger trg_user_scheme_data_updated_at before update on public.user_scheme_data
  for each row execute function public.set_updated_at();

alter table public.user_scheme_data enable row level security;
drop policy if exists "user_scheme_data_select_own" on public.user_scheme_data;
create policy "user_scheme_data_select_own" on public.user_scheme_data for select using (auth.uid() = user_id);
drop policy if exists "user_scheme_data_insert_own" on public.user_scheme_data;
create policy "user_scheme_data_insert_own" on public.user_scheme_data for insert with check (auth.uid() = user_id);
drop policy if exists "user_scheme_data_update_own" on public.user_scheme_data;
create policy "user_scheme_data_update_own" on public.user_scheme_data for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "user_scheme_data_delete_own" on public.user_scheme_data;
create policy "user_scheme_data_delete_own" on public.user_scheme_data for delete using (auth.uid() = user_id);

-- NOTE: a user can set verification_status on their OWN row via the anon key
-- (RLS only checks ownership, not which columns changed). This is fine for
-- 'unverified' / 'user_verified' (self-declared), but 'document_verified' and
-- 'officially_verified' should only ever be set by backend logic that has
-- actually checked a document or portal callback. The frontend UI and
-- onboarding/journey services in this codebase never set those two values on
-- the user's behalf — only the (future) document-verification and portal
-- automation backends should. Documented here as the authoritative rule.
-- ============================================================================
