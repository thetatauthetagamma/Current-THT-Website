-- Rollback for 007: restores the original (sub-select) policies. NOTE: with 006 applied these time out.
begin;

drop policy if exists "Allow read to Brothers or Pledges on pledge info table" on "Pledge_Info";
create policy "Allow read to Brothers or Pledges on pledge info table" on "Pledge_Info"
  for select to authenticated using (
    (exists (select 1 from "Brothers" where "Brothers".userid = split_part(auth.email(), '@'::text, 1)))
    or (exists (select 1 from "Pledges" where ("Pledges".uniqname)::text = split_part(auth.email(), '@'::text, 1))));

drop policy if exists "Authenticated users can read" on "Pledge_Requirements_Update";
create policy "Authenticated users can read" on "Pledge_Requirements_Update"
  for select to authenticated using (
    (exists (select 1 from "Brothers" where "Brothers".userid = split_part(auth.email(), '@'::text, 1)))
    or (exists (select 1 from "Pledges" where ("Pledges".uniqname)::text = split_part(auth.email(), '@'::text, 1))));

grant execute on function public.pledges_protect_progress() to authenticated;
commit;
