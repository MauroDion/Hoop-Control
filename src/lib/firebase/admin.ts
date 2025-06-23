
// Temporarily disabled to debug server startup issues.
// The 'firebase-admin' package can cause issues in certain environments if not configured perfectly.
export const adminInitError = "Firebase Admin SDK is temporarily disabled for debugging.";
export const adminAuth = undefined;
export const adminDb = undefined;
const admin = undefined;
export default admin;


// Original code is preserved below for when we re-enable it.
/*
import admin from 'firebase-admin';

// This new exported variable will hold the specific initialization error.
export let adminInitError: string | null = null;

// This file is now only used in the Node.js runtime (API Routes).
// We ensure it's only initialized once.
if (!admin.apps.length) {
  // Diagnostic log to check if the environment variable is being read at all.
  const serviceAccountJsonString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  console.log(`Firebase Admin SDK: Checking for credentials. Found FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON variable of type '${typeof serviceAccountJsonString}' with length ${serviceAccountJsonString?.length ?? 0}.`);

  if (serviceAccountJsonString) {
    console.log('Firebase Admin SDK: Attempting to initialize using service account JSON...');
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
      // Store the specific error message
      adminInitError = `Could not initialize using FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. Error: ${e.message}`;
      // Use console.warn to avoid crashing the server in a loop
      console.warn(`Firebase Admin SDK: NON-FATAL FAILURE. ${adminInitError}`);
    }
  } else {
    // Store the specific error message
    adminInitError = 'FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable not found. This is required for local development.';
    console.warn(
      'Firebase Admin SDK: WARNING - ' + adminInitError +
      ' Attempting default initialization. This is expected in production on App Hosting.'
    );
    try {
        admin.initializeApp();
        console.log('Firebase Admin SDK: Default initialization successful.');
    } catch (e: any) {
        adminInitError = `Default initialization also failed. Error: ${e.message}`;
        // Use console.warn to avoid crashing the server in a loop
        console.warn(
          'Firebase Admin SDK: NON-FATAL FAILURE - ' + adminInitError
        );
    }
  }
}

// Export auth and firestore instances. They will be undefined if initialization failed.
const adminAuth = admin.apps.length ? admin.auth() : undefined;
const adminDb = admin.apps.length ? admin.firestore() : undefined;

if (!adminAuth || !adminDb) {
    // Update the error if it's still null but initialization failed for some other reason
    if (admin.apps.length === 0 && !adminInitError) {
        adminInitError = "Unknown error during Firebase Admin initialization.";
    }
    // Using console.warn instead of console.error to prevent the server process manager
    // from treating this as a fatal startup error and restarting the server in a loop.
    console.warn(`Firebase Admin SDK: WARNING - adminAuth or adminDb could not be exported because the SDK is not initialized. Error: ${adminInitError}`);
}

export { adminAuth, adminDb };
export default admin;
*/
