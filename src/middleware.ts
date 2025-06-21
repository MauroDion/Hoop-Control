
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function checks if a user is authenticated by verifying their session cookie with a server-side API route.
async function verifyAuth(request: NextRequest): Promise<{
    isAuthenticated: boolean, 
    reason?: string,
    response?: NextResponse
}> {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
        return { isAuthenticated: false };
    }

    try {
        const response = await fetch(new URL('/api/auth/verify-session', request.url), {
            method: 'POST',
            headers: {
                'Cookie': `session=${sessionCookie}`
            }
        });
        
        const data = await response.json();

        if (response.ok && data.isAuthenticated) {
            return { isAuthenticated: true };
        }
        
        // If not authenticated, we'll clear the cookie and pass along the reason.
        const clearCookieResponse = NextResponse.next();
        clearCookieResponse.cookies.set({ name: 'session', value: '', maxAge: 0, path: '/' });

        return { isAuthenticated: false, reason: data.reason || 'unknown', response: clearCookieResponse };

    } catch (error) {
        console.warn('Middleware auth verification fetch failed:', error);
        return { isAuthenticated: false, reason: 'verify_fetch_failed' };
    }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`\nMiddleware: Verifying auth for path: ${pathname}`);
  
  const publicPaths = ['/', '/login', '/register', '/reset-password'];
  const isPublicPath = publicPaths.includes(pathname);

  const { isAuthenticated, reason, response: authResponse } = await verifyAuth(request);
  console.log(`Middleware: Auth status is isAuthenticated: ${isAuthenticated}, Reason: ${reason}`);

  if (isAuthenticated) {
    if (isPublicPath) {
      console.log(`Middleware: Authenticated user on public path '${pathname}'. Redirecting to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } else {
    // User is not authenticated
    const loginUrl = new URL('/login', request.url);
    if (!isPublicPath) {
        // Trying to access a protected page, so redirect to login
        loginUrl.searchParams.set('redirect', pathname);
        if (reason && (reason === 'pending_approval' || reason === 'rejected')) {
            loginUrl.searchParams.set('status', reason);
        }
        console.log(`Middleware: Unauthenticated user on protected path '${pathname}'. Redirecting to ${loginUrl.toString()}`);
        
        const redirectResponse = NextResponse.redirect(loginUrl);
        // If we also need to clear a cookie, copy it from authResponse
        if (authResponse && authResponse.cookies.has('session')) {
            const sessionCookie = authResponse.cookies.get('session');
            if (sessionCookie) {
                 redirectResponse.cookies.set(sessionCookie);
            }
        }
        return redirectResponse;
    }
  }
  
  // For all other cases (authenticated on protected page, unauthenticated on public page),
  // just return the authResponse if it exists (to clear cookie) or continue.
  return authResponse || NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes, which are handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
