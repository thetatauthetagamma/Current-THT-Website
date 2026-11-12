# Alumni directory: officer guide

This folder keeps the **Alumni** page (`/brothers/alumni`) up to date. It reads each brother's LinkedIn URL, asks Bright Data (a paid-but-free-tier LinkedIn data service) for the current company and location, and saves the result in our Supabase database. You do not need to be a programmer to run it, but you do need a terminal.

## 1. How it fits together

```
Brothers table (Supabase)         Bright Data
  userid, linkedin, major, ...        |
        |                             |
        +--> sync (this folder) ------+
                   |
                   v
            alumni table  --->  /brothers/alumni page (brothers only)
            alumni_changelog    (every real change is logged)
```

- **`Brothers`** is the source of truth for name, major, class year, email, phone and **LinkedIn URL**. The sync only reads it.
- **`alumni`** holds what `Brothers` does not: `company`, `title`, `location`, where each value came from (`enrichment`, `self-edited` or `import`), and when it was last updated.
- **Who can see it:** only signed-in brothers. This is enforced in the database (row level security), not just in the page. The page reads through the `search_alumni` function.
- **Brothers editing their own info:** the "Edit my info" button calls `update_my_alumni`, the only way a brother can write to `alumni`. Anything they fill in is marked `self-edited` and **the sync leaves it alone for 2 years**. A field they leave blank (for example, no company yet) stays open, so the next sync fills it from LinkedIn.
- **Title:** Bright Data returned no job title in our tests, so titles come only from brothers' own edits.
- **Changelog:** every change by the sync or a brother is recorded in `alumni_changelog` (old value, new value, source, time). Only `dev` and `parent` admins can read it.
- **No self-service opt-out.** To hide someone, an officer adds a hash of their email to `alumni_optouts` in the Supabase SQL editor:
  ```sql
  insert into alumni_optouts (email_hash)
  values (encode(sha256(convert_to(lower('person@example.com'), 'UTF8')), 'hex'));
  ```
  The directory page then hides them. (The sync does not check this list; it only affects what the page shows.)

The database is set up by running the numbered files in `sql/` by hand in the Supabase SQL editor, in order. Most have a `_rollback.sql` partner. To see which ones are already applied, run `sql/check_migrations.sql` (read-only).

## 2. Install (macOS, Windows, Linux)

1. Install **Node.js 18 or newer** from https://nodejs.org and **Git**.
2. Get the website repo and open a terminal in its folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env` (macOS/Linux: `cp .env.example .env`; Windows: `copy .env.example .env`). Fill in the values (section 4). `.env` is ignored by git; **never commit it or paste keys in chat/email**.

The scripts use only Node (no extra packages) and work the same on all three systems. Run the tests any time with `node --test scripts/alumni/__tests__`.

## 3. Adding or fixing LinkedIn URLs

The sync reads `Brothers.linkedin`. To add or fix someone, edit that column in Supabase (Table Editor) or through the site's normal profile editing. Any form of the URL works (`linkedin.com/in/name`, with or without `https://` or a trailing slash). Anything that is not a `linkedin.com/in/...` link is skipped and listed in the report as an invalid URL.

*Optional CSV fallback:* `node scripts/alumni/run.mjs validate file.csv` checks a CSV (columns: roll number, name, email, linkedin_url, major) and `run.mjs enrich file.csv` previews enrichment. This path only prints results; it does **not** write to the database. Never commit CSVs with real alumni data (they are gitignored).

## 4. Keys: where they live and how to rotate

