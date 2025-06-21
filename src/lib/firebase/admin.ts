
import admin from 'firebase-admin';

// Ensure this file is only processed once.
if (!admin.apps.length) {
  // Check if running in Node.js environment (not Edge)
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_RUNTIME !== 'edge') {
    // NODE.JS RUNTIME (API routes, Server Components in Node.js context)
    const serviceAccountJsonString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJsonString) {
      console.log('Firebase Admin SDK (Node.js): Found FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. Attempting to parse and initialize.');
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
          'Firebase Admin SDK (Node.js): CRITICAL FAILURE to parse or use FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. ' +
          'This is the most likely cause of auth issues. Please check your .env.local file. ' +
          `Error: ${e.message}.`,
          'Attempting default Node.js initialization as a fallback.'
        );
        try {
          admin.initializeApp();
          console.log('Firebase Admin SDK (Node.js): Default initialization (fallback) successful.');
        } catch (defaultInitError: any) {
          console.error('Firebase Admin SDK (Node.js): Default initialization (fallback) FAILED. This is critical. Error: ' + defaultInitError.message, defaultInitError.stack);
        }
      }
    } else {
      console.log(
        'Firebase Admin SDK (Node.js): FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON not found. ' +
        'Attempting default Node.js initialization (may rely on GOOGLE_APPLICATION_CREDENTIALS)...'
      );
      try {
          admin.initializeApp();
          console.log('Firebase Admin SDK (Node.js): Default initialization successful.');
      } catch (e: any)          {
          console.error('Firebase Admin SDK (Node.js): Default Node.js initialization FAILED. This is critical. Error: ' + e.message, e.stack);
      }
    }
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    // EDGE RUNTIME (Middleware, etc.)
    console.log('Firebase Admin SDK (Edge): Attempting default initialization for Edge runtime.');
    try {
      admin.initializeApp();
      console.log('Firebase Admin SDK (Edge): Default initialization for Edge runtime successful.');
    } catch (e: any) {
      console.error('Firebase Admin SDK (Edge): Default initialization for Edge runtime FAILED. Error: ' + e.message, e.stack);
    }
  } else {
    console.warn('Firebase Admin SDK: Unknown runtime environment. NEXT_RUNTIME:', process.env.NEXT_RUNTIME, '. Skipping Admin SDK initialization.');
  }
}

let authInstance: admin.auth.Auth | undefined;
let dbInstance: admin.firestore.Firestore | undefined;

if (admin.apps.length > 0 && admin.apps[0]) {
  try {
    const defaultApp = admin.app(); 
    authInstance = defaultApp.auth();
    dbInstance = defaultApp.firestore();
  } catch (e: any) {
    console.error("Firebase Admin SDK: Error getting auth or db instance from default app. Error: " + e.message);
  }
} else {
  console.warn("Firebase Admin SDK: No Firebase app initialized. Auth and DB instances will be undefined.");
}

export const adminAuth = authInstance!;
export const adminDb = dbInstance!;
export default admin;
