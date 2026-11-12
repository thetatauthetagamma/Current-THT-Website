// LinkedIn -> alumni sync. Pure logic plus a small PostgREST client (fetch is injectable).
// Provider code stays in enrich.mjs; the database is touched only through the client below.
import { normalizeLinkedInUrl } from './csv.mjs';
import { enrich as defaultEnrich, estimateCost } from './enrich.mjs';

const FIELDS = ['company', 'title', 'location'];
export const SELF_EDIT_TTL_DAYS = 730;                    // self-edits lock a field for 2 years
// Locked while self_edited_at is within the TTL. A missing timestamp is treated as locked (safe default).
export function selfEditLocked(existing, now) {
  if (!existing?.self_edited_at) return true;
  return new Date(now) - new Date(existing.self_edited_at) < SELF_EDIT_TTL_DAYS * 864e5;
}
const clean = (v) => (v == null ? '' : String(v).trim());
const same = (a, b) => clean(a).toLowerCase() === clean(b).toLowerCase();

// Brothers rows -> { urlToUsers: Map<url, userid[]>, invalid: [{userid, linkedin}] }
export function buildTargets(brothers) {
  const urlToUsers = new Map();
  const invalid = [];
  for (const b of brothers) {
    if (!clean(b.linkedin)) continue;
    const url = normalizeLinkedInUrl(b.linkedin);
    if (!url) { invalid.push({ userid: b.userid, linkedin: b.linkedin }); continue; }
    if (!urlToUsers.has(url)) urlToUsers.set(url, []);
    urlToUsers.get(url).push(b.userid);
  }
  return { urlToUsers, invalid };
}

// Decide what one successful lookup changes. `existing` is the current alumni row or undefined.
// Returns { row, changes: [{field, old, new}], selfEditedSkipped: [field] }.
export function planChanges(existing, rec, now = new Date().toISOString()) {
  const base = existing ?? { userid: null, company: null, title: null, location: null,
    company_source: null, title_source: null, location_source: null, title_fresh: null, extra: {},
    enriched_at: null, last_updated: now };
  const row = { ...base };
  const changes = [];
  const selfEditedSkipped = [];
  for (const f of FIELDS) {
    const incoming = clean(rec[f]);
    if (!incoming) continue;                              // never write blanks over anything
    // Locked by the brother. A field they left blank is not locked: LinkedIn may fill it at the next sync.
    if (base[`${f}_source`] === 'self-edited' && clean(base[f]) && selfEditLocked(base, now)) {
      if (!same(base[f], incoming)) selfEditedSkipped.push(f);
      continue;
    }                                                     // expired self-edits fall through and may be replaced
    if (same(base[f], incoming)) continue;                // unchanged
    changes.push({ field: f, old: base[f] ?? null, new: incoming });
    row[f] = incoming;
    row[`${f}_source`] = 'enrichment';
    if (f === 'title') row.title_fresh = rec.title_fresh ?? null;
  }
  row.enriched_at = now;                                  // every ok lookup
  if (changes.length) row.last_updated = now;
  return { row, changes, selfEditedSkipped };
}

// Core run. db = { getBrothers({userids}), getAlumni(userids), upsertAlumni(rows), insertChangelog(rows) }
export async function runSync({ db, enrichFn = defaultEnrich, userids = null, limit = null, live = false,
  now = new Date().toISOString(), enrichOptions = {} }) {
  const brothers = await db.getBrothers({ userids });
  const { urlToUsers, invalid } = buildTargets(brothers);
  let urls = [...urlToUsers.keys()];
  if (limit != null) urls = urls.slice(0, limit);
  const report = { urls: urls.length, invalid, cost: estimateCost(urls.length), live,
    updated: 0, jobChanges: [], failed: [], selfEditedSkipped: [], changes: 0, unchanged: 0 };
  if (!live || urls.length === 0) return report;          // dry run: no provider call, no writes

  const out = await enrichFn(urls, enrichOptions);
  const userList = urls.flatMap((u) => urlToUsers.get(u));
  const existingRows = await db.getAlumni(userList);
  const existing = new Map(existingRows.map((r) => [r.userid, r]));

  const rows = [];
  const log = [];
  for (const url of urls) {
    const rec = out.results.get(url);
    for (const userid of urlToUsers.get(url)) {
      if (!rec || rec.status !== 'ok') {
        report.failed.push({ userid, url, error: rec?.error ?? 'no result' });
        continue;
      }
      const plan = planChanges(existing.get(userid), rec, now);
      plan.row.userid = userid;
      rows.push(plan.row);
      for (const f of plan.selfEditedSkipped) report.selfEditedSkipped.push({ userid, field: f });
      if (!plan.changes.length) { report.unchanged++; continue; }
      report.updated++;
      for (const c of plan.changes) {
        log.push({ userid, field: c.field, old_value: c.old, new_value: c.new, source: 'enrichment', changed_at: now });
        if (c.field === 'company' && c.old) report.jobChanges.push({ userid, old: c.old, new: c.new });
      }
    }
  }
  report.changes = log.length;
  if (rows.length) await db.upsertAlumni(rows);
  if (log.length) await db.insertChangelog(log);
  return report;
}

