"use client";

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
    getAuth, 
    onIdTokenChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence,
    type Auth,
    type User as FirebaseUser,
    type UserCredential
} from 'firebase/auth';
import { getFirestore, type Firestore, doc, onSnapshot } from 'firebase/firestore';
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
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { 
    app, 
    auth, 
    db,
    onIdTokenChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence,
    doc,
    onSnapshot,
    type FirebaseUser,
    type UserCredential,
    type Auth,
    type FirebaseApp,
    type Firestore
};