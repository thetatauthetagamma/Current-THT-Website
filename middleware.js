import { NextResponse } from 'next/server';
import { isBrother, isPledge, isAdmin, isParentAdmin } from './auth';

export default async function middleware(req) {
  const path = req.nextUrl.pathname || '';

  const errorPage = '/404';

  const memberRoutes = [
    '/members/memberdirectory',
    '/members/studybuddysearch',
    '/members/',
  ];

  const brotherRoutes = [
    '/brothers',
    '/brothers/rushees/',
  ];

  const pledgeRoutes = [
    '/pledges/pledgecalendar',
    '/pledges/progress',
    '/pledges/pledgeresources',
    '/pledges/',
  ];

  const adminRoutes = [
    '/brothers/admin',
  ];

  if (path.startsWith('/_next')) {
    return NextResponse.next();
  }

  const userEmail = req.cookies.get('userEmail');

  if (!userEmail) {
    return NextResponse.next();
  }

  const isUserBrother = await isBrother(userEmail);
  const isUserPledge = await isPledge(userEmail);
  const isUserAdmin = await isAdmin(userEmail);
  const isUserParentAdmin = await isParentAdmin(userEmail);

  const matchesRoute = (route) => {
    if (route.endsWith('/')) {
      return path.startsWith(route);
    }
    return path === route || path.startsWith(`${route}/`);
  };

  const isMemberRoute = memberRoutes.some(matchesRoute);
  const isBrotherRoute = brotherRoutes.some(matchesRoute);
  const isPledgeRoute = pledgeRoutes.some(matchesRoute);
  const isAdminRoute = adminRoutes.some(matchesRoute);

  // Allow access for both brothers and pledges to member routes
  if ((isUserBrother || isUserPledge) && isMemberRoute && path !== errorPage) {
    return NextResponse.next();
  }

  // Restrict access for non-brothers to brother routes
  if (!isUserBrother && isBrotherRoute && path !== errorPage) {
    const httpsRedirectUrl = new URL(errorPage, req.nextUrl).toString();
    return NextResponse.redirect(httpsRedirectUrl);
  }

  // Restrict access for non-admins to admin routes
  if (!isUserAdmin && isAdminRoute && path !== errorPage) {
      const httpsRedirectUrl = new URL(errorPage, req.nextUrl).toString();
      return NextResponse.redirect(httpsRedirectUrl);
  }
  
  // Restrict access for non-pledges to pledge routes
  // Allow parent admins to access /pledges/progress (for viewing PNM progress)
  if (!isUserPledge && isPledgeRoute && path !== errorPage) {
    // Allow parent admins to access /pledges/progress
    if (isUserParentAdmin && path === '/pledges/progress') {
      return NextResponse.next();
    }
    const httpsRedirectUrl = new URL(errorPage, req.nextUrl).toString();
    return NextResponse.redirect(httpsRedirectUrl);
  }

  // redirect non members
  const isPrivateRoute = isMemberRoute || isBrotherRoute || isPledgeRoute || path.startsWith('/members/');

  if (!isUserBrother && !isUserPledge && isPrivateRoute && path !== errorPage) {
    const httpsRedirectUrl = new URL(errorPage, req.nextUrl).toString();
    return NextResponse.redirect(httpsRedirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/members/:path*',
    '/brothers/:path*',
    '/pledges/:path*',
  ],
};
