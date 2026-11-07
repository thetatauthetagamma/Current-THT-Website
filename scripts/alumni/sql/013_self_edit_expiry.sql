-- 013: self-edits expire after 2 years. The sync (sync.mjs) may overwrite a self-edited field
-- once self_edited_at is older than 2 years, logging the old value in alumni_changelog.
-- Run by hand in the Supabase SQL editor. Rollback: 013_self_edit_expiry_rollback.sql

alter table public.alumni add column if not exists self_edited_at timestamptz;

-- Existing self-edited rows: start the 2-year clock from their last update.
update public.alumni set self_edited_at = last_updated
where self_edited_at is null
  and 'self-edited' in (company_source, title_source, location_source);

create or replace function public.update_my_alumni(
  p_company text, p_title text, p_location text
)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  me   text := split_part(auth.email(), '@', 1);
  old  alumni%rowtype;
begin
  if me = '' or not exists (select 1 from "Brothers" where userid = me) then
    raise exception 'not a brother';
  end if;

  select * into old from alumni where userid = me;

  insert into alumni (userid, company, title, location,
                      company_source, title_source, location_source, title_fresh, last_updated, self_edited_at)
  values (me, nullif(btrim(p_company), ''), nullif(btrim(p_title), ''), nullif(btrim(p_location), ''),
          'self-edited', 'self-edited', 'self-edited', null, now(), now())
  on conflict (userid) do update set
    company = excluded.company, title = excluded.title, location = excluded.location,
    company_source = 'self-edited', title_source = 'self-edited', location_source = 'self-edited',
    title_fresh = null, last_updated = now(), self_edited_at = now();

  insert into alumni_changelog (userid, field, old_value, new_value, source)
  select me, f.field, f.old_value, f.new_value, 'self-edited'
  from (values
    ('company',  old.company,  nullif(btrim(p_company),  '')),
    ('title',    old.title,    nullif(btrim(p_title),    '')),
    ('location', old.location, nullif(btrim(p_location), ''))
  ) as f(field, old_value, new_value)
  where f.old_value is distinct from f.new_value;
end;
$$;
