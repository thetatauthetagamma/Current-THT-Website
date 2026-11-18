-- 008: lock down Supabase Storage (photos). Found in the Nov 2026 review (audit item #9).
--
-- PROBLEM: storage.objects had a policy "Enable all access for all users" (ALL, public, true/true) plus
-- public INSERT/UPDATE/DELETE policies on the brothers and pledges buckets. Anyone holding the public anon
-- key, signed in or not, could upload, overwrite or delete ANY photo in ANY bucket (incl. rushee/applicant photos).
--
-- HOW THE SITE USES STORAGE (all verified in code): files are "<uniqname>.jpeg", read with .download() and
-- written with .upload(..., { upsert: true }). Brothers/pledges upload their OWN photo (members/[profile]),
-- brothers upload pledge photos (PledgeTile, newPledge), rushees upload their OWN photo (apply.jsx).
--
-- NEW RULES
--   brothers bucket : read stays PUBLIC (the public /members page shows E-board photos). Write: your own file, or an admin.
--   pledges bucket  : read brothers + pledges only. Write: any brother, or your own file.
--   rushees bucket  : read brothers + the applicant's own file. Write: your own file. (Applicant photos are personal.)
-- The pledges and rushees buckets become non-public (nothing in the code uses public URLs: grep getPublicUrl = none).
--
-- Run in the Supabase SQL editor AFTER 006/007. Rollback: 008_storage_policies_rollback.sql.
-- After running, test: upload your own profile photo, load the directory, and (as a rushee) the apply page photo.

begin;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from "Brothers" b
                 where b.email is not null and lower(b.email) = lower(coalesce(auth.email(), ''))
                   and coalesce(b.adminrole, '') <> '');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Remove the wide-open policies.
drop policy if exists "Enable all access for all users" on storage.objects;
drop policy if exists "brothers 6aw1wz_0" on storage.objects;  -- INSERT, public
drop policy if exists "brothers 6aw1wz_2" on storage.objects;  -- UPDATE, public
drop policy if exists "brothers 6aw1wz_3" on storage.objects;  -- DELETE, public
drop policy if exists "pledge pics 1qx2zmi_0" on storage.objects; -- SELECT, public
drop policy if exists "pledge pics 1qx2zmi_1" on storage.objects; -- INSERT, public
drop policy if exists "pledge pics 1qx2zmi_2" on storage.objects; -- UPDATE, public
drop policy if exists "pledge pics 1qx2zmi_3" on storage.objects; -- DELETE, public
-- "brothers 6aw1wz_1" (SELECT on the brothers bucket) is kept on purpose.

-- brothers bucket: own file or admin.
create policy "brothers bucket: insert own or admin" on storage.objects for insert to authenticated
  with check (bucket_id = 'brothers' and (public.is_admin()
    or lower(name) = lower(split_part(coalesce(auth.email(), ''), '@', 1)) || '.jpeg'));
create policy "brothers bucket: update own or admin" on storage.objects for update to authenticated
  using (bucket_id = 'brothers' and (public.is_admin()
    or lower(name) = lower(split_part(coalesce(auth.email(), ''), '@', 1)) || '.jpeg'));
create policy "brothers bucket: delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'brothers' and (public.is_admin()
    or lower(name) = lower(split_part(coalesce(auth.email(), ''), '@', 1)) || '.jpeg'));

-- pledges bucket: brothers and pledges read; any brother or the pledge themself writes.
create policy "pledges bucket: read members" on storage.objects for select to authenticated
  using (bucket_id = 'pledges' and (public.is_brother() or public.is_pledge()));
create policy "pledges bucket: insert brother or own" on storage.objects for insert to authenticated
  with check (bucket_id = 'pledges' and (public.is_brother()
    or lower(name) = lower(split_part(coalesce(auth.email(), ''), '@', 1)) || '.jpeg'));
create policy "pledges bucket: update brother or own" on storage.objects for update to authenticated
  using (bucket_id = 'pledges' and (public.is_brother()
    or lower(name) = lower(split_part(coalesce(auth.email(), ''), '@', 1)) || '.jpeg'));
create policy "pledges bucket: delete brother" on storage.objects for delete to authenticated
  using (bucket_id = 'pledges' and public.is_brother());

-- rushees bucket: brothers read all, applicant reads and writes only their own file.
create policy "rushees bucket: read brothers or own" on storage.objects for select to authenticated
  using (bucket_id = 'rushees' and (public.is_brother()
    or lower(name) = lower(split_part(coalesce(auth.email(), ''), '@', 1)) || '.jpeg'));
create policy "rushees bucket: insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'rushees'
    and lower(name) = lower(split_part(coalesce(auth.email(), ''), '@', 1)) || '.jpeg');
create policy "rushees bucket: update own" on storage.objects for update to authenticated
  using (bucket_id = 'rushees'
    and lower(name) = lower(split_part(coalesce(auth.email(), ''), '@', 1)) || '.jpeg');

update storage.buckets set public = false where id in ('pledges', 'rushees');

commit;
