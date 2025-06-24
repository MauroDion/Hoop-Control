import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Persistence is now handled dynamically in the LoginForm component
    // before the user signs in.
    db = getFirestore(app);
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    // Fallback or dummy objects if initialization fails,
    // but features relying on Firebase will not work.
    app = {} as FirebaseApp; // Provide a dummy app object
    auth = {} as Auth; // Provide a dummy auth object
    db = {} as Firestore; // Provide a dummy db object
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
