-- ============================================================================
-- SchemeSetu — scheme_applications (schemes a user registered for)
-- Safe to run on an existing project. Idempotent. Non-destructive.
-- ============================================================================
create table if not exists public.scheme_applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  scheme_id      text not null,          -- SCHEMES[].id, e.g. 'scheme_pmegp'
  scheme_name    text,
  scheme_type    text,                   -- business | student | skill_employment | ...
  status         text not null default 'registered',  -- registered | applied | approved | rejected
  registered_at  timestamptz not null default now(),
  metadata       jsonb not null default '{}'::jsonb,
  unique (user_id, scheme_id)
);

create index if not exists scheme_applications_user_idx on public.scheme_applications (user_id);

alter table public.scheme_applications enable row level security;

drop policy if exists "applications_select_own" on public.scheme_applications;
create policy "applications_select_own" on public.scheme_applications
  for select using (auth.uid() = user_id);

drop policy if exists "applications_insert_own" on public.scheme_applications;
create policy "applications_insert_own" on public.scheme_applications
  for insert with check (auth.uid() = user_id);

drop policy if exists "applications_update_own" on public.scheme_applications;
create policy "applications_update_own" on public.scheme_applications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "applications_delete_own" on public.scheme_applications;
create policy "applications_delete_own" on public.scheme_applications
  for delete using (auth.uid() = user_id);
-- ============================================================================
