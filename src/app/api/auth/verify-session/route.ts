
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin';
import { getUserProfileById } from '@/app/users/actions';

export async function POST(request: NextRequest) {
  // Add a defensive check right at the beginning
  if (!adminAuth) {
    const detailedError = `Server authentication is not configured correctly. Reason: ${adminInitError || 'Unknown initialization error. Check server startup logs for details.'}`;
    console.warn(`API (verify-session): CRITICAL WARNING - Firebase Admin SDK is not initialized. Details: ${adminInitError}`);
    return NextResponse.json({ isAuthenticated: false, error: detailedError }, { status: 500 });
  }

  const sessionCookie = request.cookies.get('session')?.value;

  if (!sessionCookie) {
    console.log("API (verify-session): Request received, but 'session' cookie was not found.");
    return NextResponse.json({ isAuthenticated: false, error: 'Session cookie not found.' }, { status: 401 });
  }
  console.log("API (verify-session): Request received with a 'session' cookie. Attempting to verify...");

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /* checkRevoked */);
    console.log(`API (verify-session): Cookie verification SUCCESS for UID: ${decodedClaims.uid}. Now checking profile status...`);

    // --- NEW LOGIC: Check Firestore profile status ---
    const userProfile = await getUserProfileById(decodedClaims.uid);

    if (userProfile && userProfile.status === 'approved') {
      console.log(`API (verify-session): Profile status is 'approved' for UID: ${decodedClaims.uid}. Authentication successful.`);
      return NextResponse.json({ isAuthenticated: true, uid: decodedClaims.uid, email: decodedClaims.email }, { status: 200 });
    } else {
      const reason = userProfile ? `status is '${userProfile.status}'` : 'profile not found';
      console.warn(`API (verify-session): Authentication FAILED for UID: ${decodedClaims.uid} because ${reason}.`);
      // User is not approved or doesn't have a profile. Send back a structured error.
      return NextResponse.json({ 
          isAuthenticated: false, 
          error: 'User account not active.', 
          reason: userProfile?.status || 'not_found' // e.g., 'pending_approval', 'rejected'
        }, { status: 403 }); // 403 Forbidden is appropriate for a valid user who lacks rights
    }

  } catch (error: any) {
    console.warn(`API (verify-session): Cookie verification FAILED. Error Code: ${error.code}. Message: ${error.message}`);
    // This catches invalid/expired cookies.
    return NextResponse.json({ 
        isAuthenticated: false, 
        error: 'Invalid session cookie.', 
        reason: 'invalid_cookie',
        details: `Code: ${error.code}, Message: ${error.message}` 
    }, { status: 401 });
  }
}
