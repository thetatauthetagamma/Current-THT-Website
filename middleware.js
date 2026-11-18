import { parse } from 'url';
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { isBrother, isPledge, isAdmin, isParentAdmin } from './auth';

export default async function middleware(req) {
  const url = parse(req.url || '', true);
  const path = url.pathname || '';

  const errorPage = '/404';

  const memberRoutes = [
    '/members/memberdirectory',
    '/members/studybuddysearch',
    '/members/*',
  ];
  const memberBasePath = '/members/';

  const brotherRoutes = [
    '/brothers',
    '/brothers/*',
    '/brothers/rushees/*'
  ];

  const pledgeRoutes = [
    '/pledges/pledgecalendar',
    '/pledges/progress',
    '/pledges/pledgeresources',
    '/pledges/*',
  ];

  const adminRoutes = [
    '/brothers/admin',
    '/brothers/admin/*'
  ];

  if (path.startsWith('/_next')) {
    return NextResponse.next();
  }

  const isPrivateRoute = (memberRoutes.concat(brotherRoutes, pledgeRoutes, ['/members/'])).some(route =>
    path.startsWith(route)
  );

  // Short-circuit for public routes before making any DB calls
  if (!isPrivateRoute) {
    return NextResponse.next();
  }

  // Use verified Supabase session instead of a forgeable cookie
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL(errorPage, req.nextUrl).toString());
  }

  // Wrap as cookie-shaped object for backward compat with auth helpers
  const userEmail = { value: session.user.email };

  const [isUserBrother, isUserPledge, isUserAdmin, isUserParentAdmin] = await Promise.all([
    isBrother(userEmail),
    isPledge(userEmail),
    isAdmin(userEmail),
    isParentAdmin(userEmail),
  ]);

  // Allow access for both brothers and pledges to member routes
  if ((isUserBrother || isUserPledge) && memberRoutes.some(route => path.startsWith(route)) && path !== errorPage) {
    return res;
  }

  // Restrict non-brothers from brother routes
  if (!isUserBrother && brotherRoutes.some(route => path.startsWith(route)) && path !== errorPage) {
    return NextResponse.redirect(new URL(errorPage, req.nextUrl).toString());
  }

  // Restrict non-admins from admin routes
  if (!isUserAdmin && adminRoutes.some(route => path.startsWith(route)) && path !== errorPage) {
    return NextResponse.redirect(new URL(errorPage, req.nextUrl).toString());
  }

  // Restrict non-pledges from pledge routes
  // Allow parent admins to access /pledges/progress (for viewing PNM progress)
  if (!isUserPledge && pledgeRoutes.some(route => path.startsWith(route)) && path !== errorPage) {
    if (isUserParentAdmin && path === '/pledges/progress') {
      return res;
    }
    return NextResponse.redirect(new URL(errorPage, req.nextUrl).toString());
  }

  // Redirect non-members from all remaining private routes
  if (!isUserBrother && !isUserPledge && isPrivateRoute && path !== errorPage) {
    return NextResponse.redirect(new URL(errorPage, req.nextUrl).toString());
  }

  return res;
}
