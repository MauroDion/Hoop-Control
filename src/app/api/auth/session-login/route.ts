
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin'; // Import adminInitError

export async function POST(request: NextRequest) {
  // Add a defensive check right at the beginning
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error. Check server startup logs for details.'}`;
    console.warn(`API (session-login): CRITICAL WARNING - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    return NextResponse.json({ error: detailedError }, { status: 500 });
  }

  try {
    const { idToken } = await request.json();
    if (!idToken) {
      console.log("API (session-login): Request failed because ID token is missing.");
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }
    console.log(`API (session-login): Received ID token, attempting to create session cookie.`);

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds

    // Create the session cookie. This will also verify the ID token.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set cookie policy for session cookie.
    // Use SameSite='None' and Secure=true for cross-site contexts like iframes.
    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: true, // Must be true for SameSite=None
      path: '/',
      sameSite: 'none' as const,
    };

    const response = NextResponse.json({ status: 'success', message: 'Session cookie created.' }, { status: 200 });
    response.cookies.set(options);
    
    console.log("API (session-login): Session cookie successfully created and set with SameSite=None.");
    return response;

  } catch (error: any) {
    console.error('API (session-login): CRITICAL ERROR creating session cookie. Full error object:', error);
    
    // Provide more specific error messages for better client-side debugging.
    let errorMessage = 'Failed to create session.';
    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Firebase ID token has expired. Please re-authenticate.';
    } else if (error.code === 'auth/invalid-id-token') {
        errorMessage = 'Firebase ID token is invalid. Please re-authenticate.';
    } else if (error.message) {
        // For other errors, especially credential errors, pass the specific message.
        errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 401 });
  }
}