| Key | Local (your computer) | Automatic run (GitHub) |
|---|---|---|
| `BRIGHTDATA_API_KEY` | `.env` | repo secret `BRIGHTDATA_API_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` | repo secret `SUPABASE_SERVICE_ROLE_KEY` |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env` | repo secret `NEXT_PUBLIC_SUPABASE_URL` |

- **Bright Data key:** create a new one in your Bright Data account settings, put it in `.env` and the GitHub secret, then delete the old one in Bright Data.
- **Supabase service-role key:** Supabase dashboard > Project Settings > API. It **bypasses all database security**, so treat it like a password: never put it in code, in a `NEXT_PUBLIC_` variable, or in chat. To rotate, generate a new one in Supabase, update `.env` and the GitHub secret, then verify with a dry run (section 5).
- GitHub secrets: repo > Settings > Secrets and variables > Actions.

## 5. Running a refresh by hand

Run from the repo folder. **Without `--yes` nothing is sent to Bright Data and nothing is written**; it only counts.

```
node scripts/alumni/sync-cli.mjs                        # dry run, everyone
node scripts/alumni/sync-cli.mjs --limit 3 --yes        # live test, 3 people
node scripts/alumni/sync-cli.mjs --userid abc,def --yes # live, specific uniqnames
node scripts/alumni/sync-cli.mjs --yes                  # live, everyone
```

Always do a dry run first, then `--limit 3`, then the full run. A full run takes roughly 10 to 15 minutes.

**Reading the report** (live run):
- *Updated: N people* = rows where something really changed. Running again right away should say `Updated: 0`.
- *Job changes* = someone's company changed (`uniqname: old -> new`).
- *Failed/missing lookups* = Bright Data returned nothing. Most often "The profile is hidden or private" (dead URL or private profile). Nothing is written for these people; fix their URL in `Brothers` or leave them. A few of these are normal. The command only exits with an error (red run) when more than 25% of lookups fail, which points to a broken key or account, or when it crashes.
- *Self-edited fields left alone* = the brother set that value themselves, so it was not overwritten.

Rules the sync always follows: it only touches company and location (and title if a provider ever returns one); it never writes a blank over an existing value; it never overwrites a filled-in self-edited field less than 2 years old (blank self-edited fields are filled from LinkedIn); unchanged values (ignoring case and spaces) are skipped.

## 6. Automatic refresh (GitHub Actions)

The workflow `.github/workflows/alumni-sync.yml` runs the sync once per semester on a schedule and can also be started by hand: repo > Actions > the workflow > **Run workflow**. It uses the three secrets from section 4. If anything fails, the run exits with an error, shows red in the Actions tab, and GitHub emails the repo admins.

Heads up: GitHub **turns off scheduled workflows after 60 days without repo activity**. If the semester run did not happen, open the Actions tab and re-enable it, or run it manually.

## 7. Swapping the data provider

All provider code is inside the `enrich()` function in `enrich.mjs`. Replace its body with calls to the new provider and keep returning the same normalized records (`linkedin_url`, `status`, `name`, `company`, `title`, `title_fresh`, `location`, `error`), matched by URL. Nothing else needs to change. Update `enrich.test.mjs` to match.

## 8. Adding a new field (for example "industry")

1. Add the column to the `alumni` table (SQL editor) and a `<field>_source` column if brothers can edit it.
2. Return it from `search_alumni` and, if editable, `update_my_alumni` (new SQL file in `sql/`).
3. Add it to the `FIELDS` list in `sync.mjs` and the normalized record in `enrich.mjs`.
4. Show it in `components/alumni/AlumniCard.jsx` (and `EditMyInfoModal.jsx` if editable).
5. Add tests and run them.

## 9. Billing

Bright Data's free tier is **5,000 records per month**. A full sync is about 255 records (everyone with a LinkedIn URL), so the cost is $0. No payment card is attached to the account, so it cannot be billed; if the free allowance ran out, requests would simply fail. Dry runs print the record count and what pay-as-you-go would cost ($1.50 per 1,000 records). Hidden or dead profiles were not billed in our test (2 credits for 3 requests), but confirm in the Bright Data dashboard.

## 10. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY is not set` | Missing from `.env` (or the GitHub secret). Add it. |
| `BRIGHTDATA_API_KEY is not set` | Same, for the Bright Data key. |
| `Supabase GET ... failed: HTTP 401/403` | Wrong or rotated key, or the wrong project URL. |
| `HTTP 429` or very slow | Bright Data is rate limiting. The script backs off and retries. Wait and re-run. |
| Many "hidden or private" failures | Normal for a few people. If it is nearly everyone, check the Bright Data account and key. |
| Alumni page empty or 404 for a brother | Their email must match a row in `Brothers`. |
| Someone's company will not update | They edited it themselves (it is locked), or LinkedIn shows no current job. |
| Scheduled run never happened | GitHub paused it for inactivity (section 6). |

## 11. Contact

Built by Jadon Oliver. Phone: `[add phone]`. Email: `[add email]`.
