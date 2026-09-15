-- ============================================================================
-- SchemeSetu — Application Journey & Status Tracking
-- Adds: portals (reference), portal_credentials (encrypted, RLS),
--       portal_applications (persistent state machine + status tracking),
--       application_events (non-sensitive audit log),
--       application_status_history.
-- Safe to run on an existing project. Idempotent. Non-destructive.
--
-- SECURITY NOTES
--  * portal_credentials NEVER stores plaintext passwords/tokens. The ciphertext
--    columns hold AES-256-GCM output produced by the backend (crypto.js). The
--    encryption key lives ONLY in a server env secret (CREDENTIAL_ENCRYPTION_KEY),
--    never in this database.
--  * RLS restricts every row to its owning user. The backend service-role key
--    bypasses RLS for server-side automation writes; the frontend anon key can
--    only ever read/administer the signed-in user's own rows.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PORTALS — reference catalogue of government portals we can (or cannot yet)
--    automate. integration_mode is the single source of truth for §22
--    (REAL / MOCK / NOT_SUPPORTED). No secrets here.
-- ---------------------------------------------------------------------------
create table if not exists public.portals (
  id                 text primary key,            -- 'mock_scholarship' | 'nsp' | 'pmkisan' | ...
  name               text not null,
  auth_type          text not null default 'LOGIN_REQUIRED',
                     -- NO_ACCOUNT_REQUIRED | ACCOUNT_REQUIRED | REGISTRATION_REQUIRED
                     -- | LOGIN_REQUIRED | OTP_REQUIRED | OTR_REQUIRED
                     -- | AADHAAR_REQUIRED | MULTI_STEP_AUTHENTICATION
  integration_mode   text not null default 'NOT_SUPPORTED',  -- REAL | MOCK | NOT_SUPPORTED
  official_url       text,
  status_lookup      text not null default 'NONE',   -- API | REFERENCE_LOOKUP | LOGIN_REQUIRED | NONE
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Portals are non-sensitive reference data: readable by any signed-in user,
-- writable only by the service role (no anon insert/update policy).
alter table public.portals enable row level security;
drop policy if exists "portals_select_all" on public.portals;
create policy "portals_select_all" on public.portals
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 2. PORTAL_CREDENTIALS — encrypted, per-user, opt-in.
-- ---------------------------------------------------------------------------
create table if not exists public.portal_credentials (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  portal_id             text not null references public.portals(id),
  authentication_type   text not null default 'PASSWORD',   -- PASSWORD | OAUTH | API_TOKEN | REFRESH_TOKEN
  username              text,                                -- login id / registered mobile / email (not secret)
  -- Authenticated-encryption payloads (base64). Plaintext NEVER stored.
  secret_ciphertext     text,        -- encrypted password OR token, per authentication_type
  secret_iv             text,
  secret_tag            text,
  key_version           smallint not null default 1,         -- supports key rotation
  enabled               boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  last_used_at          timestamptz,
  last_status_check     timestamptz,
  unique (user_id, portal_id)
);

create index if not exists portal_credentials_user_idx on public.portal_credentials (user_id);

alter table public.portal_credentials enable row level security;

-- Owner may SEE that a credential exists and manage it (enable/disable/delete),
-- but the ciphertext is only ever decrypted server-side; the anon client should
-- select only non-secret columns in practice.
drop policy if exists "credentials_select_own" on public.portal_credentials;
create policy "credentials_select_own" on public.portal_credentials
  for select using (auth.uid() = user_id);

drop policy if exists "credentials_update_own" on public.portal_credentials;
create policy "credentials_update_own" on public.portal_credentials
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "credentials_delete_own" on public.portal_credentials;
create policy "credentials_delete_own" on public.portal_credentials
  for delete using (auth.uid() = user_id);
-- (No anon INSERT policy: credentials are only written by the backend service
--  role, which performs the encryption. This prevents a client ever writing a
--  plaintext or unencrypted secret.)

-- ---------------------------------------------------------------------------
-- 3. PORTAL_APPLICATIONS — the persistent application journey / state machine.
--    Contains NO secrets: form_data holds only non-sensitive filled values with
--    their provenance; OTP/passwords are never written here.
-- ---------------------------------------------------------------------------
create table if not exists public.portal_applications (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  scheme_id           text not null,
  scheme_name         text,
  portal_id           text not null references public.portals(id),
  integration_mode    text not null default 'MOCK',        -- mirrors portals.integration_mode at start
  state               text not null default 'DISCOVERED',
                     -- DISCOVERED | ELIGIBLE | REGISTRATION_REQUIRED | REGISTERING
                     -- | OTP_REQUIRED | ACCOUNT_CREATED | LOGIN_REQUIRED | LOGGING_IN
                     -- | AUTHENTICATED | FORM_FILLING | USER_INPUT_REQUIRED
                     -- | DOCUMENT_REQUIRED | DOCUMENT_UPLOADING | READY_FOR_REVIEW
                     -- | USER_REVIEW | SUBMITTING | SUBMITTED | UNDER_REVIEW
                     -- | APPROVED | REJECTED | FAILED | PAUSED
  step_index          integer not null default 0,          -- adapter plan cursor
  form_data           jsonb not null default '{}'::jsonb,  -- { field: { value, source } }
  pending_input       jsonb,                               -- current HumanInputRequired (no secrets) or null
  reference_number    text,                                -- portal application/reference number
  submitted_at        timestamptz,
  current_status      text,                                -- portal-specific status string
  last_status_check   timestamptz,
  next_status_check   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, scheme_id, portal_id)
);

