-- Brothers can no longer remove themselves from the directory (decision: no self-service opt-out).
-- Run once if you already ran 001_alumni.sql. Safe to re-run.
-- alumni_optouts and is_alumni_optout() stay, so an officer can still suppress someone by hand:
--   insert into alumni_optouts (email_hash)
--   values (encode(sha256(convert_to(lower('person@example.com'), 'UTF8')), 'hex'));

drop function if exists public.request_alumni_optout();
