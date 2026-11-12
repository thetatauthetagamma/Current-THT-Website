import test from 'node:test';
import assert from 'node:assert/strict';
import { enrich, normalizeProfile, estimateCost } from '../enrich.mjs';

const res = (status, body) => ({ status, ok: status < 300, text: async () => typeof body === 'string' ? body : JSON.stringify(body) });
const noSleep = async () => {};

test('normalizeProfile maps fields and title freshness', () => {
  const fresh = normalizeProfile({ input_url: 'https://www.linkedin.com/in/a', name: 'A', current_company_name: 'Acme',
    position: 'Engineer', city: 'Ann Arbor, Michigan, United States', location: 'Ann Arbor', country_code: 'US', backfilled_columns: { position: false } });
  assert.equal(fresh.company, 'Acme'); assert.equal(fresh.title_fresh, true); assert.equal(fresh.location, 'Ann Arbor, Michigan, United States');
  const stale = normalizeProfile({ input_url: 'https://www.linkedin.com/in/a', name: 'A', current_company: { name: 'Acme' },
    position: 'Engineer', backfilled_columns: ['position', 'education'] });
  assert.equal(stale.company, 'Acme'); assert.equal(stale.title_fresh, false);
  const unknown = normalizeProfile({ input_url: 'https://www.linkedin.com/in/a', name: 'A', position: 'X' });
  assert.equal(unknown.title_fresh, null);
});

test('normalizeProfile flags error rows and reads input.url', () => {
  const r = normalizeProfile({ input: { url: 'https://www.linkedin.com/in/dead' }, error: 'dead_page', error_code: 'dead_page' });
  assert.equal(r.status, 'error'); assert.equal(r.linkedin_url, 'https://www.linkedin.com/in/dead');
});

test('dry run makes no request and reports cost', async () => {
  let calls = 0;
  const out = await enrich(['linkedin.com/in/a', 'https://www.linkedin.com/in/A/'], { dryRun: true, fetchFn: async () => { calls++; } });
  assert.equal(calls, 0); assert.equal(out.records, 1); assert.equal(out.withinFreeTier, true);
  assert.equal(estimateCost(1000).payAsYouGoUsd, 1.5);
});

test('results are matched by URL even when returned out of order', async () => {
  const fetchFn = async (url, init) => {
    assert.match(url, /include_errors=true/);
    assert.equal(init.headers.Authorization, 'Bearer k');
    return res(200, [
      { input_url: 'https://www.linkedin.com/in/b', name: 'Bee', current_company_name: 'B Co' },
      { input: { url: 'https://www.linkedin.com/in/dead' }, error: 'dead_page' },
      { input_url: 'https://www.linkedin.com/in/a', name: 'Ay', current_company_name: 'A Co' },
    ]);
  };
  const { results } = await enrich(['https://www.linkedin.com/in/a', 'https://www.linkedin.com/in/b', 'https://www.linkedin.com/in/dead', 'https://www.linkedin.com/in/gone'],
    { apiKey: 'k', fetchFn, sleep: noSleep });
  assert.equal(results.get('https://www.linkedin.com/in/a').name, 'Ay');
  assert.equal(results.get('https://www.linkedin.com/in/b').company, 'B Co');
  assert.equal(results.get('https://www.linkedin.com/in/dead').status, 'error');
  assert.equal(results.get('https://www.linkedin.com/in/gone').status, 'missing');
});

test('retries on 429 and polls async snapshots', async () => {
  const seq = [res(429, ''), res(202, { snapshot_id: 's1' }), res(200, { status: 'running' }), res(200, { status: 'ready' }),
    res(200, '{"input_url":"https://www.linkedin.com/in/a","name":"Ay","current_company_name":"A Co"}\n')];
  const urls = [];
  const fetchFn = async (u) => { urls.push(u); return seq.shift(); };
  const { results } = await enrich(['https://www.linkedin.com/in/a'], { apiKey: 'k', fetchFn, sleep: noSleep });
  assert.equal(results.get('https://www.linkedin.com/in/a').name, 'Ay');
  assert.match(urls[2], /progress\/s1/); assert.match(urls[4], /snapshot\/s1/);
});

test('missing API key fails loudly on a live run', async () => {
  await assert.rejects(enrich(['https://www.linkedin.com/in/a'], { apiKey: '' }), /BRIGHTDATA_API_KEY/);
});
