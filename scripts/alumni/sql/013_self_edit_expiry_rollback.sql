-- Undo 013: drop the column. Then re-run the update_my_alumni definition from 001_alumni.sql.
alter table public.alumni drop column if exists self_edited_at;
