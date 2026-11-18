-- Read-only: shows which migration files in this folder have been applied to the database.
-- Paste into the Supabase SQL editor and run. It changes nothing. Each row: migration, applied (true/false).
-- 003 only drops things and 005 does not exist, so they are not listed.

select * from (values
  ('001_alumni',              to_regclass('public.alumni') is not null),
  ('002_fix_optout',          to_regprocedure('public.is_alumni_optout(text)') is not null),
  ('004_role_lookup',         to_regprocedure('public.role_for_email(text)') is not null),
  ('006_pnm_access',          exists (select 1 from pg_policies where tablename = 'InterviewDetails' and policyname = 'Brothers and pledges read interviews')),
  ('007_pledge_info_reads',   exists (select 1 from pg_policies where tablename = 'Pledge_Info' and policyname = 'Allow read to Brothers or Pledges on pledge info table')),
  ('008_storage_policies',    exists (select 1 from pg_policies where schemaname = 'storage' and policyname = 'brothers bucket: insert own or admin')),
  ('009_rls_performance',     to_regclass('public.brothers_email_lower_idx') is not null),
  ('010_eboard_public',       to_regprocedure('public.eboard_public()') is not null),
  ('011_pd_access',           exists (select 1 from pg_policies where tablename = 'PDResources' and policyname = 'PD resources: brothers read')),
  ('012_rush_attendance',     to_regprocedure('public.record_attendance(text)') is not null),
  ('013_self_edit_expiry',    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'alumni' and column_name = 'self_edited_at')),
  ('014_linkedin_constraint', exists (select 1 from pg_constraint where conname = 'brothers_linkedin_format')),
  ('015_pnm_interviews',      exists (select 1 from pg_policies where tablename = 'InterviewDetails' and policyname = 'PNMs can insert own interviews'))
) as t(migration, applied);
