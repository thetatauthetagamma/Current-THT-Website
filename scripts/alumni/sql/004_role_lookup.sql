-- Role lookup for middleware (replaces four direct reads of "Brothers"/"Pledges").
--
-- WHY: middleware runs with the anon key and no user session. With the real anon key, RLS makes
-- "Brothers" read as empty, so every signed-in user was redirected to /404. The site only worked
-- because NEXT_PUBLIC_SUPABASE_ANON_KEY on Vercel holds the service_role key (a leak). This
-- function lets middleware ask one narrow question, so the real anon key can be restored.
--
-- ADDITIVE ONLY. Creates one function; changes no table or policy. Safe to re-run.
-- Run this BEFORE deploying the matching auth.js/middleware.js change (the code falls back to the
-- old table reads if this function does not exist yet).
--
-- Residual risk: anyone holding the public anon key can ask "is <email> a brother/pledge/admin?".
-- That is far less than the status quo (the anon key currently reads everything).

create or replace function public.role_for_email(p_email text)
returns table (is_brother boolean, is_pledge boolean, admin_role text)
language sql stable security definer
set search_path = public
as $$
  with e as (select nullif(lower(btrim(p_email)), '') as email)
  select
    (select count(*) from "Brothers" b, e where e.email is not null and lower(b.email) = e.email) = 1,
    (select count(*) from "Pledges"  p, e where e.email is not null and lower(p.email) = e.email) = 1,
    (select b.adminrole::text from "Brothers" b, e
      where e.email is not null and lower(b.email) = e.email
      order by b.userid limit 1);
$$;

revoke all on function public.role_for_email(text) from public;
grant execute on function public.role_for_email(text) to anon, authenticated;

-- Quick check after running (replace with a real email):
--   select * from public.role_for_email('someone@umich.edu');
