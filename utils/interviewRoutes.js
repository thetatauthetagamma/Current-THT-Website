// The interviews pages are shared: brothers use /brothers/interviews, PNMs use /members/interviews
// (which re-exports the same components). Links must stay inside the section the visitor is in,
// because middleware sends PNMs away from /brothers/*.
export function interviewsBase(pathname = '') {
  return String(pathname).startsWith('/members/') ? '/members/interviews' : '/brothers/interviews';
}

// Brothers and PNMs can both add interviews (sql/015). PNMs can only add/edit rows with their own email.
export function canEditInterviews(base) {
  return base === '/brothers/interviews' || base === '/members/interviews';
}
