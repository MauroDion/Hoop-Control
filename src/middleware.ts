import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ONLY_PATHS = ['/login', '/register', '/reset-password'];
const ONBOARDING_PATHS = ['/profile/complete-registration', '/profile/my-children'];
const PROTECTED_PATH_PREFIXES = ['/dashboard', '/games', '/analysis', '/tasks', '/profile', '/admin', '/clubs', '/seasons'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const isAuthed = !!sessionCookie;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  const isPublicOnlyPath = PUBLIC_ONLY_PATHS.includes(pathname);
  const isOnboardingPath = ONBOARDING_PATHS.some(p => pathname.startsWith(p));
  const isProtectedRoute = PROTECTED_PATH_PREFIXES.some(p => pathname.startsWith(p)) && !isOnboardingPath;
  
  if (isAuthed) {
    // If authenticated, redirect away from public-only pages like login/register.
    // Allow access to onboarding paths.
    if (isPublicOnlyPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else { 
    // If not authenticated, protect the routes that require a logged-in user.
    if (isProtectedRoute) {
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
