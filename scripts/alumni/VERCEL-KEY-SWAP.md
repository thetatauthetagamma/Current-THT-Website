# Supabase key swap: instructions for whoever owns the Vercel account

**Why this matters:** the live site's Vercel variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` currently holds the Supabase
**service_role** (admin) key. Every `NEXT_PUBLIC_` variable ends up in the public JavaScript, so anyone who opens
the browser dev tools can copy that key. With it they can read, change or delete anything in the database, which
includes brothers' and rushees' personal info. The fix is to put the real **anon** key there and then retire
the leaked key. Background: `scripts/alumni/SECURITY-AUDIT.md`, item 1.

The code in this repo already works with the real anon key. Local testing has used it since Nov 2026.

Steps are tagged **[Supabase]** (anyone with access to the Supabase project, for example Jadon), **[GitHub]** (a
repo admin) or **[Vercel]** (the Vercel account owner).

## 0. Before you start [Supabase]
Every database migration must be applied, or pages will come up empty once the key is swapped.
Run `scripts/alumni/sql/check_migrations.sql` in the Supabase SQL editor. It only reads. Every row must say
`applied = true`. If one says `false`, run that numbered file from `scripts/alumni/sql/` and check again.

## 1. Merge the code [GitHub]
Merge the `alumni-directory` pull request into `main`. The existing `deploy.yml` action deploys it to production.
Nothing breaks here, because the code works with either key. Check that the site still loads and that you can sign in.

## 2. Put the real anon key in Vercel [Supabase] + [Vercel]
1. **[Supabase]** Dashboard > Project Settings > API Keys. Copy the key labelled **anon / public**. Never copy the
   **service_role** one. If the project shows the newer keys, the **publishable** key (`sb_publishable_...`)
   works too.
2. **[Vercel]** Project > Settings > Environment Variables > `NEXT_PUBLIC_SUPABASE_ANON_KEY` > Edit. Paste the key
   for **Production** (and Preview, if it is set there). Save.
3. **[Vercel]** `NEXT_PUBLIC_` values are baked in when the site is built, so saving is not enough. Go to
   Deployments, open the latest production deployment, choose **Redeploy** and untick "use existing build cache".
   Pushing any commit to `main` also works.
4. Check the live site, signed in as each of these:
   - signed out: the home page and public pages load.
   - brother: Member Directory, Alumni, Study Buddy, Family Tree, Professional Development, Interviews.
   - PNM: the pledge progress page and Interviews (a PNM can add an interview).
   - admin: `/brothers/admin`.
   If a page is empty or the browser console shows 401/403 errors, tell Jadon which page and which account.
   **Rollback:** set the old value back and redeploy.

## 3. Retire the leaked service_role key [Supabase] (after step 2 works)
The old key is still valid until it is retired, and it has been public. Pick one:
- **(a) Recommended:** Dashboard > Project Settings > API Keys. Create a new **secret** key (`sb_secret_...`) for the
  sync scripts, then **disable the legacy JWT-based keys** (anon + service_role). For this to work, step 2 must
  have used the **publishable** key, because disabling the legacy keys also turns off the old anon key.
- **(b)** Dashboard > Project Settings > JWT Keys. Rotate the legacy JWT secret. This changes **both** legacy keys
  and signs everyone out, so straight after it, repeat step 2 with the new anon key.

Then update every place the admin key is kept:
- **[GitHub]** repo > Settings > Secrets and variables > Actions > `SUPABASE_SERVICE_ROLE_KEY` (used by the alumni sync).
- Jadon's local `.env`.
- Run a dry run to confirm it works: `node scripts/alumni/sync-cli.mjs`.

Finally, glance over the important tables (Brothers, Pledges, Rushees, alumni) for anything that looks tampered with.

## 4. Repo secrets for the alumni sync [GitHub]
The semester sync (`.github/workflows/alumni-sync.yml`) needs three repo secrets: `NEXT_PUBLIC_SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` (the new key from step 3) and `BRIGHTDATA_API_KEY` (from Jadon). Until they exist,
the scheduled run fails and GitHub emails the repo admins. See `scripts/alumni/README.md`, section 6.

## Still open after the swap (web committee)
- The `userEmail` cookie can be forged. Pages are protected by database rules (RLS), but the navigation guard is
  not real security. See SECURITY-AUDIT.md item 4.
