import { parse } from 'url';
import { NextResponse } from 'next/server';
import { getRoles } from './auth';
import { decideAccess, isPrivatePath, ERROR_PAGE } from './utils/roles';

// NOTE: the userEmail cookie is set by the browser (components/Navbar.tsx) and can be forged, so this
// is a navigation guard, not real security. Data access is enforced by Supabase RLS.
export default async function middleware(req) {
  const path = parse(req.url || '', true).pathname || '';

  if (path.startsWith('/_next') || !isPrivatePath(path)) {
    return NextResponse.next();
  }

  const userEmail = req.cookies.get('userEmail');
  const hasEmail = Boolean(userEmail?.value);
  const roles = hasEmail ? await getRoles(userEmail) : undefined; // one lookup per request

  if (decideAccess(path, roles, hasEmail) === 'redirect') {
    return NextResponse.redirect(new URL(ERROR_PAGE, req.nextUrl).toString());
  }
  return NextResponse.next();
}
