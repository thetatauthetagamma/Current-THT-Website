-- Undo 004_role_lookup.sql. Removes only that function; no table is touched.
-- After this, middleware falls back to direct table reads (which only work with the service_role key).

drop function if exists public.role_for_email(text);
