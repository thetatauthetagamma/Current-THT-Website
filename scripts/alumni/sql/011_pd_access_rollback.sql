-- Rollback for 011: RLS off again on the PD tables (REOPENS them), helpers removed.
begin;
drop policy if exists "PD resources: brothers read" on "PDResources";
drop policy if exists "PD resources: managers insert" on "PDResources";
drop policy if exists "PD resources: managers update" on "PDResources";
drop policy if exists "PD resources: managers delete" on "PDResources";
drop policy if exists "PD committee: brothers read" on "PDCommitteeMembers";
drop policy if exists "PD committee: managers insert" on "PDCommitteeMembers";
drop policy if exists "PD committee: managers update" on "PDCommitteeMembers";
drop policy if exists "PD committee: managers delete" on "PDCommitteeMembers";
drop policy if exists "PD managers: read own row or dev" on "PDManagers";
drop policy if exists "PD managers: dev insert" on "PDManagers";
drop policy if exists "PD managers: dev delete" on "PDManagers";
alter table "PDResources"        disable row level security;
alter table "PDCommitteeMembers" disable row level security;
alter table "PDManagers"         disable row level security;
drop function if exists public.is_pd_manager();
drop function if exists public.is_dev();
commit;
