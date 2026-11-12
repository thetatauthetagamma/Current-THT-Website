# Checklist for the repo admin / Vercel owner

**Total time: about 30 minutes.** Nothing here costs money.

**Why:** the live site's Vercel setting `NEXT_PUBLIC_SUPABASE_ANON_KEY` holds the Supabase **admin (service_role)
key**. Everything in a `NEXT_PUBLIC_` setting is sent to every visitor's browser. So anyone on the internet, with
no sign-in, can copy the key and read, change or delete the whole database: about 650 brothers' phones and emails,
PNM data, 224 rushee applications. Google sign-in does not protect against this. The fix is to put the real
**anon** key there (it is meant to be public and is limited by the database's access rules) and then retire the
leaked key.

Each step says who does it: **[Supabase]** = anyone with Supabase access (Jadon), **[GitHub admin]** = a repo
admin, **[Vercel]** = the Vercel account owner.

---

## ☐ 0. See the problem yourself (2 min, optional)

1. Open https://thetatau-umich.org, press **F12**, open **Network**, and reload. Type `supabase` in the filter box
   (click Members or Sign in if nothing shows). Click a request, then Headers > Request Headers > `apikey`.
2. Paste this in the **Console** tab, with the key between the quotes (do not paste it into a website):
   `JSON.parse(atob('PASTE_KEY_HERE'.split('.')[1])).role`
   Today it prints `"service_role"` (bad). After step 3 it prints `"anon"` (good).

## ☐ 1. Database is ready [Supabase] (done Nov 12 2026)

All migrations are applied. To re-check, run `scripts/alumni/sql/check_migrations.sql` in the Supabase SQL editor.
It only reads, and every row should say `true`.

## ☐ 2. Merge the pull request [GitHub] (5 min)

Merge the `alumni-directory` PR into `main`. The existing deploy action puts it live. This is safe with the current
key, because the code works with both keys. **Check:** open the live site and sign in. Your pages should load.

- If something is broken, revert the merge on GitHub. The site goes back to how it was.
- The red "Workers Builds" (Cloudflare) check also fails on `main` and does not affect the Vercel site. If hosting
  is moving to Cloudflare, step 3 must be done there too.

## ☐ 3. Put the real anon key in Vercel [Supabase] + [Vercel] (10 min)

1. **[Supabase]** Dashboard > Project Settings > API Keys. Copy the **anon / public** key (or the newer
   **publishable** key, `sb_publishable_...`). **Never** copy the service_role / secret key.
2. **[Vercel]** Project > Settings > Environment Variables > `NEXT_PUBLIC_SUPABASE_ANON_KEY` > Edit. Paste it for
   **Production** (and Preview if that one is set too). Save.
3. **[Vercel]** Saving alone does nothing, because the key is built into the site. Go to Deployments > latest
   production deployment > **Redeploy**, and untick "use existing build cache".
4. **Check** while signed in: as a brother (Alumni, Member Directory, Interviews), as a PNM (progress page,
   Interviews), and as an admin (`/brothers/admin`). Repeat step 0, which should now say `"anon"`.
   **Undo:** put the old value back and redeploy.

## ☐ 4. Retire the leaked admin key [Supabase] (10 min, only after step 3 works)

The old key has been public and keeps working until it is retired. Pick one:

- **(a) Recommended:** Project Settings > API Keys. Create a new **secret** key (`sb_secret_...`), then **disable
  the legacy keys**. This only works if step 3 used the **publishable** key, because disabling the legacy keys
  also turns off the old anon key.
- **(b)** Project Settings > JWT Keys. Rotate the legacy JWT secret. This changes **both** old keys and signs
  everyone out, so straight after it, repeat step 3 with the new anon key.

Then put the new secret key in Jadon's local `.env`. Glance over Brothers, Pledges, Rushees and alumni for anything
that looks tampered with.

## ☐ 5. Secrets for the alumni sync [GitHub admin] (5 min)

Go to repo > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**. Only admins see
Settings. Add:

| Name                          | Value                                                              |
| ----------------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`  | Supabase > Project Settings > API > Project URL                    |
| `SUPABASE_SERVICE_ROLE_KEY` | the **new** secret key from step 4 (not the old one)         |
| `BRIGHTDATA_API_KEY`        | from Jadon's `.env` (type it in yourself; don't send it in chat) |

**Check:** Actions > **alumni-sync** > **Run workflow**, with "Live run" left unticked. That is a dry run and
costs nothing. Green means done. It then runs by itself on Jan 15 and Aug 15.

---

## Later (not urgent, after step 4)

- **`userEmail` cookie:** the page guard trusts a cookie that anyone can edit. After step 3 the database still
  checks the real sign-in, so a faker sees empty pages, but the proper fix is to verify the session on the server.
  This is about 3–4 hours of work, signs everyone out once, and should be its own PR. Details:
  `scripts/alumni/SECURITY-AUDIT.md` item 4.
- Questions: Jadon Oliver (built the alumni directory and the fixes in this PR, and looked for security vulnerabilities).
