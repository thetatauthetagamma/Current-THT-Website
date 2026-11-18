-- 012: rush attendance can no longer be forged, and the check-in key is no longer public.
--
-- PROBLEMS (found Nov 2026):
--  1. Rushee_Attendance: ANY signed-in Google account could insert a row for ANY uniqname/event (insert check = true).
--  2. Rushee_Attendance: readable by everyone, even signed out (976 rows of who attended what).
--  3. RushEvents is publicly readable and the public /rush timeline did select("*"), so every visitor downloaded each
--     event's secret attendance_key.
--  4. The check-in page chose the new row id from "max(id)+1" (race-prone) and needed broad read access to do it.
--
-- FIX
--  * attendance_event(key)  : looks up one event BY KEY. Callable signed out (so the sign-in prompt can name the event).
--  * record_attendance(key) : the ONLY way to record attendance. Takes the uniqname from the person's sign-in (never from the
--                             client), requires @umich.edu, an enabled event, and the same end-of-event-day deadline as before (Detroit time).
--  * Rushee_Attendance      : no direct inserts; brothers read everything, a rushee reads only their own rows.
--  * RushEvents             : signed-OUT visitors can read every column except attendance_key (the /rush page now lists its columns).
--
-- Brother/admin screens only READ attendance (verified in RushAdminPanel / RusheeAttendance), so they keep working.
-- KNOWN LIMIT: any signed-in account can still read attendance_key (brothers need it for QR codes; same Postgres role).
--
-- Run in the Supabase SQL editor. Deploy the matching code (attendance page + Timeline) in the same release: the old page
-- would fail to record attendance after this runs. Rollback: 012_rush_attendance_rollback.sql

begin;

create or replace function public.attendance_event(p_key text)
returns table (id smallint, name text, description text, location text, "date" timestamptz, attendance boolean)
language sql stable security definer set search_path = public as $$
  select e.id, e.name::text, e.description::text, e.location::text, e."date", e.attendance
  from "RushEvents" e
  where e.attendance_key is not null and e.attendance_key = p_key
  limit 1;
$$;

create or replace function public.record_attendance(p_key text)
returns table (out_status text, out_event_name text)
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(coalesce(auth.email(), ''));
  v_uniq  text;
  ev      record;
begin
  if v_email = '' then
    return query select 'not_signed_in'::text, null::text; return;
  end if;
  if v_email not like '%@umich.edu' then
    return query select 'not_umich'::text, null::text; return;
  end if;
  v_uniq := split_part(v_email, '@', 1);

  select e.id, e.name, e.attendance, e."date" into ev
  from "RushEvents" e where e.attendance_key is not null and e.attendance_key = p_key limit 1;
  if not found then
    return query select 'event_not_found'::text, null::text; return;
  end if;
  if not coalesce(ev.attendance, false) then
    return query select 'attendance_disabled'::text, ev.name::text; return;
  end if;
  -- same rule as the old page: allowed until the END of the event day (Detroit time); no date = always allowed
  if ev."date" is not null
     and (now() at time zone 'America/Detroit')::date > (ev."date" at time zone 'America/Detroit')::date then
    return query select 'deadline_passed'::text, ev.name::text; return;
  end if;

  if exists (select 1 from "Rushee_Attendance" a where a.uniqname = v_uniq and a.event_id = ev.id) then
    update "Rushee_Attendance" set event_name = ev.name where uniqname = v_uniq and event_id = ev.id;
  else
    insert into "Rushee_Attendance" (uniqname, event_id, event_name) values (v_uniq, ev.id, ev.name);
  end if;
  return query select 'recorded'::text, ev.name::text;
end;
$$;

revoke all on function public.attendance_event(text)  from public;
revoke all on function public.record_attendance(text) from public;
grant execute on function public.attendance_event(text)  to anon, authenticated;
grant execute on function public.record_attendance(text) to authenticated;

-- Rushee_Attendance: no direct inserts, no public reads.
drop policy if exists "Enable insert for authenticated users only" on "Rushee_Attendance";
drop policy if exists "Enable read access for all users" on "Rushee_Attendance";
create policy "Brothers read all attendance, rushees read their own" on "Rushee_Attendance" for select to authenticated
  using ((select public.is_brother()) or lower(uniqname) = lower(split_part(coalesce((select auth.email()), ''), '@', 1)));

-- RushEvents: signed-out visitors cannot read the check-in key.
revoke select on "RushEvents" from anon;
grant select (id, name, description, location, link, "date", link_name, open, attendance) on "RushEvents" to anon;

commit;

-- VERIFY: (1) public /rush page still lists events while signed out. (2) Scan a real check-in link signed in with a umich
-- account: it should say attendance recorded, and a second scan should still succeed. (3) Signed out, the page shows the
-- event name and asks you to sign in.
