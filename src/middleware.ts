import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ONLY_PATHS = ['/login', '/register', '/reset-password'];
const ONBOARDING_PATHS = ['/profile/complete-registration', '/profile/my-children'];
const PROTECTED_PATH_PREFIXES = ['/dashboard', '/games', '/analysis', '/tasks', '/profile', '/admin', '/clubs', '/seasons'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const isAuthed = !!sessionCookie;

  // Allow static assets, images, and API routes to pass through without checks
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  const isPublicOnlyPath = PUBLIC_ONLY_PATHS.includes(pathname);
  const isOnboardingPath = ONBOARDING_PATHS.some(p => pathname.startsWith(p));
  const isProtectedRoute = PROTECTED_PATH_PREFIXES.some(p => pathname.startsWith(p)) && !isOnboardingPath;
  const isRootPath = pathname === '/';

  if (isAuthed) {
    // If the user is authenticated, redirect them from public-only pages
    // and the root page to the dashboard.
    // Onboarding paths are allowed for authenticated users who need them.
    if (isPublicOnlyPath || isRootPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else { // Not authenticated
    // If the user is not authenticated, redirect them from protected routes
    // to the login page.
    if (isProtectedRoute) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }
  }
  
  // Allow the request to proceed if none of the above conditions are met.
  return NextResponse.next();
}

export const config = {
  // This matcher ensures the middleware runs on all paths except for the ones specified.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
