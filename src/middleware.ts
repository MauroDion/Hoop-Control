import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ONLY_PATHS = ['/login', '/register', '/reset-password'];
const ONBOARDING_PATHS = ['/profile/complete-registration', '/profile/my-children'];
const PROTECTED_PATHS_PREFIX = ['/dashboard', '/games', '/analysis', '/tasks', '/profile', '/admin', '/clubs', '/seasons'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const isAuthed = !!sessionCookie;

  // Allow static assets and API routes to pass through
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  const isPublicOnlyPath = PUBLIC_ONLY_PATHS.includes(pathname);
  const isOnboardingPath = ONBOARDING_PATHS.includes(pathname);
  const isProtectedRoute = PROTECTED_PATHS_PREFIX.some(p => pathname.startsWith(p)) && !isOnboardingPath;
  const isRootPath = pathname === '/';

  if (isAuthed) {
    if (isPublicOnlyPath || isRootPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else { // Not authenticated
    if (isProtectedRoute) {
        // If the request is for a Server Action from an unauthenticated user,
        // don't redirect, but return an authorization error.
        if (request.method === 'POST') {
             return new NextResponse(
                JSON.stringify({ success: false, message: 'Authentication required.' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // For standard page navigations (GET requests), redirect to the login page.
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
