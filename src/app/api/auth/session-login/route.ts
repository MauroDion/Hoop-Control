
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin'; // Use admin SDK

export async function POST(request: NextRequest) {
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
    const options = {
      name: 'session', // Name of the cookie
      value: sessionCookie,
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      path: '/',
      sameSite: 'lax' as const,
    };

    const response = NextResponse.json({ status: 'success', message: 'Session cookie created.' }, { status: 200 });
    response.cookies.set(options);
    
    console.log("API (session-login): Session cookie successfully created and set.");
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
