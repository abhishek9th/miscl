-- ============================================================================
-- SchemeSetu — fix: portal_applications is missing scheme_type
-- backend/services/journeyOrchestrator.js writes/reads a scheme_type column
-- that was omitted from 20260913_application_journey.sql. Additive, idempotent,
-- non-destructive fix — safe to run on an existing project.
-- ============================================================================
alter table public.portal_applications add column if not exists scheme_type text;
-- ============================================================================
