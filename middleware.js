import { parse } from 'url';
import { NextResponse } from 'next/server';
import { isBrother, isPledge, isAdmin } from './auth';

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
  ]

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

  // Allow access for both brothers and pledges to member routes
  if ((isUserBrother || isUserPledge) && memberRoutes.some(route => path.startsWith(route)) && path !== errorPage) {
    return NextResponse.next();
  }

  // Restrict access for brothers to pledge routes
  if (!isUserBrother && brotherRoutes.some(route => path.startsWith(route)) && path !== errorPage) {
    const httpsRedirectUrl = new URL(errorPage, req.nextUrl).toString();
    return NextResponse.redirect(httpsRedirectUrl);
  }

  // Restrict access for brothers to pledge routes
  if (!isUserAdmin && adminRoutes.some(route => path.startsWith(route)) && path !== errorPage) {
      const httpsRedirectUrl = new URL(errorPage, req.nextUrl).toString();
      return NextResponse.redirect(httpsRedirectUrl);
  }
  
  // Restrict access for pledges to brother routes
  if (!isUserPledge && pledgeRoutes.some(route => path.startsWith(route)) && path !== errorPage) {
    const httpsRedirectUrl = new URL(errorPage, req.nextUrl).toString();
    return NextResponse.redirect(httpsRedirectUrl);
  }

  // redirect non members
  const isPrivateRoute = (memberRoutes.concat(brotherRoutes, pledgeRoutes, ["/members/"])).some(route => {
    return path.startsWith(route)}
  )

  if (!isUserBrother && !isUserPledge && isPrivateRoute && path !== errorPage) {
    const httpsRedirectUrl = new URL(errorPage, req.nextUrl).toString();
    return NextResponse.redirect(httpsRedirectUrl);
  }

  return NextResponse.next();
}
