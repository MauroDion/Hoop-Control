import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = [
    '/dashboard', 
    '/games', 
    '/analysis', 
    '/tasks', 
    '/profile', 
    '/admin', 
    '/clubs', 
    '/seasons'
];
const ONBOARDING_PATHS = ['/profile/complete-registration', '/profile/my-children'];
const PUBLIC_ONLY_PATHS = ['/login', '/register', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const isAuthed = !!sessionCookie;

  // Allow static files and API routes to pass through
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const isProtectedRoute = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isPublicOnlyPath = PUBLIC_ONLY_PATHS.includes(pathname);
  const isOnboardingPath = ONBOARDING_PATHS.some(p => pathname.startsWith(p));

  if (!isAuthed && (isProtectedRoute || isOnboardingPath)) {
    // If user is not authenticated and tries to access a protected or onboarding route, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  if (isAuthed && isPublicOnlyPath) {
    // If user is authenticated and tries to access a public-only page (like /login),
    // redirect them to the dashboard. This prevents authenticated users from seeing the login page.
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // For all other cases, allow the request to proceed.
  // This includes authenticated users accessing protected routes or any user accessing public routes.
  return NextResponse.next();
}

export const config = {
  // Match all paths except for static files, API routes, and image optimization files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
