import test from 'node:test';
import assert from 'node:assert/strict';
import { planChanges, runSync, buildTargets, createRestClient, shouldFail } from '../sync.mjs';

const NOW = '2026-10-29T00:00:00.000Z';
const ok = (url, o = {}) => ({ linkedin_url: url, status: 'ok', name: 'X', company: null, title: null, title_fresh: null, location: null, error: null, ...o });
const A = 'https://www.linkedin.com/in/a', B = 'https://www.linkedin.com/in/b';

function fakeDb({ brothers, alumni = [] }) {
  const state = { alumni: new Map(alumni.map((r) => [r.userid, { ...r }])), log: [], upserts: 0 };
  return { state,
    getBrothers: async () => brothers,
    getAlumni: async (ids) => ids.filter((i) => state.alumni.has(i)).map((i) => state.alumni.get(i)),
    upsertAlumni: async (rows) => { state.upserts++; rows.forEach((r) => state.alumni.set(r.userid, { ...r })); },
    insertChangelog: async (rows) => { state.log.push(...rows); } };
}
const fakeEnrich = (map) => async (urls) => { fakeEnrich.calls = (fakeEnrich.calls ?? 0) + 1; return { results: new Map(urls.map((u) => [u, map[u]])) }; };
const row = (o) => ({ userid: 'u', company: null, title: null, location: null, company_source: null, title_source: null,
  location_source: null, title_fresh: null, extra: {}, enriched_at: null, last_updated: '2020-01-01T00:00:00.000Z', ...o });

test('self-edited fields are never overwritten', () => {
  const p = planChanges(row({ company: 'Mine', company_source: 'self-edited' }), ok(A, { company: 'Theirs' }), NOW);
  assert.equal(p.row.company, 'Mine'); assert.equal(p.changes.length, 0);
  assert.deepEqual(p.selfEditedSkipped, ['company']);
});

test('blank values never overwrite existing ones', () => {
  const p = planChanges(row({ company: 'Acme', company_source: 'enrichment' }), ok(A, { company: '  ', location: null }), NOW);
  assert.equal(p.row.company, 'Acme'); assert.equal(p.changes.length, 0);
});

test('unchanged (case/whitespace) is skipped, but enriched_at is set and last_updated kept', () => {
  const p = planChanges(row({ company: 'Acme', company_source: 'enrichment' }), ok(A, { company: ' ACME ' }), NOW);
  assert.equal(p.changes.length, 0); assert.equal(p.row.enriched_at, NOW);
  assert.equal(p.row.last_updated, '2020-01-01T00:00:00.000Z');
});

test('real change sets source, last_updated and title_fresh', () => {
  const p = planChanges(row({ company: 'Old' }), ok(A, { company: 'New', title: 'Eng', title_fresh: false }), NOW);
  assert.equal(p.row.company_source, 'enrichment'); assert.equal(p.row.last_updated, NOW);
  assert.equal(p.row.title_fresh, false); assert.equal(p.changes.length, 2);
});

test('failed lookups are not written and are reported', async () => {
  const db = fakeDb({ brothers: [{ userid: 'a', linkedin: A }, { userid: 'b', linkedin: B }] });
  const r = await runSync({ db, live: true, now: NOW, enrichFn: fakeEnrich({
    [A]: { linkedin_url: A, status: 'error', error: 'dead_page' }, [B]: ok(B, { company: 'Acme' }) }) });
  assert.equal(r.failed.length, 1); assert.equal(r.failed[0].userid, 'a');
  assert.equal(db.state.alumni.has('a'), false); assert.equal(db.state.alumni.get('b').company, 'Acme');
});

test('dry run calls neither provider nor database writes', async () => {
  fakeEnrich.calls = 0;
  const db = fakeDb({ brothers: [{ userid: 'a', linkedin: A }, { userid: 'z', linkedin: 'not a url' }] });
  const r = await runSync({ db, live: false, enrichFn: fakeEnrich({}) });
  assert.equal(fakeEnrich.calls, 0); assert.equal(db.state.upserts, 0); assert.equal(db.state.log.length, 0);
  assert.equal(r.urls, 1); assert.equal(r.invalid.length, 1);
});

test('changelog written, job change reported, second run changes nothing', async () => {
  const db = fakeDb({ brothers: [{ userid: 'a', linkedin: A }], alumni: [row({ userid: 'a', company: 'Old', company_source: 'enrichment' })] });
  const enrichFn = fakeEnrich({ [A]: ok(A, { company: 'New', location: 'Ann Arbor' }) });
  const r1 = await runSync({ db, live: true, now: NOW, enrichFn });
  assert.deepEqual(r1.jobChanges, [{ userid: 'a', old: 'Old', new: 'New' }]);
  assert.equal(db.state.log.length, 2); assert.ok(db.state.log.every((l) => l.source === 'enrichment'));
  const r2 = await runSync({ db, live: true, now: '2027-01-01T00:00:00.000Z', enrichFn });
  assert.equal(r2.updated, 0); assert.equal(db.state.log.length, 2);
  assert.equal(db.state.alumni.get('a').last_updated, NOW);
});

test('--limit caps lookups; shared URL maps to every userid', async () => {
  const t = buildTargets([{ userid: 'a', linkedin: 'linkedin.com/in/A/' }, { userid: 'b', linkedin: A }]);
  assert.deepEqual(t.urlToUsers.get(A), ['a', 'b']);
  const db = fakeDb({ brothers: [{ userid: 'a', linkedin: A }, { userid: 'b', linkedin: B }] });
  assert.equal((await runSync({ db, limit: 1 })).urls, 1);
});

test('rest client fails loudly without key and never puts key in URL', async () => {
  assert.throws(() => createRestClient({ url: 'https://x.supabase.co', key: '' }), /SUPABASE_SERVICE_ROLE_KEY/);
  const seen = [];
  const db = createRestClient({ url: 'https://x.supabase.co', key: 'SECRET', fetchFn: async (u) => { seen.push(u); return { ok: true, text: async () => '[]' }; } });
  await db.getBrothers({ userids: ['a'] });
  assert.ok(seen.every((u) => !u.includes('SECRET'))); assert.match(seen[0], /\/rest\/v1\/Brothers\?/);
});

test('shouldFail only on live runs where too many lookups fail', () => {
  const r = (urls, failed, live = true) => ({ live, urls, failed: new Array(failed).fill({}) });
  assert.equal(shouldFail(r(255, 19)), false);
  assert.equal(shouldFail(r(10, 5)), true);
  assert.equal(shouldFail(r(10, 10, false)), false);
  assert.equal(shouldFail(r(0, 0)), false);
});
