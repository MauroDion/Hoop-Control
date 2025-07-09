"use client";

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
// Import ALL auth functions and types needed across the client app to be re-exported
import { 
    getAuth, 
    onIdTokenChanged, 
    signOut, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    GoogleAuthProvider,
    signInWithPopup,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    type Auth, 
    type User as FirebaseUser,
    type UserCredential
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    // Provide dummy objects to prevent crashing on import
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

// Re-export everything for a single point of access
export { 
    app, 
    auth, 
    db,
    // Auth functions
    onIdTokenChanged, 
    signOut, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    GoogleAuthProvider,
    signInWithPopup,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
};
// Re-export types
export type { FirebaseApp, Auth, FirebaseUser, UserCredential, Firestore };
