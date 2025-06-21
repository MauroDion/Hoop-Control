
'use server';

import { db } from '@/lib/firebase/client';
import { adminAuth, adminDb, adminInitError } from '@/lib/firebase/admin';
import { doc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus } from '@/types';

// This new server action uses the Admin SDK to securely create the user profile,
// bypassing client-side security rules which are a common point of failure.
export async function finalizeNewUserProfile(
  idToken: string,
  data: { profileType: ProfileType; selectedClubId: string; displayName: string; }
): Promise<{ success: boolean; error?: string }> {
  // Defensive check to ensure the Admin SDK was initialized correctly.
  if (!adminAuth || !adminDb) {
    console.error("UserActions (finalize): Firebase Admin SDK not initialized. Error:", adminInitError);
    return { success: false, error: `Server configuration error: ${adminInitError || 'Unknown admin SDK error.'}` };
  }

  try {
    console.log("UserActions (finalize): Verifying ID token...");
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    console.log(`UserActions (finalize): ID token verified for UID: ${uid}`);

    // Use the Admin SDK to update the Auth user's display name
    await adminAuth.updateUser(uid, { displayName: data.displayName });
    console.log(`UserActions (finalize): Updated Auth user display name for UID: ${uid}`);

    // Use the Admin SDK to create the Firestore user profile document
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);

    // Casting to any to handle serverTimestamp correctly before saving
    const profileToSave: any = {
        uid: uid,
        email: decodedToken.email,
        displayName: data.displayName,
        photoURL: decodedToken.picture || null,
        profileTypeId: data.profileType,
        clubId: data.selectedClubId,
        status: 'pending_approval' as UserProfileStatus,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await userProfileRef.set(profileToSave);
    console.log(`UserActions (finalize): Successfully created Firestore profile for UID: ${uid}`);
    
    return { success: true };

  } catch (error: any) {
    console.error(`UserActions (finalize): Error finalizing user profile. Error code: ${error.code}. Message: ${error.message}`);
    return { success: false, error: `Failed to finalize profile on server: ${error.message}` };
  }
}


export async function getUserProfileById(uid: string): Promise<UserFirestoreProfile | null> {
  console.log(`UserActions: Attempting to fetch profile for UID: ${uid} from 'user_profiles'.`);
  try {
    const userProfileRef = doc(db, 'user_profiles', uid);
    const docSnap = await getDoc(userProfileRef);

    if (docSnap.exists()) {
      console.log(`UserActions: Profile found for UID: ${uid}.`);
      // Note: Casting needed because serverTimestamp is read back as Timestamp
      return { uid: docSnap.id, ...docSnap.data() } as UserFirestoreProfile;
    } else {
      console.warn(`UserActions: No profile found for UID: ${uid}.`);
      return null;
    }
  } catch (error: any) {
    console.error(`UserActions: Error fetching user profile for UID ${uid}:`, error.message, error.stack);
    return null;
  }
}
