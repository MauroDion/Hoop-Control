
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ isAuthenticated: false, error: 'Session cookie not found.' }, { status: 401 });
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /* checkRevoked */);
    return NextResponse.json({ isAuthenticated: true, uid: decodedClaims.uid, email: decodedClaims.email }, { status: 200 });
  } catch (error: any) {
    console.warn('API (verify-session): Session cookie verification failed:', error.code, error.message);
    // Clear the potentially invalid cookie by sending an instruction back to the middleware (or client)
    // For simplicity, just return unauthenticated. The middleware will handle redirection.
    return NextResponse.json({ isAuthenticated: false, error: 'Invalid session cookie.', details: error.message }, { status: 401 });
  }
}
