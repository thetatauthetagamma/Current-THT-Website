import test from 'node:test';
import assert from 'node:assert/strict';
import { decideAccess, rolesFromRpc, isPrivatePath } from '../../../utils/roles.js';

const brother = { isBrother: true, isPledge: false, adminRole: '' };
const admin = { ...brother, adminRole: 'president' };
const parent = { isBrother: false, isPledge: false, adminRole: 'parent' };
const pledge = { isBrother: false, isPledge: true, adminRole: '' };
const nobody = { isBrother: false, isPledge: false, adminRole: '' };

test('no cookie: private routes redirect, public routes and assets pass', () => {
  assert.equal(decideAccess('/brothers/alumni', undefined, false), 'redirect');
  assert.equal(decideAccess('/members/memberdirectory', undefined, false), 'redirect');
  assert.equal(decideAccess('/pledges/progress', undefined, false), 'redirect');
  for (const p of ['/', '/rush', '/apply', '/attendance/abc', '/fratphoto.jpg', '/404', '/members', '/committees']) {
    assert.equal(decideAccess(p, undefined, false), 'next', p);
  }
});

test('brothers reach brother and member routes, not admin or pledge routes', () => {
  assert.equal(decideAccess('/brothers/alumni', brother), 'next');
  assert.equal(decideAccess('/members/familytree', brother), 'next');
  assert.equal(decideAccess('/brothers/admin', brother), 'redirect');
  assert.equal(decideAccess('/pledges/pledgecalendar', brother), 'redirect');
  assert.equal(decideAccess('/brothers/admin', admin), 'next');
});

test('pledges reach member routes only; parent admin may view /pledges/progress', () => {
  assert.equal(decideAccess('/members/memberdirectory', pledge), 'next');
  assert.equal(decideAccess('/pledges/progress', pledge), 'next');
  assert.equal(decideAccess('/brothers/alumni', pledge), 'redirect');
  assert.equal(decideAccess('/pledges/progress', parent), 'next');
  assert.equal(decideAccess('/pledges/pledgecalendar', parent), 'redirect');
});

test('signed-in non-members are redirected from every private route', () => {
  for (const p of ['/brothers/alumni', '/members/memberdirectory', '/pledges/progress', '/members/x']) {
    assert.equal(decideAccess(p, nobody), 'redirect', p);
  }
});

test('rolesFromRpc handles array, object, null and errors-as-empty', () => {
  assert.deepEqual(rolesFromRpc([{ is_brother: true, is_pledge: false, admin_role: 'parent' }]),
    { isBrother: true, isPledge: false, adminRole: 'parent' });
  assert.deepEqual(rolesFromRpc(null), nobody);
  assert.deepEqual(rolesFromRpc([]), nobody);
  assert.equal(isPrivatePath('/brothers/admin'), true);
});

import { uniqnameFromEmail } from '../../../utils/roles.js';
import { navItemsFor, resolveHref, PNM_HOME, PNM_NAV, BROTHER_NAV } from '../../../utils/navItems.js';

test('uniqnameFromEmail works for any domain, not just @umich.edu', () => {
  assert.equal(uniqnameFromEmail('Jadono@umich.edu'), 'jadono');
  assert.equal(uniqnameFromEmail('someone@gmail.com'), 'someone');
  assert.equal(uniqnameFromEmail(undefined), '');
});

test('nav: PNMs never get a /brothers link, and PNM_HOME matches the sidebar', () => {
  for (const item of navItemsFor({ isPledge: true, isAdmin: false })) {
    assert.ok(!resolveHref(item, 'x').startsWith('/brothers'), item.label);
  }
  assert.equal(PNM_HOME, PNM_NAV[0].href);
});

test('nav: every sidebar link points at a route the middleware lets that role into', () => {
  for (const item of PNM_NAV) {
    assert.equal(decideAccess(resolveHref(item, 'x'), { isPledge: true }), 'next', item.label);
  }
  for (const item of BROTHER_NAV) {
    assert.equal(decideAccess(resolveHref(item, 'x'), { isBrother: true }), 'next', item.label);
  }
});

import { interviewsBase, canEditInterviews } from '../../../utils/interviewRoutes.js';

test('interviews links stay in the visitor section; brothers and PNMs can add', () => {
  assert.equal(interviewsBase('/members/interviews'), '/members/interviews');
  assert.equal(interviewsBase('/members/interviews/[id]'), '/members/interviews');
  assert.equal(interviewsBase('/brothers/interviews/add'), '/brothers/interviews');
  assert.equal(canEditInterviews('/members/interviews'), true);
  assert.equal(canEditInterviews('/somewhere/else'), false);
  assert.equal(canEditInterviews('/brothers/interviews'), true);
  // every link built from a PNM base is a route the middleware allows a PNM into
  for (const path of ['/members/interviews', '/members/interviews/12', '/members/interviews/success']) {
    assert.equal(decideAccess(path, { isPledge: true }), 'next', path);
  }
});

import { daysUntilDue } from '../../../utils/daysUntilDue.js';

test('daysUntilDue counts Detroit calendar days to the PNM deadline', () => {
  const due = '2026-12-06 14:00:00';
  assert.equal(daysUntilDue(due, new Date('2026-11-04T17:00:00Z')), 32); // matches what the live page showed
  assert.equal(daysUntilDue(due, new Date('2026-12-06T04:59:00Z')), 1);  // still Dec 5 in Detroit (UTC-5)
  assert.equal(daysUntilDue(due, new Date('2026-12-06T05:01:00Z')), 0);  // Dec 6 in Detroit
  assert.equal(daysUntilDue(due, new Date('2026-12-20T12:00:00Z')), 0);  // passed: never negative
  assert.equal(daysUntilDue('', new Date()), null);
  assert.equal(daysUntilDue(null, new Date()), null);
});
