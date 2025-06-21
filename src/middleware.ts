
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
    
    // Add a custom header to identify this as an internal fetch and prevent an infinite loop.
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Cookie', `session=${sessionCookie}`);
    headers.set('x-internal-fetch', 'true');

    const response = await fetch(verifyUrl.toString(), {
      method: 'POST',
      headers: headers,
      // IMPORTANT: Disable caching to prevent the middleware from using a stale "unauthenticated" response.
      cache: 'no-store',
    });

    console.log(`Middleware (isAuthenticatedViaApi): Received response from verification API with status: ${response.status}`);
    
    // Check if the response is not a valid JSON before parsing
    if (!response.headers.get('content-type')?.includes('application/json')) {
        console.error("Middleware (isAuthenticatedViaApi): Response from verification API was not JSON. Body:", await response.text());
        return { authenticated: false };
    }

    const data = await response.json().catch((err) => {
        console.error("Middleware (isAuthenticatedViaApi): Failed to parse JSON response from verification API.", err);
        return { isAuthenticated: false, error: "Failed to parse JSON response." };
    });
    console.log(`Middleware (isAuthenticatedViaApi): Parsed response body:`, JSON.stringify(data));


    if (response.ok && data.isAuthenticated) {
      console.log(`Middleware (isAuthenticatedViaApi): API verification SUCCESSFUL for UID: ${data.uid}. User AUTHENTICATED.`);
      return { authenticated: true, uid: data.uid };
    } else {
      console.warn(`Middleware (isAuthenticatedViaApi): API verification FAILED or user not authenticated. Status: ${response.status}, Body: ${JSON.stringify(data)}`);
      return { authenticated: false };
    }

  } catch (error: any) {
    console.error(`Middleware (isAuthenticatedViaApi): CRITICAL ERROR calling verification API: ${error.message}`, error.stack);
    return { authenticated: false };
  }
}

export async function middleware(request: NextRequest) {
  // If this is an internal fetch initiated by our `isAuthenticatedViaApi` helper,
  // let it pass through without running any middleware logic to avoid an infinite loop.
  if (request.headers.get('x-internal-fetch') === 'true') {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const fullRequestedPath = `${pathname}${search || ''}`;

  console.log(`\nMiddleware: Processing request for: ${fullRequestedPath}`);

  const publicPaths = ['/login', '/register', '/reset-password', '/'];
  
  // Public paths and static assets are allowed through
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/public')) {
    console.log(`Middleware: Path '${pathname}' is public. Allowing access.`);
    return NextResponse.next();
  }

  const { authenticated } = await isAuthenticatedViaApi(request);

  if (authenticated) {
    // If an authenticated user tries to access login/register, redirect to dashboard
    if (pathname === '/login' || pathname === '/register') {
      console.log(`Middleware: User AUTHENTICATED trying to access '${pathname}'. Redirecting to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    console.log(`Middleware: User AUTHENTICATED. Allowing access to protected path: '${pathname}'.`);
    return NextResponse.next();
  } else {
    // User is not authenticated, redirect to login
    const loginUrl = new URL('/login', request.url);
    if (!publicPaths.includes(pathname)) { // Avoid setting redirect for root page
        loginUrl.searchParams.set('redirect', fullRequestedPath);
    }
    
    const response = NextResponse.redirect(loginUrl);
    // Clear potentially invalid session cookie if it exists and verification failed
    if (request.cookies.get('session')?.value) {
        console.log(`Middleware: User NOT AUTHENTICATED. Redirecting to: ${loginUrl.toString()} and attempting to clear 'session' cookie.`);
        response.cookies.set({
            name: 'session',
            value: '',
            maxAge: 0,
            path: '/',
            httpOnly: true,
            secure: true, // Must be true for SameSite=None
            sameSite: 'none',
        });
    } else {
        console.log(`Middleware: User NOT AUTHENTICATED. Redirecting to: ${loginUrl.toString()}`);
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
    // No need to exclude /api/* here because we handle it with the x-internal-fetch header
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
