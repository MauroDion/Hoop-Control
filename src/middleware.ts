
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
        // FIX: Added secure and sameSite attributes to match how the cookie was set.
        clearCookieResponse.cookies.set({ 
            name: 'session', 
            value: '', 
            maxAge: 0, 
            path: '/',
            secure: true,
            sameSite: 'none'
        });

        return { isAuthenticated: false, reason: data.reason || 'unknown', response: clearCookieResponse };

    } catch (error) {
        console.warn('Middleware auth verification fetch failed:', error);
        return { isAuthenticated: false, reason: 'verify_fetch_failed' };
    }
}

export function middleware(request: NextRequest) {
  // DIAGNOSTIC: Temporarily disabling auth logic to stabilize the server.
  console.log(`Middleware: Bypassing auth check for path: ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

export const config = {
  // The matcher is intentionally left empty to completely disable the middleware
  // for diagnosing the server restart loop.
  matcher: [],
};
