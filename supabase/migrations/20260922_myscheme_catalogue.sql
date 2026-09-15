-- ============================================================================
-- SchemeSetu — Full myScheme.gov.in catalogue (native browse/search, not a
-- redirect). Adds: myscheme_catalogue — the ~4,770 real Central + State/UT
-- government schemes scraped from the official myscheme.gov.in site, shown
-- natively inside SchemeSetu's own UI.
--
-- REUSE CHECK before adding a table:
--   - public.schemes (20260917_scheme_field_mapping.sql) is NOT reused here.
--     That table is a small, manually-curated AUTOMATION registry keyed by
--     SchemeSetu's own scheme_id (e.g. 'scheme_pmegp') used to drive the
--     field-mapping/application-readiness engine for a handful of schemes
--     SchemeSetu can actually help fill out. This new table is a much larger,
--     scraped DISPLAY catalogue for browsing/search coverage of every real
--     scheme, independent of whether SchemeSetu automates it yet. Conflating
--     the two would force every scraped scheme through the automation
--     tables it isn't ready for. myscheme_catalogue.mapped_scheme_id is a
--     nullable bridge: once a scraped scheme gets real automation support,
--     it's linked to its public.schemes row here rather than duplicated.
-- Safe to run on an existing project. Idempotent. Non-destructive.
--
-- SOURCE OF TRUTH: every row here is scraped verbatim from the live
-- myscheme.gov.in site (Government of India's own scheme discovery
-- platform) — never AI-generated or invented. Groq/AI is only ever used to
-- explain or summarize these rows for a user, never to originate scheme
-- facts. See backend/scripts/scrapeSchemeIndex.mjs and
-- scrapeSchemeDetails.mjs for the scraper, and scraped_at/source_url below
-- for provenance on every row.
-- ============================================================================

create table if not exists public.myscheme_catalogue (
  slug                  text primary key,          -- myscheme.gov.in/schemes/<slug>
  name                  text not null,
  short_description     text,
  level                 text not null default 'central' check (level in ('central','state')),
  ministries            text[] not null default '{}',   -- e.g. {'Ministry Of Micro, Small and Medium Enterprises'}
  states                text[] not null default '{}',   -- e.g. {'Bihar','Assam'} for state-rolled-out schemes
  category_tags         text[] not null default '{}',   -- e.g. {'Business & Entrepreneurship'}
  keyword_tags          text[] not null default '{}',   -- free-text tags shown on the scheme card

  -- Full detail (populated by the stage-2 detail scraper; null until scraped)
  details_text          text,              -- the "Details"/about/objectives section, as published
  eligibility_text      text,
  benefits_text         text,
  application_process   jsonb,             -- ordered array of step strings, as published
  documents_required    jsonb,             -- array of {name} as published
  faqs                  jsonb,             -- array of {question, answer} as published
  official_website      text,
  application_mode      text,              -- 'Online' | 'Offline' | 'Both' | null if unknown
  scheme_type            text,             -- e.g. 'Scholarship', 'Subsidy' — as published, not inferred

  detail_scraped_at     timestamptz,       -- null = index-only stub, detail not yet fetched
  index_scraped_at      timestamptz not null default now(),
  source_url            text not null,     -- https://www.myscheme.gov.in/schemes/<slug>

  mapped_scheme_id      text references public.schemes(scheme_id),  -- bridge to the automation table, once built

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create extension if not exists pg_trgm;

create index if not exists myscheme_catalogue_level_idx on public.myscheme_catalogue (level);
create index if not exists myscheme_catalogue_ministries_idx on public.myscheme_catalogue using gin (ministries);
create index if not exists myscheme_catalogue_states_idx on public.myscheme_catalogue using gin (states);
create index if not exists myscheme_catalogue_category_tags_idx on public.myscheme_catalogue using gin (category_tags);
create index if not exists myscheme_catalogue_name_trgm_idx on public.myscheme_catalogue using gin (name gin_trgm_ops);

drop trigger if exists trg_myscheme_catalogue_updated_at on public.myscheme_catalogue;
create trigger trg_myscheme_catalogue_updated_at before update on public.myscheme_catalogue
  for each row execute function public.set_updated_at();

-- Public reference data — every real government scheme is public information
-- on myscheme.gov.in already. Readable by anyone (including anon, so the
-- browse/search UI works before login); writable only by the service role
-- (the backend ingestion script), never by end users.
alter table public.myscheme_catalogue enable row level security;
drop policy if exists "myscheme_catalogue_select_all" on public.myscheme_catalogue;
create policy "myscheme_catalogue_select_all" on public.myscheme_catalogue for select using (true);
-- ============================================================================
