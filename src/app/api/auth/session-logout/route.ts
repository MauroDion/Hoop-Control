import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin'; // Use admin SDK

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie) {
      // Verify the session cookie. This is important to prevent CSRF attacks.
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */)
        .catch(error => {
          console.warn("API (session-logout): Error verifying session cookie during logout (possibly expired/revoked):", error.message);
          return null; // Treat as if cookie wasn't valid or present
        });

      if (decodedClaims) {
        await adminAuth.revokeRefreshTokens(decodedClaims.sub); // Revoke refresh tokens for the user
        console.log(`API (session-logout): Revoked refresh tokens for UID: ${decodedClaims.sub}`);
      }
    }
    
    // Clear the session cookie by setting its Max-Age to 0
    const response = NextResponse.json({ status: 'success', message: 'Session cookie cleared.' }, { status: 200 });
    response.cookies.set({
      name: 'session',
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    console.log("API (session-logout): Session cookie successfully cleared.");
    return response;

  } catch (error: any) {
    console.error('API (session-logout): Error clearing session cookie:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to clear session.', details: error.message }, { status: 500 });
  }
}
