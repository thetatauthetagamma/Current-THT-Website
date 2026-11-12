-- Fix: search_alumni() failed with "permission denied for table alumni_optouts".
-- Run once if you already ran the original 001_alumni.sql. Safe to re-run.
-- (001_alumni.sql now includes this fix for fresh installs.)

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

revoke all on function public.search_alumni(text,text,text,text,int,int) from public, anon;
grant execute on function public.search_alumni(text,text,text,text,int,int) to authenticated;
