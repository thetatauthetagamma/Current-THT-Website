// Single source of truth for the sidebar links (components/BroNavBar.jsx). Edit links here only.
// href may be a string or a function of the signed-in uniqname (for "My Profile").

export const PNM_NAV = [
  { label: 'Your Progress', href: '/pledges/progress' }, // keep in sync with PNM_HOME (a test checks it)
  { label: 'Your Profile', href: (uniqname) => `/members/${uniqname}` },
  { label: 'Member Directory', href: '/members/memberdirectory' },
  { label: 'Study Buddy 🔎', href: '/members/studybuddysearch' },
  { label: 'Family Tree', href: '/members/familytree' },
  { label: 'Interviews Database', href: '/members/interviews' },
];

export const BROTHER_NAV = [
  { label: 'My Profile', href: (uniqname) => `/members/${uniqname}` },
  { label: 'PNM Tracking', href: '/brothers/pledgetracking' },
  { label: 'Resources', href: '/brothers/broresources' },
  { label: 'Professional Development', href: '/brothers/professional-development' },
  { label: 'Member Directory', href: '/members/memberdirectory' },
  { label: 'Alumni', href: '/brothers/alumni', badge: 'NEW' },
  { label: 'Study Buddy 🔎', href: '/members/studybuddysearch' },
  { label: 'Family Tree', href: '/members/familytree' },
  { label: 'Interviews Database', href: '/brothers/interviews' },
  { label: 'RushBook', href: '/brothers/rushbook' },
];

export const ADMIN_NAV_ITEM = { label: 'Admin', href: '/brothers/admin' };

// Top navbar target for a signed-in PNM (the sidebar's first item, so both places agree).
export const PNM_HOME = '/pledges/progress';

export function resolveHref(item, uniqname) {
  return typeof item.href === 'function' ? item.href(uniqname) : item.href;
}

export function navItemsFor({ isPledge, isAdmin }) {
  const items = isPledge ? [...PNM_NAV] : [...BROTHER_NAV];
  if (isAdmin) items.push(ADMIN_NAV_ITEM);
  return items;
}
