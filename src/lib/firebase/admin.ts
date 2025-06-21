
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
        throw new Error('Parsed service account JSON is missing essential fields (project_id, private_key, client_email).');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK: Initialized successfully using service account JSON.');

    } catch (e: any) {
      console.error(
        'Firebase Admin SDK: CRITICAL FAILURE. Could not initialize using the provided FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. ' +
        `Error details: ${e.message}`
      );
    }
  } else {
    // This path is for environments like App Hosting where credentials are automatically provided.
    console.warn(
      'Firebase Admin SDK: WARNING - FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON not found. ' +
      'Attempting default initialization. This is expected in production on App Hosting. ' +
      'For local development, ensure the env var is set in .env.local.'
    );
    try {
        admin.initializeApp();
        console.log('Firebase Admin SDK: Default initialization successful.');
    } catch (e: any) {
        console.error(
          'Firebase Admin SDK: CRITICAL FAILURE - Default initialization failed. ' +
          `Error: ${e.message}`
        );
    }
  }
}

// Export auth and firestore instances. They might be undefined if initialization failed.
// The code using them should be defensive.
const adminAuth = admin.apps.length ? admin.auth() : undefined;
const adminDb = admin.apps.length ? admin.firestore() : undefined;

if (!adminAuth || !adminDb) {
    console.error("Firebase Admin SDK: FATAL - adminAuth or adminDb could not be exported because the SDK is not initialized. Check logs above for initialization errors.");
}

export { adminAuth, adminDb };
export default admin;
