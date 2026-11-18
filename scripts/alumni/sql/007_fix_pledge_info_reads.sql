-- 007: fix PNM progress page after 006.
--
-- SYMPTOM: PNM sees "--" days and empty bars. /rest/v1/Pledge_Info and Pledge_Requirements_Update return
-- HTTP 500 ("canceling statement due to statement timeout" in the Postgres logs).
-- CAUSE: their SELECT policies ran EXISTS sub-selects on "Brothers" and "Pledges". After 006 those tables
-- have their own policies, so every check nested another policy evaluation and timed out.
-- FIX: use the 006 helper functions directly (no sub-selects on RLS tables). Same meaning: brothers + pledges only.
-- Also: the trigger function should not be callable as an RPC (triggers do not need EXECUTE to fire).
--
-- Run in the Supabase SQL editor. Rollback: 007_fix_pledge_info_reads_rollback.sql

begin;

drop policy if exists "Allow read to Brothers or Pledges on pledge info table" on "Pledge_Info";
create policy "Allow read to Brothers or Pledges on pledge info table" on "Pledge_Info"
  for select to authenticated using (public.is_brother() or public.is_pledge());

drop policy if exists "Authenticated users can read" on "Pledge_Requirements_Update";
create policy "Authenticated users can read" on "Pledge_Requirements_Update"
  for select to authenticated using (public.is_brother() or public.is_pledge());

revoke all on function public.pledges_protect_progress() from public, anon, authenticated;

commit;

-- VERIFY after running: reload /pledges/progress as a PNM. Expect the date countdown and the bars.
