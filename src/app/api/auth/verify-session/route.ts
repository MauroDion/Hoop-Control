
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  // Add a defensive check right at the beginning
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error. Check server startup logs for details.'}`;
    console.error(`API (verify-session): CRITICAL ERROR - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    return NextResponse.json({ isAuthenticated: false, error: detailedError }, { status: 500 });
  }

  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    console.warn("API (verify-session): Request received, but 'session' cookie was not found.");
    return NextResponse.json({ isAuthenticated: false, error: 'Session cookie not found.' }, { status: 401 });
  }
  console.log("API (verify-session): Request received with a 'session' cookie. Attempting to verify...");

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /* checkRevoked */);
    console.log(`API (verify-session): Cookie verification SUCCESS for UID: ${decodedClaims.uid}.`);
    return NextResponse.json({ isAuthenticated: true, uid: decodedClaims.uid, email: decodedClaims.email }, { status: 200 });
  } catch (error: any) {
    console.warn(`API (verify-session): Cookie verification FAILED. Error Code: ${error.code}. Message: ${error.message}`);
    // Clear the potentially invalid cookie by sending an instruction back to the middleware (or client)
    // For simplicity, just return unauthenticated. The middleware will handle redirection.
    return NextResponse.json({ isAuthenticated: false, error: 'Invalid session cookie.', details: `Code: ${error.code}, Message: ${error.message}` }, { status: 401 });
  }
}
