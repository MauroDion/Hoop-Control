
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountJsonString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJsonString) {
    console.log('Firebase Admin SDK: Found FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. Attempting initialization with it.');
    try {
      const serviceAccount = JSON.parse(serviceAccountJsonString);
      // Basic validation of the parsed service account object
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Parsed service account JSON is missing one or more essential fields (project_id, private_key, client_email).');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK: Initialized successfully using FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON.');
    } catch (e: any) {
      console.error(
        'Firebase Admin SDK: CRITICAL ERROR: Failed to parse or use FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON. ' +
        `Ensure it is a valid JSON string. Error: ${e.message}. ` +
        'Falling back to default initialization attempt.'
      );
      // Fallback to default initialization if JSON parsing/usage fails
      try {
        admin.initializeApp();
        console.log('Firebase Admin SDK: Default initialization attempted after FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON failure. This is for environments like Firebase App Hosting.');
      } catch (defaultInitError: any) {
        console.error('Firebase Admin SDK: Default initialization (fallback) also failed. Error: ' + defaultInitError.message, defaultInitError.stack);
        // At this point, admin SDK is not initialized. Subsequent calls will fail.
      }
    }
  } else {
    console.log(
        'Firebase Admin SDK: FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON environment variable not found. ' +
        'Attempting default initialization. This is expected for deployed environments like Firebase App Hosting or when GOOGLE_APPLICATION_CREDENTIALS is set up for Application Default Credentials.'
    );
    try {
      admin.initializeApp(); // For App Hosting / Default ADC
      console.log('Firebase Admin SDK: Default initialization successful.');
    } catch (e:any) {
       console.error('Firebase Admin SDK: Default initialization failed. Error: ' + e.message, e.stack);
       // At this point, admin SDK is not initialized.
    }
  }
} else {
  // This log can be noisy if printed on every hot-reload, but useful for first load.
  // console.log('Firebase Admin SDK: Already initialized.');
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
