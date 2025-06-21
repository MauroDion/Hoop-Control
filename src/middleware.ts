
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function checks if a user is authenticated by verifying their session cookie with a server-side API route.
async function verifyAuth(request: NextRequest): Promise<{isAuthenticated: boolean, response?: NextResponse}> {
    const sessionCookie = request.cookies.get('session')?.value;

    // If no cookie, definitely not authenticated.
    if (!sessionCookie) {
        return { isAuthenticated: false };
    }

    try {
        // The URL must be absolute for fetch in middleware.
        const response = await fetch(new URL('/api/auth/verify-session', request.url), {
            method: 'POST',
            headers: {
                'Cookie': `session=${sessionCookie}` // Forward the cookie to the verification endpoint
            }
        });
        
        // If the verification endpoint says the session is valid, we're good.
        if (response.ok) {
            const data = await response.json();
            if (data.isAuthenticated) {
              return { isAuthenticated: true };
            }
        }

        // If verification fails (e.g., expired cookie), clear the invalid cookie and treat as unauthenticated.
        const clearCookieResponse = NextResponse.next();
        clearCookieResponse.cookies.set({ name: 'session', value: '', maxAge: 0 });

        return { isAuthenticated: false, response: clearCookieResponse };

    } catch (error) {
        console.error('Middleware auth verification fetch failed:', error);
        return { isAuthenticated: false };
    }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`\nMiddleware: Verifying auth for path: ${pathname}`);
  
  // Define public paths that do not require authentication.
  const publicPaths = ['/', '/login', '/register', '/reset-password'];
  const isPublicPath = publicPaths.includes(pathname);

  // Verify the user's session.
  const { isAuthenticated, response: clearCookieResponse } = await verifyAuth(request);
  console.log(`Middleware: Auth status is isAuthenticated: ${isAuthenticated}`);

  let response: NextResponse;

  // If user is authenticated
  if (isAuthenticated) {
    // If they are trying to access a public page (like login), redirect them to the dashboard.
    if (isPublicPath) {
      console.log(`Middleware: Authenticated user on public path '${pathname}'. Redirecting to /dashboard.`);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, allow them to proceed to the requested page.
    response = clearCookieResponse || NextResponse.next();
  } 
  // If user is NOT authenticated
  else {
    // If they are trying to access a protected page, redirect them to the login page.
    if (!isPublicPath) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      console.log(`Middleware: Unauthenticated user on protected path '${pathname}'. Redirecting to ${loginUrl.toString()}`);
      response = NextResponse.redirect(loginUrl);
    } else {
      // Allow access to public pages.
      response = clearCookieResponse || NextResponse.next();
    }
    // If we have a response that clears a cookie, we must use it.
     if (clearCookieResponse) {
       // If we also need to redirect, we need to clone headers.
       if(response.headers.get('Location')) {
         clearCookieResponse.headers.set('Location', response.headers.get('Location')!);
       }
       return clearCookieResponse;
     }
  }

  return response;
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
