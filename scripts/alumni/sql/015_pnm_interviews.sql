-- 015: let PNMs add and edit their OWN interview write-ups (brothers keep the existing "bros can insert/update").
-- A PNM row must carry the PNM's own email (that email is also how the site decides who "owns" a write-up),
-- so a PNM cannot post or change anything under someone else's name.
-- Run by hand in the Supabase SQL editor. Safe to re-run. Rollback: 015_pnm_interviews_rollback.sql

drop policy if exists "PNMs can insert own interviews" on "InterviewDetails";
create policy "PNMs can insert own interviews" on "InterviewDetails"
  for insert to authenticated
  with check ((select public.is_pledge())
              and lower(email) = lower(coalesce((select auth.email()), '')));

drop policy if exists "PNMs can update own interviews" on "InterviewDetails";
create policy "PNMs can update own interviews" on "InterviewDetails"
  for update to authenticated
  using ((select public.is_pledge())
         and lower(email) = lower(coalesce((select auth.email()), '')))
  with check ((select public.is_pledge())
              and lower(email) = lower(coalesce((select auth.email()), '')));
