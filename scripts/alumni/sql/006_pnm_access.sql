-- 006: close the PNM / outsider data-access holes found in the Nov 2026 review.
--
-- PROBLEMS FIXED
--  1. "Pledges can update only their own row in Pledges" checked "a pledge row exists for me", not
--     "this is MY row", so any PNM could edit ANY PNM's signoffs, hours, interviews and profile.
--  2. A PNM could also edit their OWN signoffs/hours/interviews (the progress page does a client-side
--     cleanup write to signoffs). Progress columns are now brother-only, enforced by a trigger.
--  3. Reads on Pledges, Brothers, InterviewDetails and Rushees were "any signed-in Google account"
--     (auth.role() = 'authenticated'), so a rushee/applicant or any stranger who signs in could read them.
--
-- WHAT STAYS THE SAME
--  - Brothers keep full read/write via the existing brother policies ("Only members can update Pledges",
--    "bros can insert/update", "All brothers can update rushee rows", ...). Those are NOT touched.
--  - PNMs can still read Pledges + Brothers + InterviewDetails (member directory, study buddy, family
--    tree, interviews database all rely on it).
--  - Rushees keep read access to their own application row only (pages/apply.jsx).
--
-- KNOWN LIMIT (follow-up): RLS cannot hide columns, so a PNM can still READ other PNMs' hours/signoffs
-- through the same SELECT that study buddy / directory need. Writing is blocked. To hide them too, switch
-- those pages to a column-limited function (pledge_directory()) later.
--
-- NOT TOUCHED (separate decisions): Rushee_Attendance public read, the public E-board lookup on /members
-- (anonymous visitors need a narrow function once the real anon key is live), PDCommitteeMembers etc.
--
-- Run in the Supabase SQL editor. Rollback: 006_pnm_access_rollback.sql. Safe to re-run.

begin;

-- 1. Helper predicates. SECURITY DEFINER so they can read Brothers/Pledges without recursing through RLS.
create or replace function public.is_brother() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from "Brothers" b
                 where b.email is not null and lower(b.email) = lower(coalesce(auth.email(), '')));
$$;

create or replace function public.is_pledge() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from "Pledges" p
                 where p.email is not null and lower(p.email) = lower(coalesce(auth.email(), '')));
$$;

revoke all on function public.is_brother() from public;
revoke all on function public.is_pledge()  from public;
grant execute on function public.is_brother() to authenticated;
grant execute on function public.is_pledge()  to authenticated;

-- 2. Pledges: own-row updates only (was: any pledge could update any row).
drop policy if exists "Pledges can update only their own row in Pledges" on "Pledges";
create policy "Pledges can update only their own row in Pledges" on "Pledges"
  for update using (lower(email) = lower(coalesce(auth.email(), '')))
  with check (lower(email) = lower(coalesce(auth.email(), '')));

-- 3. Pledges: members only can read (was: any signed-in account).
drop policy if exists "Allow all authenticated users to read Pledges table" on "Pledges";
create policy "Brothers and pledges can read Pledges" on "Pledges"
  for select using (public.is_brother() or public.is_pledge());

-- 4. Trigger: a non-brother can never change progress columns or identity, even on their own row.
create or replace function public.pledges_protect_progress() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' and not public.is_brother() then
    new.interviews    := old.interviews;
    new.signoffs      := old.signoffs;
    new."socialHours" := old."socialHours";
    new."academicHours" := old."academicHours";
    new.uniqname      := old.uniqname;
    new.email         := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists pledges_protect_progress on "Pledges";
create trigger pledges_protect_progress before update on "Pledges"
  for each row execute function public.pledges_protect_progress();

-- 5. Brothers table: members only (was: any signed-in account).
drop policy if exists "Allow all authenticated users to read Brothers table" on "Brothers";
create policy "Brothers and pledges can read Brothers" on "Brothers"
  for select using (public.is_brother() or public.is_pledge());

-- 6. InterviewDetails: the policy was named "Only brothers read" but allowed everyone signed in.
drop policy if exists "Only brothers read" on "InterviewDetails";
create policy "Brothers and pledges read interviews" on "InterviewDetails"
  for select using (public.is_brother() or public.is_pledge());

-- 7. Rushees: brothers read all; an applicant reads only their own application.
drop policy if exists "Allow all authenticated users to read Rushees table" on "Rushees";
create policy "Brothers read all rushees, applicants read their own" on "Rushees"
  for select using (public.is_brother() or lower(coalesce(auth.email(), '')) = lower(uniqname || '@umich.edu'));

commit;

-- VERIFY (run each; every block is rolled back, nothing changes). Replace the emails.
--   -- a) a stranger sees nothing (expect 0, 0, 0, 0):
--   begin; set local role authenticated;
--   select set_config('request.jwt.claims', '{"role":"authenticated","email":"stranger@gmail.com"}', true);
--   select (select count(*) from "Pledges"), (select count(*) from "Brothers"),
--          (select count(*) from "InterviewDetails"), (select count(*) from "Rushees"); rollback;
--   -- b) a PNM sees pledges+brothers, and cannot change anyone else's row (expect UPDATE 0):
--   begin; set local role authenticated;
--   select set_config('request.jwt.claims', '{"role":"authenticated","email":"<a real pnm email>"}', true);
--   select count(*) from "Pledges";
--   update "Pledges" set pronouns = 'x' where email <> '<a real pnm email>'; rollback;
--   -- c) a brother still reads everything:
--   begin; set local role authenticated;
--   select set_config('request.jwt.claims', '{"role":"authenticated","email":"<a real brother email>"}', true);
--   select (select count(*) from "Pledges"), (select count(*) from "Brothers"); rollback;
