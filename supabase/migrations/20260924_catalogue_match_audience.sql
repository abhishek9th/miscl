-- ============================================================================
-- SchemeSetu — make the catalogue matcher AUDIENCE-aware.
--
-- match_catalogue_schemes() previously ranked only by state/category/benefit/
-- education. For an "Agriculture" search that surfaced generic loan/subsidy
-- schemes rather than farmer schemes. This adds an optional p_audiences hint
-- (e.g. {farmer}, {student}) derived from the discovery flow, and gives an
-- audience match the highest score weight so relevant schemes rank first — it
-- boosts, never excludes, so other eligible schemes still appear below.
-- Safe to run on an existing project. Idempotent. Non-destructive.
-- ============================================================================

drop function if exists public.match_catalogue_schemes(numeric, text, text, text, text, integer, text[], integer);

create or replace function public.match_catalogue_schemes(
  p_income         numeric,
  p_category       text,
  p_gender         text,
  p_education      text,
  p_state          text,
  p_age            integer,
  p_benefit_types  text[],
  p_audiences      text[] default null,
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
      (case when p_audiences is not null and c.audiences && p_audiences then 4 else 0 end)
    + (case when p_state is not null and p_state = any(c.states) then 3 else 0 end)
    + (case when p_category is not null and array_length(c.eligible_categories,1) is not null and p_category = any(c.eligible_categories) then 3 else 0 end)
    + (case when p_benefit_types is not null and c.benefit_types && p_benefit_types then 2 else 0 end)
    + (case when p_education is not null and array_length(c.education_levels,1) is not null and p_education = any(c.education_levels) then 2 else 0 end)
    + (case when c.income_limit is not null then 1 else 0 end)
    )::integer as match_score
  from public.myscheme_catalogue c
  where c.eligibility_extracted = true
    and (c.income_limit is null or p_income is null or c.income_limit >= p_income)
    and (array_length(c.eligible_categories,1) is null or p_category is null or p_category = any(c.eligible_categories))
    and (array_length(c.eligible_genders,1) is null or p_gender is null or p_gender = any(c.eligible_genders))
    and (array_length(c.education_levels,1) is null or p_education is null or p_education = any(c.education_levels))
    and (array_length(c.states,1) is null or p_state is null or p_state = any(c.states))
    and (c.min_age is null or p_age is null or p_age >= c.min_age)
    and (c.max_age is null or p_age is null or p_age <= c.max_age)
    and (p_benefit_types is null or array_length(p_benefit_types,1) is null or c.benefit_types && p_benefit_types)
  order by match_score desc, (c.income_limit is not null) desc, c.name asc
  limit greatest(1, coalesce(p_limit, 12));
$$;

grant execute on function public.match_catalogue_schemes(numeric, text, text, text, text, integer, text[], text[], integer) to anon, authenticated, service_role;
-- ============================================================================
