// Pure access rules for middleware.js (no imports, so node:test can load it).
// Role shape: { isBrother, isPledge, adminRole }.

export const ERROR_PAGE = '/404';

export const MEMBER_ROUTES = ['/members/memberdirectory', '/members/studybuddysearch', '/members/*'];
export const BROTHER_ROUTES = ['/brothers', '/brothers/*', '/brothers/rushees/*'];
export const PLEDGE_ROUTES = ['/pledges/pledgecalendar', '/pledges/progress', '/pledges/pledgeresources', '/pledges/*'];
export const ADMIN_ROUTES = ['/brothers/admin', '/brothers/admin/*'];

const startsWithAny = (path, routes) => routes.some((route) => path.startsWith(route));

export function isPrivatePath(path) {
  return startsWithAny(path, [...MEMBER_ROUTES, ...BROTHER_ROUTES, ...PLEDGE_ROUTES, '/members/']);
}

// rpc('role_for_email') returns a one-row table: [{ is_brother, is_pledge, admin_role }].
export function rolesFromRpc(data) {
  const row = Array.isArray(data) ? data[0] : data;
  return { isBrother: row?.is_brother === true, isPledge: row?.is_pledge === true, adminRole: row?.admin_role || '' };
}

export const NO_ROLES = { isBrother: false, isPledge: false, adminRole: '' };

// -> 'next' | 'redirect'. hasEmail=false (no cookie, or an empty one) never gets into a private route.
export function decideAccess(path, roles, hasEmail = true) {
  if (path === ERROR_PAGE || !isPrivatePath(path)) return 'next';
  if (!hasEmail) return 'redirect';

  const { isBrother, isPledge, adminRole } = roles ?? NO_ROLES;
  const isAdmin = Boolean(adminRole);
  const isParentAdmin = adminRole === 'parent';

  if ((isBrother || isPledge) && startsWithAny(path, MEMBER_ROUTES)) return 'next';
  if (!isBrother && startsWithAny(path, BROTHER_ROUTES)) return 'redirect';
  if (!isAdmin && startsWithAny(path, ADMIN_ROUTES)) return 'redirect';
  if (!isPledge && startsWithAny(path, PLEDGE_ROUTES)) {
    return isParentAdmin && path === '/pledges/progress' ? 'next' : 'redirect';
  }
  if (!isBrother && !isPledge) return 'redirect';
  return 'next';
}
