-- Rollback for 012: restores the old (forgeable, public) attendance policies and open RushEvents reads.
-- Roll the code back too (the old attendance page does direct inserts).
begin;
drop policy if exists "Brothers read all attendance, rushees read their own" on "Rushee_Attendance";
create policy "Enable insert for authenticated users only" on "Rushee_Attendance" for insert to authenticated with check (true);
create policy "Enable read access for all users" on "Rushee_Attendance" for select to public using (true);
grant select on "RushEvents" to anon;
drop function if exists public.record_attendance(text);
drop function if exists public.attendance_event(text);
commit;
