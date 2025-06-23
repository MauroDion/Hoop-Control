
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

const PUBLIC_PATHS = ['/', '/login', '/register', '/reset-password'];

const isPublic = (path: string) => PUBLIC_PATHS.includes(path);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  // Bypass for internal Next.js assets and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // If no cookie, handle public/protected route access
  if (!sessionCookie) {
    if (!isPublic(pathname)) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }
  
  // If cookie exists, verify it
  if (!adminAuth || !adminDb) {
    console.warn("Middleware: Firebase Admin SDK not initialized. Bypassing auth check.");
    return NextResponse.next();
  }

  const redirectToLogin = (reason?: string) => {
    const loginUrl = new URL('/login', request.url);
    if (reason) {
      loginUrl.searchParams.set('status', reason);
    }
    const response = NextResponse.redirect(loginUrl);
    // Clear the invalid cookie. Attributes must match how it was set for the browser to clear it.
    response.cookies.set({ name: 'session', value: '', maxAge: 0, path: '/', secure: true, sameSite: 'none' });
    return response;
  }
  
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    const { uid } = decodedClaims;

    const userProfileDoc = await adminDb.collection('user_profiles').doc(uid).get();
    if (!userProfileDoc.exists || userProfileDoc.data()?.status !== 'approved') {
      const reason = userProfileDoc.exists ? userProfileDoc.data()?.status : 'not_found';
      console.warn(`Middleware: User ${uid} not approved (status: ${reason}). Revoking tokens.`);
      await adminAuth.revokeRefreshTokens(uid).catch(e => console.error(`Failed to revoke tokens for ${uid}`, e));
      return redirectToLogin(reason);
    }

    // Authenticated and approved user
    if (isPublic(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();

  } catch (error: any) {
    // Cookie is invalid, expired, or revoked
    console.warn(`Middleware: Invalid session cookie. Path: ${pathname}. Clearing cookie.`);
    
    // For protected routes, redirect to login. For public, just clear cookie and continue.
    if (!isPublic(pathname)) {
        return redirectToLogin();
    }
    
    const response = NextResponse.next();
    response.cookies.set({ name: 'session', value: '', maxAge: 0, path: '/', secure: true, sameSite: 'none' });
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
