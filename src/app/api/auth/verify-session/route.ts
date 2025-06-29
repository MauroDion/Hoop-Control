
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin';
import { getUserProfileById } from '@/app/users/actions';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error.'}`;
    console.warn(`API (verify-session): CRITICAL WARNING - Firebase Admin SDK not initialized. Details: ${adminInitError}`);
    return NextResponse.json({ isAuthenticated: false, error: detailedError }, { status: 500 });
  }

  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ isAuthenticated: false, error: 'Session cookie not found.' }, { status: 401 });
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /* checkRevoked */);
    const userRecord = await adminAuth.getUser(decodedClaims.uid);
    
    const userProfile = await getUserProfileById(decodedClaims.uid);

    if (userProfile && userProfile.status === 'approved') {
      return NextResponse.json({
        isAuthenticated: true,
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
      }, { status: 200 });
    } else {
      const reason = userProfile ? `status is '${userProfile.status}'` : 'profile not found';
      console.warn(`API (verify-session): Auth FAILED for UID: ${decodedClaims.uid} because ${reason}.`);
      return NextResponse.json({ 
          isAuthenticated: false, 
          error: 'User account not active.', 
          reason: userProfile?.status || 'not_found'
        }, { status: 403 });
    }

  } catch (error: any) {
    console.warn(`API (verify-session): Cookie verification FAILED. Error Code: ${error.code}. Message: ${error.message}`);
    return NextResponse.json({ 
        isAuthenticated: false, 
        error: 'Invalid session cookie.', 
        reason: 'invalid_cookie',
        details: `Code: ${error.code}, Message: ${error.message}` 
    }, { status: 401 });
  }
}
