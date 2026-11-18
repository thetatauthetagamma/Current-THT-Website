-- Rollback for 008: restores the original wide-open storage policies. This REOPENS the hole.
begin;

drop policy if exists "brothers bucket: insert own or admin" on storage.objects;
drop policy if exists "brothers bucket: update own or admin" on storage.objects;
drop policy if exists "brothers bucket: delete own or admin" on storage.objects;
drop policy if exists "pledges bucket: read members" on storage.objects;
drop policy if exists "pledges bucket: insert brother or own" on storage.objects;
drop policy if exists "pledges bucket: update brother or own" on storage.objects;
drop policy if exists "pledges bucket: delete brother" on storage.objects;
drop policy if exists "rushees bucket: read brothers or own" on storage.objects;
drop policy if exists "rushees bucket: insert own" on storage.objects;
drop policy if exists "rushees bucket: update own" on storage.objects;

create policy "Enable all access for all users" on storage.objects for all to public using (true) with check (true);
create policy "brothers 6aw1wz_0" on storage.objects for insert to public with check (bucket_id = 'brothers');
create policy "brothers 6aw1wz_2" on storage.objects for update to public using (bucket_id = 'brothers');
create policy "brothers 6aw1wz_3" on storage.objects for delete to public using (bucket_id = 'brothers');
create policy "pledge pics 1qx2zmi_0" on storage.objects for select to public using (bucket_id = 'pledges');
create policy "pledge pics 1qx2zmi_1" on storage.objects for insert to public with check (bucket_id = 'pledges');
create policy "pledge pics 1qx2zmi_2" on storage.objects for update to public using (bucket_id = 'pledges');
create policy "pledge pics 1qx2zmi_3" on storage.objects for delete to public using (bucket_id = 'pledges');

update storage.buckets set public = true where id in ('pledges', 'rushees');
commit;
