
import { type NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminInitError } from '@/lib/firebase/admin'; // Import adminInitError
import { getUserProfileById } from '@/app/users/actions';

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
    
    console.log(`API (session-login): Received ID token, verifying and checking profile status...`);

    // Verify the token to get the user's UID
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log(`API (session-login): ID token verified for UID: ${uid}.`);
    
    // Check the user's profile status in Firestore.
    const userProfile = await getUserProfileById(uid);

    // Only create a session if the user's profile is found and status is 'approved'
    if (userProfile && userProfile.status === 'approved') {
      console.log(`API (session-login): Profile status for UID ${uid} is 'approved'. Proceeding to create session cookie.`);
      
      // Set session expiration to 5 days.
      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
      
      // Create the session cookie.
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      
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

    } else {
      // If user is not approved or has no profile, deny session creation.
      const reason = userProfile ? `status is '${userProfile.status}'` : 'profile not found';
      console.warn(`API (session-login): Session creation DENIED for UID: ${uid} because ${reason}.`);
      
      // Return a specific error that the client can use to show an informative message.
      return NextResponse.json({ 
          error: 'User account not active.',
          reason: userProfile?.status || 'not_found' // e.g., 'pending_approval', 'rejected'
      }, { status: 403 }); // 403 Forbidden is appropriate here.
    }

  } catch (error: any) {
    console.error('API (session-login): CRITICAL ERROR processing login. Full error object:', error);
    
    let errorMessage = 'Failed to create session.';
    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Firebase ID token has expired. Please re-authenticate.';
    } else if (error.code === 'auth/invalid-id-token') {
        errorMessage = 'Firebase ID token is invalid. Please re-authenticate.';
    } else if (error.message) {
        errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 401 });
  }
}
