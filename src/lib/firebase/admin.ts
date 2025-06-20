import admin from 'firebase-admin';

const serviceAccountKeyPath = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY_PATH;

if (!admin.apps.length) {
  try {
    if (serviceAccountKeyPath) {
      // Initialize with service account key file (typically for local dev or specific environments)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require(serviceAccountKeyPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized with service account key file.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       // Initialize with GOOGLE_APPLICATION_CREDENTIALS env var (common for local dev)
       // The SDK automatically picks this up if the variable is set and points to a valid key file.
       admin.initializeApp({
         credential: admin.credential.applicationDefault(),
       });
       console.log('Firebase Admin SDK initialized with GOOGLE_APPLICATION_CREDENTIALS.');
    } else {
      // Initialize with default credentials (suitable for Firebase/Google Cloud environments like App Hosting, Cloud Functions)
      // This relies on the runtime environment providing the necessary credentials.
      admin.initializeApp();
      console.log('Firebase Admin SDK initialized with default credentials (suitable for Firebase/GCP environments).');
    }
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
    // Depending on your error handling strategy, you might want to re-throw the error
    // or handle it gracefully. For now, we log it.
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore(); // If you need admin access to Firestore
export default admin;
