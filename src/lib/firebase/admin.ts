
import admin from 'firebase-admin';
import fs from 'fs';

let adminAuth: admin.auth.Auth | undefined;
let adminDb: admin.firestore.Firestore | undefined;
let adminInitError: string | null = null;

// This file should only be used in the Node.js runtime (Server Actions, API Routes).

if (!admin.apps.length) {
  try {
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH;
    
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      console.log('Initializing Firebase Admin SDK with service account from path...');
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      const errorMessage = 'Firebase Admin Service Account file path is not defined or file does not exist. Please set FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH in your environment variables.';
      throw new Error(errorMessage);
    }

    adminAuth = admin.auth();
    adminDb = admin.firestore();
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    adminInitError = error.message;
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
} else {
  adminAuth = admin.auth();
  adminDb = admin.firestore();
}


export { adminAuth, adminDb, adminInitError };
