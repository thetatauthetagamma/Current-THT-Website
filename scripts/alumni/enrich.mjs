// ALL provider-specific code lives in this file (Bright Data LinkedIn Profiles Scraper API).
// To swap providers, replace the body of enrich() and keep the normalized record shape.
//
// Normalized record:
//   { linkedin_url, status: 'ok' | 'error' | 'missing', name, company, title,
//     title_fresh: true | false | null, location, error }
// title_fresh: false when Bright Data says `position` was backfilled from cache (possibly stale),
// null when the response does not say.
import { normalizeLinkedInUrl } from './csv.mjs';

const BASE = 'https://api.brightdata.com/datasets/v3';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0'; // LinkedIn Profiles scraper
const BATCH_SIZE = 20; // Bright Data docs: a best practice for sync requests, not a hard cap
const COST_PER_RECORD = 1.5 / 1000; // pay-as-you-go; the free tier is 5,000 records/month
const FREE_TIER_RECORDS = 5000;

export function estimateCost(count) {
  return {
    records: count,
    freeTierRecords: FREE_TIER_RECORDS,
    withinFreeTier: count <= FREE_TIER_RECORDS,
    payAsYouGoUsd: Number((count * COST_PER_RECORD).toFixed(4)),
  };
}

function positionBackfilled(raw) {
  const b = raw.backfilled_columns;
  if (b == null) return null;
  if (Array.isArray(b)) return b.includes('position');
  if (typeof b === 'object') return b.position == null ? null : Boolean(b.position);
  return null;
}

function rowUrl(raw) {
  // Error rows carry the URL in input.url; success rows in input_url.
  return normalizeLinkedInUrl(raw.input_url ?? raw.input?.url ?? raw.url ?? null);
}

export function normalizeProfile(raw) {
  const company = raw.current_company_name ?? raw.current_company?.name ?? null;
  const title = raw.position ?? raw.current_company?.title ?? null;
  // Observed live: `city` holds the full string ("Ann Arbor, Michigan, United States"); `location` is just the city.
  const location = raw.city ?? raw.location ?? null;
  const name = raw.name ?? ([raw.first_name, raw.last_name].filter(Boolean).join(' ') || null);
  const failed = Boolean(raw.error || raw.error_code) || (!name && !company);
  const backfilled = positionBackfilled(raw);
  return {
    linkedin_url: rowUrl(raw),
    status: failed ? 'error' : 'ok',
    name, company, title,
    title_fresh: title ? (backfilled == null ? null : !backfilled) : null,
    location,
    error: failed ? String(raw.error ?? raw.error_code ?? 'no data returned') : null,
  };
}

// The API may return a JSON array, a single object, or newline-delimited JSON.
function parseBody(text) {
  const t = text.trim();
  if (!t) return [];
  try {
    const v = JSON.parse(t);
    return Array.isArray(v) ? v : [v];
  } catch {
    return t.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  }
}

async function request(fetchFn, url, init, { retries = 5, sleep }) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetchFn(url, init);
    if (res.status === 429 && attempt < retries) {
      await sleep(Math.min(60000, 2000 * 2 ** attempt)); // back off: 25 429s in 5 min can blacklist the IP
      continue;
    }
    return res;
  }
}

async function scrapeBatch(urls, { apiKey, fetchFn, sleep, pollMs, maxPolls }) {
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
  const q = `dataset_id=${DATASET_ID}&include_errors=true`; // always explicit: docs disagree on the default
  const res = await request(fetchFn, `${BASE}/scrape?${q}`, {
    method: 'POST', headers, body: JSON.stringify({ input: urls.map((url) => ({ url })) }),
  }, { sleep });
  if (res.status === 200) return parseBody(await res.text());
  if (res.status === 202) {
    const { snapshot_id: id } = JSON.parse(await res.text());
    for (let i = 0; i < maxPolls; i++) {
      await sleep(pollMs);
      const p = await request(fetchFn, `${BASE}/progress/${id}`, { headers }, { sleep });
      const status = JSON.parse(await p.text()).status;
      if (status === 'ready') {
        const s = await request(fetchFn, `${BASE}/snapshot/${id}?format=json`, { headers }, { sleep });
        if (!s.ok) throw new Error(`Bright Data snapshot fetch failed: HTTP ${s.status}`);
        return parseBody(await s.text());
      }
      if (status === 'failed') throw new Error(`Bright Data snapshot ${id} failed`);
    }
    throw new Error(`Bright Data snapshot ${id} not ready after ${maxPolls} polls`);
  }
  throw new Error(`Bright Data request failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
}

// enrich(linkedinUrls, options) -> Map<normalizedUrl, record>
// Results are matched to inputs by URL, never by position (Bright Data returns them in any order).
export async function enrich(linkedinUrls, {
  apiKey = process.env.BRIGHTDATA_API_KEY,
  dryRun = false,
  fetchFn = globalThis.fetch,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  pollMs = 10000,
  maxPolls = 60,
  onBatch = () => {},
} = {}) {
  const urls = [...new Set(linkedinUrls.map(normalizeLinkedInUrl).filter(Boolean))];
  if (dryRun) return { dryRun: true, ...estimateCost(urls.length), results: new Map() };
  if (!apiKey) throw new Error('BRIGHTDATA_API_KEY is not set');

  const results = new Map();
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const rows = await scrapeBatch(batch, { apiKey, fetchFn, sleep, pollMs, maxPolls });
    for (const raw of rows) {
      const rec = normalizeProfile(raw);
      if (rec.linkedin_url && batch.includes(rec.linkedin_url)) results.set(rec.linkedin_url, rec);
    }
    for (const url of batch) {
      if (!results.has(url)) {
        results.set(url, { linkedin_url: url, status: 'missing', name: null, company: null,
          title: null, title_fresh: null, location: null, error: 'not in response' });
      }
    }
    onBatch({ done: Math.min(i + BATCH_SIZE, urls.length), total: urls.length });
  }
  return { dryRun: false, ...estimateCost(urls.length), results };
}
