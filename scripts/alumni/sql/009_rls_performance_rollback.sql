-- Rollback for 009. The policy rewrites keep identical access rules, so there is normally no reason to undo them.
-- To revert anyway, re-run the policy sections of 006, 007 and 008 (they use the un-wrapped form).
-- The indexes are harmless; drop them with:
begin;
drop index if exists brothers_email_lower_idx;
drop index if exists pledges_email_lower_idx;
drop index if exists brothers_userid_idx;
drop index if exists pledges_uniqname_idx;
commit;
