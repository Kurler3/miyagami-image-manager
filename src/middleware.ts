// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleCheckAuthorizationByRoute } from './utils/functions';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Logic for handling the /dashboard route
  if (pathname === '/dashboard' || pathname === '/') {
    // Redirect to /dashboard/public
    return NextResponse.redirect(new URL('/dashboard/public', request.url));
  }

  // Check if needs to be redirect due to authorization.
  const authorizationCheckRes = await handleCheckAuthorizationByRoute(pathname);

  if(authorizationCheckRes.needsRedirect) {
    return NextResponse.redirect(new URL(authorizationCheckRes.newUrl!, request.url));
  }

  // Return NextResponse.next() for other requests
  return NextResponse.next();
}

// Matcher configuration to match all routes (global middleware)
export const config = {
  matcher: '/:path*',
};

