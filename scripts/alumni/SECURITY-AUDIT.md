# Security audit (Oct 2026)

Scope: pages/, components/, contexts/, utils/, supabase.js, auth.js, middleware.js, next.config.js, .github, scripts.
RLS state was read from the live project (table, RLS on/off, policy names and commands only; no data, no keys).
Status: **Fixed in code** = in this branch, **Needs DB** = SQL I wrote but you must run, **Open** = decision or ops work.

| # | Where | Issue | Severity | Fix | Status |
|---|-------|-------|----------|-----|--------|
| 1 | Vercel env `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Holds the **service_role** key, shipped in the public JS bundle. Bypasses all RLS for anyone who opens dev tools. | Critical | Set the real anon key in Vercel, redeploy, then **rotate service_role** and check tables for tampering. Order: run 004 SQL, merge this branch, switch key (see Rollout). | Open (ops) |
| 2 | `auth.js`, `middleware.js` | Role checks read `Brothers`/`Pledges` with the anon client. Only worked because of #1; with the real anon key every user is redirected to /404. 4 queries per request. | High | `role_for_email()` SQL function (`sql/004_role_lookup.sql`), one RPC per request, only for private paths. Falls back to the old reads if the function is missing (deploy-order safe). | Fixed in code, Needs DB |
| 3 | `middleware.js` | A request with **no** `userEmail` cookie skipped every check, so deleting the cookie opened all private routes. | High | No cookie (or empty) on a private route now redirects to /404. Public pages and `/_next` untouched. | Fixed in code |
| 4 | `middleware.js`, `components/Navbar.tsx` | `userEmail` is a plain browser cookie: anyone can set it to a brother's email. The middleware is a navigation guard only. | Medium | Pages only show data that RLS lets the caller read, so real protection is RLS (below). Proper fix: put the Supabase access token in a cookie and verify it server-side (`auth.getUser(token)`). Note `_app.tsx` makes an auth-helpers client but pages use `supabase.js` (localStorage session), so this needs a small refactor. | Open |
| 5 | `PDCommitteeMembers`, `PDManagers`, `PDResources` | **RLS is disabled.** With the real anon key, anyone can read AND write them (pages/brothers/professional-development.tsx, components/admin/PDManagerPanel.tsx do inserts/updates/deletes). Today the admin key hides this. | High | Enable RLS: read for brothers, write for admins/PD managers, mirroring `Resources` policies. Must be designed with the web committee (policy needs to match who may edit PD). Not written blind. | Open |
| 6 | `BrotherProfiles`, `Emails` | RLS on, **no policies**: nobody except service_role can read. Fine if unused (no code references them). | Info | Leave, or drop if dead. | OK |
| 7 | Tables read via the browser client (Brothers, Pledges, Rushees, Application_*, Pledge_*, RushEvents, RushInfo, InterviewDetails, Resources, BigLittlePairings, Rushee_Attendance) | All have RLS and policies for authenticated users, but policy bodies were not reviewed (names only). Once the real anon key is used, every client query depends on those policies. Names suggest coverage (admin-only deletes/inserts, member updates). | Medium | After switching keys, click through every page as brother, pledge, admin, parent admin and a rushee, and fix any 401/empty result with a targeted policy. | Open (test) |
| 8 | `Rushee_Attendance`, `RushEvents`, `Rushees`, `Application_Questions`, `Pledges` etc. | Some policies are public-role ("read for all users"/"Allow anyone to read"). `Rushees` and `Pledges` reads are "authenticated" per name but listed with role `-` (public); the body decides. Rushees may contain applicant personal info and photos. | Medium | Read the USING clauses; restrict `Rushees`/`Rushee_Attendance` reads to brothers if applicants' data should not be public. | Open |
| 9 | Storage buckets `brothers`, `pledges`, `rushees` | Policies not reviewed (storage schema not inspected). Pages upload and fetch via the browser client. | Medium | Review bucket policies; make sure `rushees` is not world-listable. | Open |
| 10 | `supabase.js` | Single anon client from `NEXT_PUBLIC_*` env. Correct as long as the value really is the anon key. No hardcoded keys or URLs anywhere in the repo. | Info | None | OK |
| 11 | Repo search | No `service_role`, JWT or secret strings committed. `.env` is gitignored; `.env.example` has blank values. No `dangerouslySetInnerHTML`, `eval`, or API routes (`pages/api` absent). | Info | None | OK |
| 12 | `next.config.js` | Declares a `middleware` key that Next ignores (middleware.js at the root is what runs). Harmless, misleading. | Low | Delete the key when convenient. | Open |
| 13 | `.github/workflows/deploy.yml` | `actions/checkout@v3`, `npx vercel --prod` on every push to main; secrets are used correctly. No PR checks, so nothing runs tests before deploy. | Low | Add a test/build job on pull requests. | Open |
| 14 | `components/Navbar.tsx` | Cookie is a session cookie without `Secure`/`SameSite` flags. Low impact given #4. | Low | `Cookies.set(..., { secure: true, sameSite: 'lax' })`. | Open |
| 15 | `role_for_email` | Anyone with the public anon key can ask whether an email belongs to a brother/pledge/admin (booleans and role name only). Far narrower than #1. | Low | Accepted. Goes away if #4 is done and the function is restricted to `authenticated`. | Accepted |

## Rollout (keeps the live site working at every step)
1. Run `scripts/alumni/sql/004_role_lookup.sql` in the Supabase SQL editor. Check: `select * from public.role_for_email('<a brother email>')`.
2. Merge this branch (auth.js/middleware.js use the RPC; works with either key).
3. Test on a Vercel preview with the REAL anon key (see #7), fix policy gaps, decide #5.
4. Production: set the real anon key in Vercel, redeploy, verify all roles.
5. Rotate the service_role key in Supabase, update `SUPABASE_SERVICE_ROLE_KEY` in `.env` and the GitHub secret. Audit tables for tampering.
6. Delete the `PGRST202` fallback in `auth.js`.

Rollback for step 1: `sql/004_role_lookup_rollback.sql`.
