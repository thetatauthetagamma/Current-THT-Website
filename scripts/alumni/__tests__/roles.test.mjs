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
