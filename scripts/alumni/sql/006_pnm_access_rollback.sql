-- Rollback for 006_pnm_access.sql: restores the original policies exactly as they were on Nov 3 2026.
-- This REOPENS the holes (any pledge can edit any pledge; any signed-in account can read member tables).
begin;

drop trigger if exists pledges_protect_progress on "Pledges";
drop function if exists public.pledges_protect_progress();

drop policy if exists "Pledges can update only their own row in Pledges" on "Pledges";
create policy "Pledges can update only their own row in Pledges" on "Pledges"
  for update using (exists (select 1 from "Pledges" "Pledges_1"
    where ("Pledges_1".uniqname)::text = split_part((auth.jwt() ->> 'email'::text), '@'::text, 1)));

drop policy if exists "Brothers and pledges can read Pledges" on "Pledges";
create policy "Allow all authenticated users to read Pledges table" on "Pledges"
  for select using (auth.role() = 'authenticated'::text);

drop policy if exists "Brothers and pledges can read Brothers" on "Brothers";
create policy "Allow all authenticated users to read Brothers table" on "Brothers"
  for select using (auth.role() = 'authenticated'::text);

drop policy if exists "Brothers and pledges read interviews" on "InterviewDetails";
create policy "Only brothers read" on "InterviewDetails"
  for select using (auth.role() = 'authenticated'::text);

drop policy if exists "Brothers read all rushees, applicants read their own" on "Rushees";
create policy "Allow all authenticated users to read Rushees table" on "Rushees"
  for select using (auth.role() = 'authenticated'::text);

-- Helpers are left in place (harmless); drop them too if you want a full revert:
-- drop function if exists public.is_brother(); drop function if exists public.is_pledge();
commit;
