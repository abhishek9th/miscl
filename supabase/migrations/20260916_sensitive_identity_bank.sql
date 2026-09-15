-- ============================================================================
-- SchemeSetu — Reusable onboarding profile schema (part 2/3)
-- Highly-sensitive data: government IDs, bank accounts, and an audit log of
-- who accessed them. All encryption is APPLICATION-level (Node.js
-- backend/services/crypto.js, AES-256-GCM) — the encryption key lives only in
-- the server's CREDENTIAL_ENCRYPTION_KEY env secret and NEVER touches this
-- database, matching the pattern already used for portal_credentials
-- (20260913_application_journey.sql).
--
-- ACCESS MODEL for identity_documents_sensitive and bank_accounts:
--   - Ciphertext is opaque without the server key, so it is safe to let the
--     owner SELECT their own row (same reasoning as portal_credentials).
--   - There is NO anon/authenticated INSERT or UPDATE policy: all writes
--     (encryption) happen only through backend routes using the service role
--     (backend/routes/identity.js, backend/routes/bankAccounts.js). This stops
--     a user from ever self-declaring a document "verified".
--   - The owner MAY delete their own row (right to erasure).
-- Safe to run on an existing project. Idempotent. Non-destructive.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. IDENTITY_DOCUMENTS_SENSITIVE — one row per user.
-- ---------------------------------------------------------------------------
create table if not exists public.identity_documents_sensitive (
  user_id               uuid primary key references auth.users(id) on delete cascade,

  aadhaar_ciphertext    text,
  aadhaar_iv            text,
  aadhaar_tag           text,
  aadhaar_last4         text,
  aadhaar_verified      boolean not null default false,
  aadhaar_verified_at   timestamptz,

  pan_ciphertext        text,
  pan_iv                text,
  pan_tag               text,
  pan_last4             text,
  pan_verified          boolean not null default false,
  pan_verified_at       timestamptz,

  voter_id_ciphertext   text,
  voter_id_iv           text,
  voter_id_tag          text,

  other_government_id_type       text,
  other_government_id_ciphertext text,
  other_government_id_iv         text,
  other_government_id_tag        text,

  key_version           smallint not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint identity_aadhaar_last4_chk check (aadhaar_last4 is null or aadhaar_last4 ~ '^[0-9]{4}$'),
  constraint identity_pan_last4_chk check (pan_last4 is null or pan_last4 ~ '^[A-Z0-9]{4}$')
);

drop trigger if exists trg_identity_updated_at on public.identity_documents_sensitive;
create trigger trg_identity_updated_at before update on public.identity_documents_sensitive
  for each row execute function public.set_updated_at();

alter table public.identity_documents_sensitive enable row level security;
drop policy if exists "identity_select_own" on public.identity_documents_sensitive;
create policy "identity_select_own" on public.identity_documents_sensitive
  for select using (auth.uid() = user_id);
drop policy if exists "identity_delete_own" on public.identity_documents_sensitive;
create policy "identity_delete_own" on public.identity_documents_sensitive
  for delete using (auth.uid() = user_id);
-- (No insert/update policy — writes go through the backend service role only.)

-- ---------------------------------------------------------------------------
-- 2. BANK_ACCOUNTS — multiple accounts per user, one marked primary.
-- ---------------------------------------------------------------------------
create table if not exists public.bank_accounts (
  bank_account_id       uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  account_holder_name   text,
  bank_name             text,
  account_number_ciphertext text,
  account_number_iv         text,
  account_number_tag        text,
  account_number_last4     text,
  ifsc                  text,
  account_type          text,   -- 'savings' | 'current' | 'jan_dhan' | ...
  bank_account_verified boolean not null default false,
  verification_date     timestamptz,
  is_primary            boolean not null default false,
  key_version           smallint not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint bank_accounts_last4_chk check (account_number_last4 is null or account_number_last4 ~ '^[0-9A-Za-z]{2,4}$'),
  constraint bank_accounts_ifsc_chk check (ifsc is null or ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$')
);

create index if not exists bank_accounts_user_idx on public.bank_accounts (user_id);

drop trigger if exists trg_bank_accounts_updated_at on public.bank_accounts;
create trigger trg_bank_accounts_updated_at before update on public.bank_accounts
  for each row execute function public.set_updated_at();

alter table public.bank_accounts enable row level security;
drop policy if exists "bank_select_own" on public.bank_accounts;
create policy "bank_select_own" on public.bank_accounts for select using (auth.uid() = user_id);
drop policy if exists "bank_delete_own" on public.bank_accounts;
create policy "bank_delete_own" on public.bank_accounts for delete using (auth.uid() = user_id);
-- (No insert/update policy — writes go through the backend service role only.)

-- ---------------------------------------------------------------------------
-- 3. SENSITIVE_DATA_ACCESS_LOG — audit trail. Never contains the sensitive
--    value itself, only metadata about who accessed what and when. Written
--    exclusively by the backend service role.
-- ---------------------------------------------------------------------------
create table if not exists public.sensitive_data_access_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,  -- whose data
  accessed_by   uuid,                          -- auth.uid() of the actor, if a human request
  table_name    text not null,                 -- 'identity_documents_sensitive' | 'bank_accounts'
  record_id     text,
  action        text not null,                 -- 'create' | 'read' | 'update' | 'decrypt' | 'delete'
  purpose       text,                          -- short human-readable reason, e.g. 'onboarding_save'
  ip_address    text,
  user_agent    text,
  accessed_at   timestamptz not null default now(),
  constraint sensitive_log_action_chk check (action in ('create','read','update','decrypt','delete'))
);

create index if not exists sensitive_log_user_idx on public.sensitive_data_access_log (user_id, accessed_at desc);

alter table public.sensitive_data_access_log enable row level security;
drop policy if exists "sensitive_log_select_own" on public.sensitive_data_access_log;
create policy "sensitive_log_select_own" on public.sensitive_data_access_log
  for select using (auth.uid() = user_id);
-- (No anon insert — only the backend service role writes audit rows.)

-- ---------------------------------------------------------------------------
-- 4. EXTEND the existing user_documents table (from
--    20260911_schemesetu_profiles.sql) rather than creating a second,
--    duplicate "documents" table.
-- ---------------------------------------------------------------------------
alter table public.user_documents add column if not exists document_number_ciphertext text;
alter table public.user_documents add column if not exists document_number_iv         text;
alter table public.user_documents add column if not exists document_number_tag        text;
alter table public.user_documents add column if not exists document_status            text;
alter table public.user_documents add column if not exists issued_date                date;
alter table public.user_documents add column if not exists expiry_date                date;
alter table public.user_documents add column if not exists issuing_authority          text;

-- ============================================================================
