import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminInitError } from '@/lib/firebase/admin';
import { getUserProfileById } from '@/lib/actions/users';

export async function POST(request: NextRequest) {
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error.'}`;
    console.error(`API (session-login): CRITICAL ERROR - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    return NextResponse.json({ error: detailedError }, { status: 500 });
  }

  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log(`API (session-login): Verified ID token for UID ${uid}. Checking profile status...`);

    // --- Profile Status Verification ---
    const userProfile = await getUserProfileById(uid);

    if (!userProfile) {
        console.warn(`API (session-login): Auth FAILED for UID ${uid}. Reason: Firestore profile not found.`);
        return NextResponse.json({ 
            status: 'error', 
            error: 'User profile does not exist.', 
            reason: 'not_found' 
        }, { status: 403 });
    }
    
    if (userProfile.status !== 'approved') {
        console.warn(`API (session-login): Auth FAILED for UID ${uid}. Reason: Profile status is '${userProfile.status}'.`);
        return NextResponse.json({ 
            status: 'error', 
            error: 'User account not active.', 
            reason: userProfile.status // e.g., 'pending_approval', 'rejected'
        }, { status: 403 });
    }
    // --- End Profile Status Verification ---

    console.log(`API (session-login): Profile status for UID ${uid} is 'approved'. Creating session cookie.`);
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    };
    
    const response = NextResponse.json({ status: 'success', uid }, { status: 200 });
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
