-- 009: RLS performance. Fixes slow / failing pages (Resources, PNM progress, anything reading Brothers/Pledges).
--
-- CAUSE: the policies from 006/007/008 call is_brother()/is_pledge()/is_admin()/auth.email() directly. Postgres then
-- re-runs them for EVERY ROW. Brothers has ~650 rows and every helper call scans Brothers again (no index), so one
-- query costs ~650 x 650 row checks. Policies on other tables that sub-select Brothers/Pledges (Resources, etc.)
-- trigger that same scan. Result: intermittent "statement timeout" (HTTP 500) and slow pages.
--
-- FIX (Supabase's documented pattern): wrap the calls in (select ...) so they run ONCE per query, and add indexes
-- for the email lookups. Same access rules as before: this changes speed, not who can see what.
--
-- Safe to re-run. Rollback: 009_rls_performance_rollback.sql.

begin;

create index if not exists brothers_email_lower_idx on "Brothers" (lower(email));
create index if not exists pledges_email_lower_idx  on "Pledges"  (lower(email));
create index if not exists brothers_userid_idx      on "Brothers" (userid);
create index if not exists pledges_uniqname_idx     on "Pledges"  (uniqname);

-- 006 / 007 policies
alter policy "Brothers and pledges can read Brothers" on "Brothers"
  using ((select public.is_brother()) or (select public.is_pledge()));
alter policy "Brothers and pledges can read Pledges" on "Pledges"
  using ((select public.is_brother()) or (select public.is_pledge()));
alter policy "Pledges can update only their own row in Pledges" on "Pledges"
  using (lower(email) = lower(coalesce((select auth.email()), '')))
  with check (lower(email) = lower(coalesce((select auth.email()), '')));
alter policy "Brothers and pledges read interviews" on "InterviewDetails"
  using ((select public.is_brother()) or (select public.is_pledge()));
alter policy "Brothers read all rushees, applicants read their own" on "Rushees"
  using ((select public.is_brother()) or lower(coalesce((select auth.email()), '')) = lower(uniqname || '@umich.edu'));
alter policy "Allow read to Brothers or Pledges on pledge info table" on "Pledge_Info"
  using ((select public.is_brother()) or (select public.is_pledge()));
alter policy "Authenticated users can read" on "Pledge_Requirements_Update"
  using ((select public.is_brother()) or (select public.is_pledge()));

-- 008 storage policies
alter policy "brothers bucket: insert own or admin" on storage.objects
  with check (bucket_id = 'brothers' and ((select public.is_admin())
    or lower(name) = lower(split_part(coalesce((select auth.email()), ''), '@', 1)) || '.jpeg'));
alter policy "brothers bucket: update own or admin" on storage.objects
  using (bucket_id = 'brothers' and ((select public.is_admin())
    or lower(name) = lower(split_part(coalesce((select auth.email()), ''), '@', 1)) || '.jpeg'));
alter policy "brothers bucket: delete own or admin" on storage.objects
  using (bucket_id = 'brothers' and ((select public.is_admin())
    or lower(name) = lower(split_part(coalesce((select auth.email()), ''), '@', 1)) || '.jpeg'));
alter policy "pledges bucket: read members" on storage.objects
  using (bucket_id = 'pledges' and ((select public.is_brother()) or (select public.is_pledge())));
alter policy "pledges bucket: insert brother or own" on storage.objects
  with check (bucket_id = 'pledges' and ((select public.is_brother())
    or lower(name) = lower(split_part(coalesce((select auth.email()), ''), '@', 1)) || '.jpeg'));
alter policy "pledges bucket: update brother or own" on storage.objects
  using (bucket_id = 'pledges' and ((select public.is_brother())
    or lower(name) = lower(split_part(coalesce((select auth.email()), ''), '@', 1)) || '.jpeg'));
alter policy "pledges bucket: delete brother" on storage.objects
  using (bucket_id = 'pledges' and (select public.is_brother()));
alter policy "rushees bucket: read brothers or own" on storage.objects
  using (bucket_id = 'rushees' and ((select public.is_brother())
    or lower(name) = lower(split_part(coalesce((select auth.email()), ''), '@', 1)) || '.jpeg'));
alter policy "rushees bucket: insert own" on storage.objects
  with check (bucket_id = 'rushees'
    and lower(name) = lower(split_part(coalesce((select auth.email()), ''), '@', 1)) || '.jpeg');
alter policy "rushees bucket: update own" on storage.objects
  using (bucket_id = 'rushees'
    and lower(name) = lower(split_part(coalesce((select auth.email()), ''), '@', 1)) || '.jpeg');

analyze "Brothers";
analyze "Pledges";

commit;

-- VERIFY: reload /brothers/broresources and /pledges/progress a few times. No more HTTP 500 / timeouts.
