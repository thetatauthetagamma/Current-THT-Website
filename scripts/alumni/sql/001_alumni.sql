-- Alumni directory: tables, RLS, search function.
--
-- ADDITIVE ONLY. Creates new objects; does not alter "Brothers", "Pledges" or any
-- existing policy. Safe to re-run (everything is IF NOT EXISTS / CREATE OR REPLACE /
-- DROP POLICY IF EXISTS on our own tables).
--
-- Run by hand in the Supabase SQL editor after reading it.
-- Access rule everywhere: caller's email prefix must match "Brothers".userid,
-- the same convention the existing policies use.

------------------------------------------------------------------------------
-- 1. Tables
------------------------------------------------------------------------------

-- One row per brother who has alumni info. Name, major, year, email, phone and
-- linkedin stay in "Brothers" (single source of truth); this table holds only
-- what Brothers does not have. No FK on purpose: we do not know that
-- "Brothers".userid is unique/PK, and a missing alumni row is a valid state.
create table if not exists public.alumni (
  userid          text primary key,
  company         text,
  title           text,
  location        text,
  company_source  text check (company_source  in ('enrichment','self-edited','import')),
  title_source    text check (title_source    in ('enrichment','self-edited','import')),
  location_source text check (location_source in ('enrichment','self-edited','import')),
  title_fresh     boolean,                       -- null = unknown / self-edited
  extra           jsonb not null default '{}'::jsonb,
  enriched_at     timestamptz,
  last_updated    timestamptz not null default now()
);

-- Every real change, for the refresh job and officers.
create table if not exists public.alumni_changelog (
  id          bigserial primary key,
  userid      text not null,
  field       text not null,
  old_value   text,
  new_value   text,
  source      text not null,
  changed_at  timestamptz not null default now()
);
create index if not exists alumni_changelog_userid_idx on public.alumni_changelog (userid, changed_at desc);

-- Suppression list: hashes only, so a re-import cannot bring someone back.
create table if not exists public.alumni_optouts (
  id            bigserial primary key,
  email_hash    text,
  linkedin_hash text,
  created_at    timestamptz not null default now()
);
create unique index if not exists alumni_optouts_email_hash_idx on public.alumni_optouts (email_hash) where email_hash is not null;

------------------------------------------------------------------------------
-- 2. Row level security
------------------------------------------------------------------------------

alter table public.alumni           enable row level security;
alter table public.alumni_changelog enable row level security;
alter table public.alumni_optouts   enable row level security;

revoke all on public.alumni, public.alumni_changelog, public.alumni_optouts from anon;
revoke all on public.alumni_changelog, public.alumni_optouts from authenticated;
revoke insert, update, delete on public.alumni from authenticated;
grant select on public.alumni to authenticated;

-- Brothers read the directory. Nobody writes directly: edits go through
-- update_my_alumni() below; the refresh job uses the service-role key.
drop policy if exists "Brothers can read alumni" on public.alumni;
create policy "Brothers can read alumni" on public.alumni
  for select using (
    exists (select 1 from public."Brothers" b
            where b.userid = split_part(auth.email(), '@', 1))
  );

-- Changelog readable by dev/parent admins only. alumni_optouts: no policy and no
-- grant = service role / security-definer functions only.
grant select on public.alumni_changelog to authenticated;
drop policy if exists "Admins can read alumni changelog" on public.alumni_changelog;
create policy "Admins can read alumni changelog" on public.alumni_changelog
  for select using (
    exists (select 1 from public."Brothers" b
            where b.userid = split_part(auth.email(), '@', 1)
              and b.adminrole = any (array['dev','parent']))
  );

-- Opt-out lookup for search_alumni(). alumni_optouts is not readable by brothers,
-- so this runs with definer rights and only ever returns true/false.
create or replace function public.is_alumni_optout(p_email text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from alumni_optouts o
    where o.email_hash = encode(sha256(convert_to(lower(coalesce(p_email, '')), 'UTF8')), 'hex')
  );
