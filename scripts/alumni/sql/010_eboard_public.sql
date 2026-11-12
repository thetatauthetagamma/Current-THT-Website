-- 010: public E-board lookup for the /members page.
--
-- WHY: /members (public, signed-out visitors) read the E-board names straight from the Brothers table with
-- select('*'). That only works while the site ships the service_role key. With the real anon key (after the key
-- swap), Brothers is members-only, so the E-board section would come back empty. It also fetched every column
-- (phone, email) for those rows. This function returns ONLY adminrole, firstname, lastname for the 5 E-board roles.
--
-- ADDITIVE: creates one function, touches no table or policy. Safe to run before the key swap (the page code that
-- uses it falls back to showing blank names if the function is missing, exactly like a failed lookup today).
-- Rollback: 010_eboard_public_rollback.sql

create or replace function public.eboard_public()
returns table (adminrole text, firstname text, lastname text)
language sql stable security definer set search_path = public as $$
  select distinct on (b.adminrole) b.adminrole::text, b.firstname::text, b.lastname::text
  from "Brothers" b
  where b.adminrole in ('regent', 'vice', 'scribe', 'corsec', 'treasurer')
  order by b.adminrole, b.userid;
$$;

revoke all on function public.eboard_public() from public;
grant execute on function public.eboard_public() to anon, authenticated;

-- Check after running (expect up to 5 rows: names + role only):
--   select * from public.eboard_public();
