
import admin from 'firebase-admin';

// Ensure this file is only processed once.
if (!admin.apps.length) {
  // Check if running in Node.js environment (not Edge)
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_RUNTIME !== 'edge') {
    // NODE.JS RUNTIME (API routes, Server Components in Node.js context)
    const serviceAccountJsonString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJsonString) {
      console.log('Firebase Admin SDK (Node.js): Found FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. Attempting initialization.');
      try {
        const serviceAccount = JSON.parse(serviceAccountJsonString);
        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
          throw new Error('Parsed service account JSON from FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is missing essential fields (project_id, private_key, client_email). Ensure the full JSON key is provided.');
        }
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK (Node.js): Initialized successfully using FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON.');
      } catch (e: any) {
        console.error(
          'Firebase Admin SDK (Node.js): FAILED to parse or use FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. ' +
          `Error: ${e.message}. Attempting default Node.js initialization as a fallback.`,
          e.stack
        );
        // Fallback to default Node.js initialization if JSON string method fails
        try {
          admin.initializeApp(); // Relies on GOOGLE_APPLICATION_CREDENTIALS env var or Application Default Credentials
          console.log('Firebase Admin SDK (Node.js): Default initialization (fallback after JSON failure) successful.');
        } catch (defaultInitError: any) {
          console.error('Firebase Admin SDK (Node.js): Default initialization (fallback after JSON failure) FAILED. This is critical for Node.js runtime. Error: ' + defaultInitError.message, defaultInitError.stack);
        }
      }
    } else {
      console.log(
        'Firebase Admin SDK (Node.js): FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON not found. ' +
        'Attempting default Node.js initialization (may rely on GOOGLE_APPLICATION_CREDENTIALS file path or Application Default Credentials)...'
      );
      try {
          admin.initializeApp();
          console.log('Firebase Admin SDK (Node.js): Default initialization successful.');
      } catch (e: any)          {
          console.error('Firebase Admin SDK (Node.js): Default Node.js initialization FAILED. This is critical for Node.js runtime. Error: ' + e.message, e.stack);
      }
    }
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    // EDGE RUNTIME (Middleware, etc.)
    // For Edge, Firebase Admin SDK expects credentials to be implicitly available (e.g., via environment in Firebase App Hosting).
    // Or, it might not be fully supported for all operations.
    // For verifying session cookies, this might work if the environment is set up by App Hosting.
    console.log('Firebase Admin SDK (Edge): Attempting default initialization for Edge runtime.');
    try {
      admin.initializeApp();
      console.log('Firebase Admin SDK (Edge): Default initialization for Edge runtime successful.');
    } catch (e: any) {
      console.error('Firebase Admin SDK (Edge): Default initialization for Edge runtime FAILED. Error: ' + e.message, e.stack);
      // Note: authInstance and dbInstance might remain undefined if this fails.
    }
  } else {
    console.warn('Firebase Admin SDK: Unknown runtime environment. NEXT_RUNTIME:', process.env.NEXT_RUNTIME, '. Skipping Admin SDK initialization for safety.');
  }
} else {
  // console.log('Firebase Admin SDK: Already initialized.');
}

let authInstance: admin.auth.Auth | undefined;
let dbInstance: admin.firestore.Firestore | undefined;

// Attempt to get instances only if an app is initialized and the default app exists.
if (admin.apps.length > 0 && admin.apps[0]) { // Check if default app exists
  try {
    const defaultApp = admin.app(); 
    authInstance = defaultApp.auth();
    dbInstance = defaultApp.firestore();
  } catch (e: any) {
    console.error("Firebase Admin SDK: Error getting auth or db instance from default app. This might happen if initialization failed. Error: " + e.message);
  }
} else {
  console.warn("Firebase Admin SDK: No Firebase app initialized, or default app is missing. Auth and DB instances will be undefined. This usually means initialization failed critically in all paths.");
}

// Exporting with non-null assertion for convenience.
// Code using these should be aware that they might be undefined if initialization failed.
export const adminAuth = authInstance!;
export const adminDb = dbInstance!;
export default admin;
