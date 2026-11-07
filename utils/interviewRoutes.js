// The interviews pages are shared: brothers use /brothers/interviews, PNMs use /members/interviews
// (which re-exports the same components). Links must stay inside the section the visitor is in,
// because middleware sends PNMs away from /brothers/*.
export function interviewsBase(pathname = '') {
  return String(pathname).startsWith('/members/') ? '/members/interviews' : '/brothers/interviews';
}

// Only brothers can add or edit interviews (the InterviewDetails insert/update policies are brother-only).
export function canEditInterviews(base) {
  return base === '/brothers/interviews';
}
