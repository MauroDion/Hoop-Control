
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/reset-password'];

const isPublic = (path: string) => PUBLIC_PATHS.includes(path);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  // Bypass for internal Next.js assets and API routes which have their own logic
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // If the user has a session cookie and is trying to access a public-only page,
  // redirect them to the dashboard. This improves UX for logged-in users.
  // The actual cookie verification happens within the protected pages/layouts.
  if (sessionCookie && isPublic(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user does not have a session cookie and is trying to access a protected page,
  // redirect them to the login page.
  if (!sessionCookie && !isPublic(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // In all other cases (e.g., user with cookie on protected page, or user without cookie on public page),
  // allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
