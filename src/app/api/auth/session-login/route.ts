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
      // This is a special case for new users who exist in Auth but not Firestore yet.
      // We allow the session to be created so they can proceed to onboarding.
      // The AuthContext on the client will handle redirecting to the correct onboarding page.
      console.log(`API (session-login): No profile found for UID ${uid}, likely a new user. Creating session for onboarding.`);
    } else if (userProfile.status !== 'approved') {
      // If a profile exists but is not approved, we deny the session.
       return NextResponse.json({ 
          error: 'User account not active.',
          reason: userProfile.status // 'pending_approval' or 'rejected'
      }, { status: 403 });
    }

    // Create session for new users or approved users
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'none' as const,
    };
    
    const response = NextResponse.json({ status: 'success' }, { status: 200 });
    response.cookies.set(options);
    return response;

  } catch (error: any) {
    console.error('API (session-login): CRITICAL ERROR processing login:', error);
    let errorMessage = 'Failed to create session.';
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/invalid-id-token') {
        errorMessage = 'Firebase ID token is invalid or expired. Please re-authenticate.';
    }
    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 401 });
  }
}
