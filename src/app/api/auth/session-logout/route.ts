
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin'; // Use admin SDK

export async function POST(request: NextRequest) {
  // Add a defensive check right at the beginning
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error. Check server startup logs for details.'}`;
    console.error(`API (session-logout): CRITICAL ERROR - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    // Still attempt to clear the client-side cookie even if server auth is down
  }

  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie && adminAuth) { // Only attempt verification if adminAuth is available
      console.log("API (session-logout): Found session cookie, attempting to revoke tokens.");
      // Verify the session cookie. This is important to prevent CSRF attacks.
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */)
        .catch(error => {
          console.warn("API (session-logout): Error verifying session cookie during logout (possibly expired/revoked):", error.message);
          return null; // Treat as if cookie wasn't valid or present
        });

      if (decodedClaims) {
        await adminAuth.revokeRefreshTokens(decodedClaims.sub); // Revoke refresh tokens for the user
        console.log(`API (session-logout): Successfully revoked refresh tokens for UID: ${decodedClaims.sub}`);
      } else {
        console.log("API (session-logout): Could not decode session cookie, skipping token revocation.");
      }
    } else if (sessionCookie && !adminAuth) {
        console.warn("API (session-logout): Firebase Admin not initialized. Cannot revoke tokens. Proceeding to clear cookie.");
    } else {
        console.log("API (session-logout): No session cookie found to revoke.");
    }
    
    // Always clear the session cookie by setting its Max-Age to 0
    const response = NextResponse.json({ status: 'success', message: 'Session cookie cleared.' }, { status: 200 });
    response.cookies.set({
      name: 'session',
      value: '',
      maxAge: 0,
      httpOnly: true,
      secure: true, // Must be true for SameSite=None
      path: '/',
      sameSite: 'none',
    });

    console.log("API (session-logout): Session cookie successfully cleared from response with SameSite=None.");
    return response;

  } catch (error: any) {
    console.error('API (session-logout): Error during logout process:', error.message, error.stack);
    return NextResponse.json({ error: 'Failed to clear session.', details: error.message }, { status: 500 });
  }
}
