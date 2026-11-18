import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, validateRows, normalizeLinkedInUrl } from '../csv.mjs';

test('parseCsv handles quotes, embedded commas/newlines, CRLF and BOM', () => {
  const t = parseCsv('﻿a,b\r\n"x, y","he said ""hi"""\r\n"l1\nl2",z\r\n');
  assert.deepEqual(t, [['a', 'b'], ['x, y', 'he said "hi"'], ['l1\nl2', 'z']]);
});

test('normalizeLinkedInUrl canonicalizes and rejects non-profile URLs', () => {
  assert.equal(normalizeLinkedInUrl('linkedin.com/in/Jane-Doe/?utm=1'), 'https://www.linkedin.com/in/jane-doe');
  assert.equal(normalizeLinkedInUrl('https://uk.linkedin.com/in/jane'), 'https://www.linkedin.com/in/jane');
  assert.equal(normalizeLinkedInUrl('https://linkedin.com/company/acme'), null);
  assert.equal(normalizeLinkedInUrl('https://evil.com/in/jane'), null);
  assert.equal(normalizeLinkedInUrl(''), null);
});

test('validateRows keeps good rows and reports why others are skipped', () => {
  const table = parseCsv([
    'Roll Number,Name,Email,LinkedIn URL,Major',
    '1,Ann,ann@umich.edu,linkedin.com/in/ann,CS',
    '2,Bob,,linkedin.com/in/bob,ME',
    '3,Cy,cy@umich.edu,,EE',
    '4,Di,di@umich.edu,linkedin.com/in/di,',
    '5,Ed,not-an-email,linkedin.com/in/ed,CE',
    '6,Flo,flo@umich.edu,https://example.com/flo,CE',
    '7,Ann2,ann2@umich.edu,https://www.linkedin.com/in/ANN/,CS',
  ].join('\n'));
  const r = validateRows(table);
  assert.equal(r.valid.length, 1);
  assert.equal(r.valid[0].linkedin_url, 'https://www.linkedin.com/in/ann');
  assert.deepEqual(r.skipped.map((s) => s.line), [3, 4, 5, 6, 7, 8]);
  assert.match(r.skipped[0].reason, /missing email/);
  assert.match(r.skipped[3].reason, /invalid email|invalid LinkedIn/);
  assert.match(r.skipped[5].reason, /duplicate LinkedIn URL/);
});

test('validateRows reports missing required columns', () => {
  assert.deepEqual(validateRows(parseCsv('name,email\nA,a@b.co')).missingColumns, ['linkedin_url', 'major']);
});
