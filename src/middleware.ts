// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleCheckAuthorizationByRoute } from './utils/functions';
import { updateSession } from './utils/supabase/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Logic for handling the /dashboard and home route
  if (pathname === '/') {
    // Redirect to /dashboard/public
    return NextResponse.redirect(new URL('/dashboard/public', request.url));
  }

  // This refreshed the user token if any.
  // Important to call this before checking the authorization on the routes.
  const newRequest = await updateSession(request);

  // Check if needs to be redirect due to authorization.
  const authorizationCheckRes = await handleCheckAuthorizationByRoute(pathname);

  if(authorizationCheckRes.needsRedirect) {
    return NextResponse.redirect(new URL(authorizationCheckRes.newUrl!, request.url));
  }

  return newRequest;
}

// Matcher configuration to match all routes (global middleware)
export const config = {
 matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

