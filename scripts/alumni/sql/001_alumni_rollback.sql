-- Undo 001_alumni.sql. Removes only the objects that file created.
-- WARNING: drops the alumni tables and everything stored in them (self-edited info,
-- changelog, opt-out list). Nothing in "Brothers", "Pledges" or other tables is touched.

begin;

drop function if exists public.search_alumni(text, text, text, text, int, int);
drop function if exists public.alumni_filter_options();
drop function if exists public.is_alumni_optout(text);
drop function if exists public.update_my_alumni(text, text, text);
drop function if exists public.request_alumni_optout();

-- Dropping a table also drops its policies, indexes and grants.
drop table if exists public.alumni_changelog;
drop table if exists public.alumni_optouts;
drop table if exists public.alumni;

commit;
