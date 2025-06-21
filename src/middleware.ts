
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper function to check if the user is authenticated by calling an internal API endpoint
async function isAuthenticatedViaApi(request: NextRequest): Promise<{ authenticated: boolean; uid?: string }> {
  const sessionCookie = request.cookies.get('session')?.value;
  const pathname = request.nextUrl.pathname;

  console.log(`Middleware (isAuthenticatedViaApi): Verifying for path '${pathname}'. Looking for 'session' cookie.`);

  if (!sessionCookie) {
    console.log(`Middleware (isAuthenticatedViaApi): 'session' cookie NOT found. User NOT authenticated.`);
    return { authenticated: false };
  }

  try {
    // IMPORTANT: Construct the absolute URL for the fetch request
    const verifyUrl = new URL('/api/auth/verify-session', request.url);
    
    console.log(`Middleware (isAuthenticatedViaApi): Calling internal API endpoint: ${verifyUrl.toString()}`);
    
    const response = await fetch(verifyUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass along the cookie to the API route
        'Cookie': `session=${sessionCookie}`
      },
      // No body needed as cookie is in header
    });

    // Read the response body once, regardless of status
    const data = await response.json().catch(() => ({ isAuthenticated: false, error: "Failed to parse JSON response from verification API." }));

    if (response.ok && data.isAuthenticated) {
      console.log(`Middleware (isAuthenticatedViaApi): API verification SUCCESSFUL for UID: ${data.uid}. User AUTHENTICATED.`);
      return { authenticated: true, uid: data.uid };
    } else {
      // If response not ok or data.isAuthenticated is false
      console.warn(`Middleware (isAuthenticatedViaApi): API verification FAILED or user not authenticated. Status: ${response.status}, Body: ${JSON.stringify(data)}`);
      return { authenticated: false };
    }

  } catch (error: any) {
    console.error(`Middleware (isAuthenticatedViaApi): Error calling verification API: ${error.message}`, error.stack);
    return { authenticated: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fullRequestedPath = `${pathname}${search || ''}`; // Ensure search is not undefined

  console.log(`\nMiddleware: Processing request for: ${fullRequestedPath}`);

  const publicPaths = ['/login', '/register', '/reset-password', '/'];
  const authApiPaths = ['/api/auth/session-login', '/api/auth/session-logout', '/api/auth/verify-session'];

  if (publicPaths.includes(pathname) || authApiPaths.includes(pathname) || pathname.startsWith('/api/public')) {
    console.log(`Middleware: Path '${pathname}' is public or an auth/public API. Allowing access.`);
    return NextResponse.next();
  }

  const { authenticated } = await isAuthenticatedViaApi(request);

  if (authenticated) {
    if ((pathname === '/login' || pathname === '/register') && pathname !== '/') {
      console.log(`Middleware: User AUTHENTICATED (API verified) trying to access '${pathname}'. Redirecting to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    console.log(`Middleware: User AUTHENTICATED (API verified). Allowing access to protected path: '${pathname}'.`);
    return NextResponse.next();
  } else {
    // User is not authenticated, redirect to login
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') { // Avoid redirect loop if '/' is somehow considered protected and unauth
        loginUrl.searchParams.set('redirect', fullRequestedPath);
    }
    
    const response = NextResponse.redirect(loginUrl);
    // Clear potentially invalid session cookie if it exists and verification failed
    if (request.cookies.get('session')?.value) {
        console.log(`Middleware: User NOT AUTHENTICATED (API verification failed or cookie absent). Redirecting to: ${loginUrl.toString()} and attempting to clear 'session' cookie.`);
        response.cookies.set({
            name: 'session',
            value: '',
            maxAge: 0,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });
    } else {
        console.log(`Middleware: User NOT AUTHENTICATED (session cookie absent). Redirecting to: ${loginUrl.toString()}`);
    }
    return response;
  }
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - api/public (public API routes)
    '/((?!_next/static|_next/image|favicon.ico|api/public/).*)',
  ],
};
