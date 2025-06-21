
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  console.log(`\nMiddleware: Processing request for: ${pathname}. Session cookie found: ${!!sessionCookie}`);

  const publicPaths = ['/', '/login', '/register', '/reset-password'];
  const isPublicPath = publicPaths.includes(pathname);

  // If user has a session cookie...
  if (sessionCookie) {
    // and is trying to access a public page like login/register, redirect them to the dashboard.
    // The root page is also public, so authenticated users hitting it will go to the dashboard.
    if (isPublicPath) {
      console.log(`Middleware: Authenticated user on public path '${pathname}'. Redirecting to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, they are accessing a protected page, so let them through.
    console.log(`Middleware: Authenticated user accessing protected path '${pathname}'. Allowing access.`);
    return NextResponse.next();
  }

  // If user does NOT have a session cookie...
  if (!sessionCookie) {
    // and is trying to access a protected page...
    if (!isPublicPath) {
      // redirect them to the login page, remembering where they wanted to go.
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      console.log(`Middleware: Unauthenticated user on protected path '${pathname}'. Redirecting to ${loginUrl.toString()}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If we get here, it means the user is unauthenticated and on a public path, so let them through.
  console.log(`Middleware: Unauthenticated user on public path '${pathname}'. Allowing access.`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * This prevents the middleware from running on these paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
