-- ============================================================================
-- SchemeSetu — persist the user's last granted browser location on profiles.
-- Reuses profiles.state (already exists) for the resolved state name; adds
-- only the coordinate + timestamp columns, which nothing else currently
-- tracks. Powers "Find help near me" (nearby partner search) without asking
-- the user to grant location again on every visit.
-- Safe to run on an existing project. Idempotent. Non-destructive.
-- ============================================================================
alter table public.profiles add column if not exists last_latitude       numeric;
alter table public.profiles add column if not exists last_longitude      numeric;
alter table public.profiles add column if not exists location_updated_at timestamptz;
-- ============================================================================
