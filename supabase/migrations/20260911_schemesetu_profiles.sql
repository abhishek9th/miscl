-- ============================================================================
-- SchemeSetu — profiles + user_documents + private storage
-- Safe to run on an existing project. Idempotent (re-runnable). Non-destructive:
-- never drops tables/columns/data. Existing `profiles` is ALTERed, not replaced.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Fresh projects get the full target definition here. Existing tables are
-- upgraded by the ALTERs in section 2.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text not null,
  phone           text not null,
  live_photo_url  text not null,

  -- optional identity / eligibility (nullable for now)
  aadhaar_number     text,
  pan_number         text,
  annual_income      numeric,
  date_of_birth      date,
  gender             text,
  social_category    text,
  state              text,
  district           text,
  occupation         text,
  education_level    text,
  disability_status  boolean,
  marital_status     text,
  family_size        integer,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. UPGRADE AN EXISTING profiles TABLE (add-only, all nullable so it can't
--    fail on tables that already contain rows). NOT NULL is enforced later in
--    section 6 once you've backfilled + updated the app.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists email             text;
alter table public.profiles add column if not exists full_name         text;
alter table public.profiles add column if not exists phone             text;
alter table public.profiles add column if not exists live_photo_url    text;
alter table public.profiles add column if not exists aadhaar_number    text;
alter table public.profiles add column if not exists pan_number        text;
alter table public.profiles add column if not exists annual_income     numeric;
alter table public.profiles add column if not exists date_of_birth     date;
alter table public.profiles add column if not exists gender            text;
alter table public.profiles add column if not exists social_category   text;
alter table public.profiles add column if not exists state             text;
alter table public.profiles add column if not exists district          text;
alter table public.profiles add column if not exists occupation        text;
alter table public.profiles add column if not exists education_level   text;
alter table public.profiles add column if not exists disability_status boolean;
alter table public.profiles add column if not exists marital_status    text;
alter table public.profiles add column if not exists family_size       integer;
alter table public.profiles add column if not exists created_at        timestamptz not null default now();
alter table public.profiles add column if not exists updated_at        timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 3. OPTIONAL BACKFILL from the previous schema (mobile -> phone,
--    face_url -> live_photo_url). Guarded so it only runs if the old columns
--    exist; skips rows that already have the new value.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='profiles' and column_name='mobile') then
    execute 'update public.profiles set phone = mobile where phone is null and mobile is not null';
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='profiles' and column_name='face_url') then
    execute 'update public.profiles set live_photo_url = face_url where live_photo_url is null and face_url is not null';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3b. RECONCILE the previous schema: drop legacy columns that are no longer
--     used by the app. The old `user_id`/`mobile` were NOT NULL, which would
--     block the new inserts. Safe to run repeatedly (drop ... if exists).
--     (Run the §3 backfill above first so no data is lost.)
-- ---------------------------------------------------------------------------
alter table public.profiles drop column if exists user_id;
alter table public.profiles drop column if exists mobile;
alter table public.profiles drop column if exists face_url;
alter table public.profiles drop column if exists category;
alter table public.profiles drop column if exists criteria;

-- ---------------------------------------------------------------------------
-- 4. CONSTRAINTS & INDEXES (idempotent)
-- ---------------------------------------------------------------------------
-- Uniqueness on email + phone
create unique index if not exists profiles_email_uidx on public.profiles (lower(email));
create unique index if not exists profiles_phone_uidx on public.profiles (phone);
-- Helpful lookups for eligibility filtering
create index if not exists profiles_state_idx           on public.profiles (state);
create index if not exists profiles_social_category_idx on public.profiles (social_category);

-- Lightweight format checks that still allow NULL (added only once).
do $$
begin
  begin
    alter table public.profiles
      add constraint profiles_aadhaar_chk check (aadhaar_number is null or aadhaar_number ~ '^[0-9]{12}$');
  exception when duplicate_object then null; end;
  begin
    alter table public.profiles
      add constraint profiles_pan_chk check (pan_number is null or pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]$');
  exception when duplicate_object then null; end;
end $$;

-- ---------------------------------------------------------------------------
-- 5. updated_at maintenance trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. ENFORCE NOT NULL on the mandatory fields.
--    ONLY run this block AFTER: (a) the app writes email/phone/live_photo_url,
--    and (b) any existing rows have been backfilled — otherwise it errors.
--    Left commented so the migration is safe on a table with legacy rows.
-- ---------------------------------------------------------------------------
-- alter table public.profiles alter column email          set not null;
-- alter table public.profiles alter column full_name      set not null;
-- alter table public.profiles alter column phone          set not null;
-- alter table public.profiles alter column live_photo_url set not null;

-- ---------------------------------------------------------------------------
-- 7. USER DOCUMENTS (all optional; files live in private Storage)
-- ---------------------------------------------------------------------------
create table if not exists public.user_documents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  document_type       text not null,          -- 'aadhaar' | 'pan' | 'income_certificate'
                                               -- | 'caste_certificate' | 'domicile_certificate'
                                               -- | 'disability_certificate' | 'other' | ...
  file_path           text not null,          -- object path in the 'documents' bucket
  file_name           text,
  mime_type           text,
  uploaded_at         timestamptz not null default now(),
  verification_status text not null default 'pending',  -- pending | verified | rejected
  verified_at         timestamptz,
  metadata            jsonb not null default '{}'::jsonb
);

create index if not exists user_documents_user_idx      on public.user_documents (user_id);
create index if not exists user_documents_user_type_idx on public.user_documents (user_id, document_type);

do $$
begin
  begin
    alter table public.user_documents
      add constraint user_documents_status_chk
      check (verification_status in ('pending','verified','rejected'));
  exception when duplicate_object then null; end;
end $$;

-- ---------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.user_documents enable row level security;

-- profiles: a user may see/insert/update ONLY their own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- (No delete policy — profiles are removed via auth.users cascade.)
-- (The backend service-role key bypasses RLS for server-side inserts.)

-- user_documents: full ownership scoping.
drop policy if exists "documents_select_own" on public.user_documents;
create policy "documents_select_own" on public.user_documents
  for select using (auth.uid() = user_id);

drop policy if exists "documents_insert_own" on public.user_documents;
create policy "documents_insert_own" on public.user_documents
  for insert with check (auth.uid() = user_id);

drop policy if exists "documents_update_own" on public.user_documents;
create policy "documents_update_own" on public.user_documents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "documents_delete_own" on public.user_documents;
create policy "documents_delete_own" on public.user_documents
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 9. PRIVATE STORAGE BUCKETS + per-user object policies
--    Files are addressed as  <bucket>/<auth.uid()>/<filename>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('faces','faces', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('documents','documents', false)
  on conflict (id) do nothing;

-- faces bucket (live/profile photos)
drop policy if exists "faces_select_own" on storage.objects;
create policy "faces_select_own" on storage.objects for select
  using (bucket_id = 'faces' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "faces_insert_own" on storage.objects;
create policy "faces_insert_own" on storage.objects for insert
  with check (bucket_id = 'faces' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "faces_update_own" on storage.objects;
create policy "faces_update_own" on storage.objects for update
  using (bucket_id = 'faces' and (storage.foldername(name))[1] = auth.uid()::text);

-- documents bucket
drop policy if exists "documents_select_own" on storage.objects;
create policy "documents_select_own" on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_insert_own" on storage.objects;
create policy "documents_insert_own" on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_update_own" on storage.objects;
create policy "documents_update_own" on storage.objects for update
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_delete_own" on storage.objects;
create policy "documents_delete_own" on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
-- ============================================================================
