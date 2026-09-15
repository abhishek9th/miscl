-- ============================================================================
-- SchemeSetu — additional registration-form fields.
-- spouse_name and education_level (used as "qualification") already exist on
-- profiles (20260915_profile_extension.sql / original schema) and are reused,
-- not duplicated. Only age, address and pincode are genuinely new.
-- address here is a simple one-line value captured at registration for quick
-- convenience; the richer structured `addresses` table (current/permanent,
-- city/district/etc.) from the onboarding wizard remains the detailed source
-- for form auto-fill. Safe to run on an existing project. Idempotent.
-- ============================================================================
alter table public.profiles add column if not exists age     integer;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists pincode text;

do $$
begin
  begin
    alter table public.profiles add constraint profiles_age_chk check (age is null or (age >= 0 and age <= 120));
  exception when duplicate_object then null; end;
  begin
    alter table public.profiles add constraint profiles_pincode_chk check (pincode is null or pincode ~ '^[0-9]{6}$');
  exception when duplicate_object then null; end;
end $$;
-- ============================================================================
