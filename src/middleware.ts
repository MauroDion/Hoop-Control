import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/reset-password'];

const isPublic = (path: string) => {
    if (path === '/') return true;
    for (const publicPath of PUBLIC_PATHS) {
        if (path.startsWith(publicPath) && publicPath !== '/') return true;
    }
    return false;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  if (sessionCookie && isPublic(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!sessionCookie && !isPublic(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
