import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ONLY_PATHS = ['/login', '/register', '/reset-password'];
const PROTECTED_PATHS_PREFIX = ['/dashboard', '/games', '/analysis', '/tasks', '/profile', '/admin', '/clubs', '/seasons'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const isAuthed = !!sessionCookie;

  // Allow static assets and API routes to pass through
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  const isPublicOnlyPath = PUBLIC_ONLY_PATHS.some(p => pathname.startsWith(p));
  const isProtectedRoute = PROTECTED_PATHS_PREFIX.some(p => pathname.startsWith(p));
  const isRootPath = pathname === '/';

  if (isAuthed) {
    if (isPublicOnlyPath || isRootPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else {
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