$$;
revoke all on function public.is_alumni_optout(text) from public, anon;
grant execute on function public.is_alumni_optout(text) to authenticated;

------------------------------------------------------------------------------
-- 3. Search (name, major, company, year) over Brothers LEFT JOIN alumni
------------------------------------------------------------------------------

create or replace function public.search_alumni(
  p_query   text default null,   -- name; every word must match first or last name
  p_major   text default null,   -- substring, case-insensitive
  p_company text default null,   -- substring, case-insensitive
  p_year    text default null,   -- exact
  p_limit   int  default 24,
  p_offset  int  default 0
)
returns table (
  userid text, firstname text, lastname text, major text, year text, roll bigint,
  email text, phone text, linkedin text,
  company text, title text, title_fresh boolean, location text,
  last_updated timestamptz, total_count bigint
)
language sql stable security invoker
set search_path = public
as $$
  select b.userid, b.firstname, b.lastname, b.major, b.year, b.roll,
         b.email::text, b.phone, b.linkedin,
         a.company, a.title, a.title_fresh, a.location,
         a.last_updated, count(*) over () as total_count
  from "Brothers" b
  left join alumni a on a.userid = b.userid
  where exists (select 1 from "Brothers" me where me.userid = split_part(auth.email(), '@', 1))
    and not public.is_alumni_optout(b.email)
    and (p_query is null or btrim(p_query) = '' or not exists (
          select 1 from unnest(regexp_split_to_array(btrim(p_query), '\s+')) w
          where (coalesce(b.firstname, '') || ' ' || coalesce(b.lastname, '')) not ilike
                '%' || replace(replace(replace(w, '\', '\\'), '%', '\%'), '_', '\_') || '%'))
    and (p_major   is null or p_major   = '' or b.major   ilike '%' || replace(replace(replace(p_major,   '\', '\\'), '%', '\%'), '_', '\_') || '%')
    and (p_company is null or p_company = '' or a.company ilike '%' || replace(replace(replace(p_company, '\', '\\'), '%', '\%'), '_', '\_') || '%')
    and (p_year    is null or p_year    = '' or b.year = p_year)
  order by a.last_updated desc nulls last, b.lastname, b.firstname
  limit  least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

-- Values for the filter dropdowns.
create or replace function public.alumni_filter_options()
returns table (kind text, value text)
language sql stable security invoker
set search_path = public
as $$
  select * from (
    select 'major', b.major from "Brothers" b where b.major is not null and b.major <> ''
    union
    select 'year', b.year from "Brothers" b where b.year is not null and b.year <> ''
    union
    select 'company', a.company from alumni a where a.company is not null and a.company <> ''
  ) t(kind, value)
  where exists (select 1 from "Brothers" me where me.userid = split_part(auth.email(), '@', 1))
  order by kind, value;
$$;

------------------------------------------------------------------------------
-- 4. Self-service edit (SECURITY DEFINER: RLS cannot limit columns,
--    so this is the only write path for brothers). There is no self-service opt-out;
--    officers suppress someone by inserting hashes into alumni_optouts by hand.
------------------------------------------------------------------------------

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
                      company_source, title_source, location_source, title_fresh, last_updated)
  values (me, nullif(btrim(p_company), ''), nullif(btrim(p_title), ''), nullif(btrim(p_location), ''),
          'self-edited', 'self-edited', 'self-edited', null, now())
  on conflict (userid) do update set
    company = excluded.company, title = excluded.title, location = excluded.location,
    company_source = 'self-edited', title_source = 'self-edited', location_source = 'self-edited',
    title_fresh = null, last_updated = now();

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

revoke all on function public.search_alumni(text,text,text,text,int,int) from public, anon;
revoke all on function public.alumni_filter_options()                    from public, anon;
revoke all on function public.update_my_alumni(text,text,text)           from public, anon;
grant execute on function public.search_alumni(text,text,text,text,int,int) to authenticated;
grant execute on function public.alumni_filter_options()                    to authenticated;
grant execute on function public.update_my_alumni(text,text,text)           to authenticated;