create index if not exists portal_applications_user_idx on public.portal_applications (user_id);
create index if not exists portal_applications_tracking_idx
  on public.portal_applications (next_status_check)
  where state in ('SUBMITTED','UNDER_REVIEW','DOCUMENT_REQUIRED');

alter table public.portal_applications enable row level security;

drop policy if exists "papps_select_own" on public.portal_applications;
create policy "papps_select_own" on public.portal_applications
  for select using (auth.uid() = user_id);
-- Writes go through the backend (service role) which runs the journey engine.

-- ---------------------------------------------------------------------------
-- 4. APPLICATION_EVENTS — non-sensitive audit log (§19).
--    NEVER write OTP values, passwords, keys, or tokens into `detail`.
-- ---------------------------------------------------------------------------
create table if not exists public.application_events (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.portal_applications(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  event          text not null,        -- e.g. 'REGISTRATION_STARTED', 'OTP_REQUESTED', 'STATUS_CHANGED'
  detail         text,                 -- human-readable, non-sensitive
  created_at     timestamptz not null default now()
);

create index if not exists application_events_app_idx on public.application_events (application_id, created_at);

alter table public.application_events enable row level security;
drop policy if exists "events_select_own" on public.application_events;
create policy "events_select_own" on public.application_events
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. APPLICATION_STATUS_HISTORY — one row per meaningful status change (§6, §8).
-- ---------------------------------------------------------------------------
create table if not exists public.application_status_history (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.portal_applications(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  from_status    text,
  to_status      text not null,
  source         text not null default 'AUTO',   -- AUTO | MANUAL | API
  notified       boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists status_history_app_idx on public.application_status_history (application_id, created_at);

alter table public.application_status_history enable row level security;
drop policy if exists "status_history_select_own" on public.application_status_history;
create policy "status_history_select_own" on public.application_status_history
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. updated_at maintenance (reuse the function created in the profiles migration;
--    define defensively in case this migration runs first).
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_portals_updated_at on public.portals;
create trigger trg_portals_updated_at before update on public.portals
  for each row execute function public.set_updated_at();

drop trigger if exists trg_portal_credentials_updated_at on public.portal_credentials;
create trigger trg_portal_credentials_updated_at before update on public.portal_credentials
  for each row execute function public.set_updated_at();

drop trigger if exists trg_portal_applications_updated_at on public.portal_applications;
create trigger trg_portal_applications_updated_at before update on public.portal_applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. SEED the portal catalogue. Only the mock portal is a working integration.
--    The real portals are registered so the UI can honestly show
--    "automation not yet supported" and link out to the official site (§22).
-- ---------------------------------------------------------------------------
insert into public.portals (id, name, auth_type, integration_mode, official_url, status_lookup) values
  ('mock_scholarship', 'SchemeSetu Demo Scholarship Portal', 'REGISTRATION_REQUIRED', 'MOCK',
     null, 'REFERENCE_LOOKUP'),
  ('nsp', 'National Scholarship Portal (NSP)', 'OTR_REQUIRED', 'NOT_SUPPORTED',
     'https://scholarships.gov.in', 'LOGIN_REQUIRED'),
  ('pmkisan', 'PM-KISAN', 'AADHAAR_REQUIRED', 'NOT_SUPPORTED',
     'https://pmkisan.gov.in', 'REFERENCE_LOOKUP'),
  ('state_scholarship', 'State Scholarship Portal', 'LOGIN_REQUIRED', 'NOT_SUPPORTED',
     null, 'LOGIN_REQUIRED')
on conflict (id) do update
  set name = excluded.name,
      auth_type = excluded.auth_type,
      integration_mode = excluded.integration_mode,
      official_url = excluded.official_url,
      status_lookup = excluded.status_lookup;
-- ============================================================================
