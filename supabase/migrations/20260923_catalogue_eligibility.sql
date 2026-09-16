-- ============================================================================
-- SchemeSetu — Structured eligibility for the full myScheme catalogue.
--
-- The scraped `eligibility_text` on public.myscheme_catalogue is free-form
-- official prose. This migration adds machine-readable eligibility columns that
-- an offline extractor (backend/scripts/extractCatalogueEligibility.mjs) fills
-- from that prose using the same Groq model already used elsewhere, so the
-- eligibility MATCHER can run over every catalogue scheme — not just the ~20
-- hand-curated ones.
--
-- HONESTY (§5/§36): these columns are AI-EXTRACTED from the official text, not
-- hand-verified. `eligibility_extracted` marks a row as processed; the UI must
-- label matches from here as "AI-assisted — confirm on the official portal" and
-- never merge them into the hand-verified curated results. null/empty array
-- means "not stated" (open / no restriction), never a fabricated restriction.
-- Safe to run on an existing project. Idempotent. Non-destructive.
-- ============================================================================

alter table public.myscheme_catalogue add column if not exists income_limit          numeric;          -- max annual family income allowed; null = not stated / no cap
alter table public.myscheme_catalogue add column if not exists eligible_categories    text[] not null default '{}';  -- {} = open to all social categories
alter table public.myscheme_catalogue add column if not exists eligible_genders       text[] not null default '{}';  -- {} = all genders
alter table public.myscheme_catalogue add column if not exists education_levels        text[] not null default '{}';  -- {} = not education-gated
alter table public.myscheme_catalogue add column if not exists min_age                integer;          -- null = not stated
alter table public.myscheme_catalogue add column if not exists max_age                integer;          -- null = not stated
alter table public.myscheme_catalogue add column if not exists benefit_types          text[] not null default '{}';  -- scholarship|loan|subsidy|grant|training|pension|insurance|housing|equipment|stipend|fellowship|other
alter table public.myscheme_catalogue add column if not exists audiences              text[] not null default '{}';  -- student|farmer|woman|entrepreneur|worker|senior_citizen|disabled|minority|artisan|...
alter table public.myscheme_catalogue add column if not exists eligibility_extracted   boolean not null default false;
alter table public.myscheme_catalogue add column if not exists eligibility_extracted_at timestamptz;

create index if not exists myscheme_catalogue_benefit_types_idx on public.myscheme_catalogue using gin (benefit_types);
create index if not exists myscheme_catalogue_categories_idx    on public.myscheme_catalogue using gin (eligible_categories);
create index if not exists myscheme_catalogue_education_idx     on public.myscheme_catalogue using gin (education_levels);
create index if not exists myscheme_catalogue_extracted_idx     on public.myscheme_catalogue (eligibility_extracted);
create index if not exists myscheme_catalogue_income_idx        on public.myscheme_catalogue (income_limit);

-- ---------------------------------------------------------------------------
-- Matcher: given a user's profile + the benefit types they're after, return the
-- catalogue schemes whose extracted criteria are COMPATIBLE, most-specific
-- first. A null/empty criterion on the scheme means "no restriction", so it
-- never excludes; a null profile value means "unknown" and also never excludes
-- (we would rather show a maybe-match the user can verify than hide it).
-- match_score rewards schemes that specifically target the user (their state,
-- their category, their benefit) over blanket all-India / open-to-all ones.
-- ---------------------------------------------------------------------------
create or replace function public.match_catalogue_schemes(
  p_income         numeric,
  p_category       text,
  p_gender         text,
  p_education      text,
  p_state          text,
  p_age            integer,
  p_benefit_types  text[],
  p_limit          integer default 12
)
returns table (
  slug              text,
  name              text,
  short_description text,
  level             text,
  states            text[],
  benefit_types     text[],
  scheme_type       text,
  source_url        text,
  income_limit      numeric,
  match_score       integer
)
language sql
stable
as $$
  select
    c.slug, c.name, c.short_description, c.level, c.states, c.benefit_types,
    c.scheme_type, c.source_url, c.income_limit,
    (
      (case when p_state is not null and p_state = any(c.states) then 3 else 0 end)
    + (case when p_category is not null and array_length(c.eligible_categories,1) is not null and p_category = any(c.eligible_categories) then 3 else 0 end)
    + (case when p_benefit_types is not null and c.benefit_types && p_benefit_types then 2 else 0 end)
    + (case when p_education is not null and array_length(c.education_levels,1) is not null and p_education = any(c.education_levels) then 2 else 0 end)
    + (case when c.income_limit is not null then 1 else 0 end)
    )::integer as match_score
  from public.myscheme_catalogue c
  where c.eligibility_extracted = true
    -- income: scheme cap must be >= the user's income (or unknown either side)
    and (c.income_limit is null or p_income is null or c.income_limit >= p_income)
    -- social category
    and (array_length(c.eligible_categories,1) is null or p_category is null or p_category = any(c.eligible_categories))
    -- gender
    and (array_length(c.eligible_genders,1) is null or p_gender is null or p_gender = any(c.eligible_genders))
    -- education level
    and (array_length(c.education_levels,1) is null or p_education is null or p_education = any(c.education_levels))
    -- state: all-India ({} states) always qualifies; else the user's state must be listed
    and (array_length(c.states,1) is null or p_state is null or p_state = any(c.states))
    -- age band
    and (c.min_age is null or p_age is null or p_age >= c.min_age)
    and (c.max_age is null or p_age is null or p_age <= c.max_age)
    -- benefit intent: when the caller specifies benefit types, require an overlap
    and (p_benefit_types is null or array_length(p_benefit_types,1) is null or c.benefit_types && p_benefit_types)
  order by match_score desc, (c.income_limit is not null) desc, c.name asc
  limit greatest(1, coalesce(p_limit, 12));
$$;

grant execute on function public.match_catalogue_schemes(numeric, text, text, text, text, integer, text[], integer) to anon, authenticated, service_role;
-- ============================================================================
