-- 014: LinkedIn values must be a real linkedin.com profile/company/school link (or blank).
-- Safe to re-run (drops then re-adds each constraint). Run by hand in the Supabase SQL editor. Rollback: 014_linkedin_constraint_rollback.sql
-- NOT VALID = enforced for every new INSERT/UPDATE, existing rows are not checked yet. After the cleanup script
-- (scripts/linkedin-cleanup.mjs --apply) has normalized the old rows, run the two VALIDATE lines at the bottom.
-- The profile forms already save https://www.linkedin.com/in/... (utils/alumni.js validateLinkedInUrl).

alter table public."Brothers" drop constraint if exists brothers_linkedin_format;
alter table public."Brothers" add constraint brothers_linkedin_format
  check (linkedin is null or btrim(linkedin) = '' or
         linkedin ~* '^https?://([a-z0-9-]+\.)?linkedin\.com/(in|pub|company|school)/[^/[:space:]]+')
  not valid;

alter table public."Pledges" drop constraint if exists pledges_linkedin_format;
alter table public."Pledges" add constraint pledges_linkedin_format
  check (linkedin is null or btrim(linkedin) = '' or
         linkedin ~* '^https?://([a-z0-9-]+\.)?linkedin\.com/(in|pub|company|school)/[^/[:space:]]+')
  not valid;

-- After cleanup:
-- alter table public."Brothers" validate constraint brothers_linkedin_format;
-- alter table public."Pledges"  validate constraint pledges_linkedin_format;