// PostgREST client. The service-role key bypasses RLS: never log it or put it in a URL.
export function createRestClient({ url, key, fetchFn = globalThis.fetch }) {
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  const base = url.replace(/\/+$/, '') + '/rest/v1';
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const call = async (path, init = {}) => {
    const res = await fetchFn(base + path, { ...init, headers: { ...headers, ...init.headers } });
    if (!res.ok) throw new Error(`Supabase ${init.method ?? 'GET'} ${path.split('?')[0]} failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    return res;
  };
  const getAll = async (path) => {
    const all = [];
    for (let from = 0; ; from += 1000) {
      const res = await call(path, { headers: { Range: `${from}-${from + 999}`, 'Range-Unit': 'items' } });
      const page = JSON.parse(await res.text());
      all.push(...page);
      if (page.length < 1000) return all;
    }
  };
  const inList = (ids) => `in.(${ids.map((i) => `"${String(i).replace(/"/g, '')}"`).join(',')})`;
  return {
    getBrothers: ({ userids } = {}) => getAll('/Brothers?select=userid,linkedin&linkedin=not.is.null&order=userid' +
      (userids?.length ? `&userid=${encodeURIComponent(inList(userids))}` : '')),
    async getAlumni(ids) {
      const out = [];
      for (let i = 0; i < ids.length; i += 100) out.push(...await getAll(`/alumni?select=*&userid=${encodeURIComponent(inList(ids.slice(i, i + 100)))}`));
      return out;
    },
    upsertAlumni: (rows) => call('/alumni?on_conflict=userid', { method: 'POST', body: JSON.stringify(rows),
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } }),
    insertChangelog: (rows) => call('/alumni_changelog', { method: 'POST', body: JSON.stringify(rows),
      headers: { Prefer: 'return=minimal' } }),
  };
}

// A few hidden/dead profiles are normal. A large share failing means the provider or key is broken.
export function shouldFail(r, maxFailRate = 0.25) {
  if (!r.live || r.urls === 0) return false;
  return r.failed.length / r.urls > maxFailRate;
}

export function formatReport(r) {
  const L = [];
  L.push(`Records to look up: ${r.urls}. Skipped for invalid LinkedIn URL: ${r.invalid.length}.`);
  L.push(`Free tier: ${r.cost.freeTierRecords}/month (${r.cost.withinFreeTier ? 'within' : 'OVER'}). Pay-as-you-go would be $${r.cost.payAsYouGoUsd}.`);
  for (const i of r.invalid) L.push(`  invalid URL: ${i.userid} -> ${i.linkedin}`);
  if (!r.live) { L.push('DRY RUN: no Bright Data call, no database writes. Re-run with --yes to go live.'); return L.join('\n'); }
  L.push(`Updated: ${r.updated} people (${r.changes} field changes). Unchanged: ${r.unchanged}.`);
  L.push(`Job changes: ${r.jobChanges.length}`);
  for (const j of r.jobChanges) L.push(`  ${j.userid}: ${j.old} -> ${j.new}`);
  L.push(`Failed/missing lookups: ${r.failed.length}`);
  for (const f of r.failed) L.push(`  ${f.userid}: ${f.error}`);
  L.push(`Self-edited fields left alone: ${r.selfEditedSkipped.length}`);
  for (const s of r.selfEditedSkipped) L.push(`  ${s.userid}: ${s.field}`);
  return L.join('\n');
}
