-- 011: turn RLS on for the Professional Development tables (security audit item #5).
--
-- PROBLEM: PDResources, PDCommitteeMembers and PDManagers had RLS OFF. The PD page only shows edit buttons to people in
-- PDManagers, but that is enforced in the browser only. After the key swap, anyone holding the public anon key could read,
-- change or delete these tables (PDCommitteeMembers also holds names, emails, phone numbers).
--
-- RULES (match what the PD page already does; no new role needed):
--   PDResources, PDCommitteeMembers : brothers can read. Only people in "PDManagers" (the PD heads) or a 'dev' admin can write.
--   PDManagers                      : you can read your OWN row (the page checks it) and a 'dev' can read all. Only 'dev' can add/remove
--                                     (that is who sees the "manage PD managers" panel today).
--
-- To give someone PD edit rights: a 'dev' adds their uniqname in the admin PD managers panel (or insert into "PDManagers").
-- Run in the Supabase SQL editor. Rollback: 011_pd_access_rollback.sql

begin;

create or replace function public.is_dev() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from "Brothers" b
                 where b.email is not null and lower(b.email) = lower(coalesce(auth.email(), ''))
                   and b.adminrole = 'dev');
$$;

create or replace function public.is_pd_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from "PDManagers" m
                 where lower(m.uniqname) = lower(split_part(coalesce(auth.email(), ''), '@', 1)));
$$;

revoke all on function public.is_dev() from public;
revoke all on function public.is_pd_manager() from public;
grant execute on function public.is_dev() to anon, authenticated;
grant execute on function public.is_pd_manager() to anon, authenticated;

alter table "PDResources"        enable row level security;
alter table "PDCommitteeMembers" enable row level security;
alter table "PDManagers"         enable row level security;

-- PDResources
create policy "PD resources: brothers read" on "PDResources" for select to authenticated
  using ((select public.is_brother()));
create policy "PD resources: managers insert" on "PDResources" for insert to authenticated
  with check ((select public.is_pd_manager()) or (select public.is_dev()));
create policy "PD resources: managers update" on "PDResources" for update to authenticated
  using ((select public.is_pd_manager()) or (select public.is_dev()))
  with check ((select public.is_pd_manager()) or (select public.is_dev()));
create policy "PD resources: managers delete" on "PDResources" for delete to authenticated
  using ((select public.is_pd_manager()) or (select public.is_dev()));

-- PDCommitteeMembers
create policy "PD committee: brothers read" on "PDCommitteeMembers" for select to authenticated
  using ((select public.is_brother()));
create policy "PD committee: managers insert" on "PDCommitteeMembers" for insert to authenticated
  with check ((select public.is_pd_manager()) or (select public.is_dev()));
create policy "PD committee: managers update" on "PDCommitteeMembers" for update to authenticated
  using ((select public.is_pd_manager()) or (select public.is_dev()))
  with check ((select public.is_pd_manager()) or (select public.is_dev()));
create policy "PD committee: managers delete" on "PDCommitteeMembers" for delete to authenticated
  using ((select public.is_pd_manager()) or (select public.is_dev()));

-- PDManagers (the list of PD heads)
create policy "PD managers: read own row or dev" on "PDManagers" for select to authenticated
  using (lower(uniqname) = lower(split_part(coalesce((select auth.email()), ''), '@', 1)) or (select public.is_dev()));
create policy "PD managers: dev insert" on "PDManagers" for insert to authenticated
  with check ((select public.is_dev()));
create policy "PD managers: dev delete" on "PDManagers" for delete to authenticated
  using ((select public.is_dev()));

commit;

-- VERIFY (as yourself in the app): the PD page still loads for a brother; a PD head can add/edit/delete a resource;
-- a brother who is NOT in PDManagers sees no edit buttons and a direct edit is refused.
