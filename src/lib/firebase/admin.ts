
import admin from 'firebase-admin';

// Ensure this file is only processed once.
if (!admin.apps.length) {
  if (process.env.NEXT_RUNTIME === 'edge') {
    // EDGE RUNTIME (Middleware, etc.)
    console.log('Firebase Admin SDK (Edge): Attempting default initialization.');
    try {
      // For Edge, Firebase Admin SDK expects credentials to be implicitly available
      // (e.g., via environment in Firebase App Hosting).
      admin.initializeApp();
      console.log('Firebase Admin SDK (Edge): Default initialization successful.');
    } catch (e: any) {
      console.error('Firebase Admin SDK (Edge): Default initialization FAILED. This is critical for Edge functionality. Error: ' + e.message, e.stack);
      // Note: authInstance and dbInstance might remain undefined if this fails.
    }
  } else {
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
          admin.initializeApp();
          console.log('Firebase Admin SDK (Node.js): Default initialization (fallback after JSON failure) successful.');
        } catch (defaultInitError: any) {
          console.error('Firebase Admin SDK (Node.js): Default initialization (fallback after JSON failure) FAILED. This is critical. Error: ' + defaultInitError.message, defaultInitError.stack);
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
      } catch (e: any) {
          console.error('Firebase Admin SDK (Node.js): Default initialization FAILED. This is critical. Error: ' + e.message, e.stack);
      }
    }
  }
} else {
  // console.log('Firebase Admin SDK: Already initialized.');
}

let authInstance: admin.auth.Auth | undefined;
let dbInstance: admin.firestore.Firestore | undefined;

// Attempt to get instances only if an app is initialized and the default app exists.
// admin.app() throws if no app is initialized, so check admin.apps.length first.
if (admin.apps.length > 0) {
  try {
    // Ensure we are trying to get auth/db from the default app
    const defaultApp = admin.app(); 
    authInstance = defaultApp.auth();
    dbInstance = defaultApp.firestore();
  } catch (e: any) {
    console.error("Firebase Admin SDK: Error getting auth or db instance from default app. This might happen if initialization failed. Error: " + e.message);
    // Instances will remain undefined
  }
} else {
  console.warn("Firebase Admin SDK: No Firebase app initialized. Auth and DB instances will be undefined. This usually means initialization failed critically in all paths.");
}

// Exporting with non-null assertion. If these are undefined, it means initialization failed.
// The application code using these should ideally check for their existence or be prepared for errors.
export const adminAuth = authInstance!;
export const adminDb = dbInstance!;
export default admin;
