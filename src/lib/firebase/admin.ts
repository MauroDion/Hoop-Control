
import admin from 'firebase-admin';

// This file is now only used in the Node.js runtime (API Routes).
// We ensure it's only initialized once.
if (!admin.apps.length) {
  const serviceAccountJsonString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJsonString) {
    console.log('Firebase Admin SDK: Found FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. Attempting to initialize...');
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonString);

      // Basic validation of the parsed service account object
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Parsed service account JSON is missing essential fields (project_id, private_key, client_email). Please verify the content of the FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable in your .env.local file.');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK: Initialized successfully using service account JSON.');

    } catch (e: any) {
      console.error(
        'Firebase Admin SDK: CRITICAL FAILURE. Could not initialize using the provided FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. ' +
        'This is the most likely cause of your "Server authentication error". ' +
        `Error details: ${e.message}`
      );
      // We will let the app continue without initializing, but auth features will fail.
    }
  } else {
    console.warn(
      'Firebase Admin SDK: WARNING - FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON not found. ' +
      'Attempting default initialization. This is expected in production on App Hosting, ' +
      'but for local development, you should set the FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON variable in .env.local.'
    );
    try {
        admin.initializeApp();
        console.log('Firebase Admin SDK: Default initialization successful.');
    } catch (e: any) {
        console.error(
          'Firebase Admin SDK: CRITICAL FAILURE - Default initialization failed. ' +
          'This can happen if Application Default Credentials are not configured. ' +
          `Error: ${e.message}`
        );
    }
  }
}

// Export auth and firestore instances, handling potential initialization failure
let authInstance: admin.auth.Auth | undefined;
let dbInstance: admin.firestore.Firestore | undefined;

if (admin.apps.length > 0 && admin.apps[0]) {
    authInstance = admin.auth();
    dbInstance = admin.firestore();
} else {
    console.error("Firebase Admin SDK: Could not get auth or db instance because no app was initialized. Server-side auth will fail.");
}

export const adminAuth = authInstance!;
export const adminDb = dbInstance!;
export default admin;
