
import admin from 'firebase-admin';

// This file should only be used in the Node.js runtime (Server Actions, API Routes).

// Standard initialization for Firebase App Hosting and other Google Cloud environments.
// It automatically uses the service account credentials provided by the environment.
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
}

const adminAuth = admin.apps.length ? admin.auth() : undefined;
const adminDb = admin.apps.length ? admin.firestore() : undefined;

if (!adminAuth || !adminDb) {
    console.error("Firebase Admin SDK: adminAuth or adminDb could not be exported because the SDK is not initialized.");
}

export { adminAuth, adminDb };
export default admin;
