import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin';
import { getUserProfileById } from '@/app/users/actions';

export async function POST(request: NextRequest) {
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error.'}`;
    console.warn(`API (session-login): CRITICAL WARNING - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    return NextResponse.json({ error: detailedError }, { status: 500 });
  }

  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const userProfile = await getUserProfileById(uid);

    if (!userProfile) {
      // This is a valid user (e.g. from Google Sign In) who hasn't completed their profile.
      // Deny session cookie creation but provide a specific reason for the client to handle.
      return NextResponse.json({ 
          error: 'User profile not found.',
          reason: 'not_found'
      }, { status: 403 });
    }

    if (userProfile.status === 'approved') {
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      
      const options = {
        name: 'session',
        value: sessionCookie,
        maxAge: expiresIn,
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'none' as const,
      };
      
      const response = NextResponse.json({ status: 'success' }, { status: 200 });
      response.cookies.set(options);
      return response;

    } else {
      // User has a profile but is not approved (pending, rejected).
      return NextResponse.json({ 
          error: 'User account not active.',
          reason: userProfile.status
      }, { status: 403 });
    }

  } catch (error: any) {
    console.error('API (session-login): CRITICAL ERROR processing login:', error);
    let errorMessage = 'Failed to create session.';
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/invalid-id-token') {
        errorMessage = 'Firebase ID token is invalid or expired. Please re-authenticate.';
    }
    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 401 });
  }
}
