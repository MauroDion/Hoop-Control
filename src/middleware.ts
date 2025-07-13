
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/', '/reset-password'];
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


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;
  const isAuthed = !!sessionCookie;
  
  console.log(`Middleware: Path: ${pathname}, IsAuthed: ${isAuthed}`);

  // Allow static files and API routes to pass through
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some(p => pathname === p || (p !== '/' && pathname.startsWith(p)));
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  
  if (!isAuthed && isProtected) {
    console.log(`Middleware: Not authenticated and accessing protected path. Redirecting to login.`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthed && isPublic && pathname !== '/') {
    console.log(`Middleware: Authenticated user accessing public path. Redirecting to dashboard.`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  if (isAuthed && pathname === '/') {
    console.log(`Middleware: Authenticated user at root. Redirecting to dashboard.`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  console.log(`Middleware: No redirect condition met. Allowing request.`);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
