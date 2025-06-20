
'use server';

import { db } from '@/lib/firebase/client';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus } from '@/types';

// Note: The primary user profile creation flow upon registration
// has been moved to client-side in RegisterForm.tsx for simpler auth context handling with Firestore rules.
// This server action (createUserFirestoreProfile) might still be useful for admin-initiated profile creations
// or other backend processes in the future, but would likely need to use Firebase Admin SDK
// for proper authentication and authorization if called from a secure backend environment.
// For now, it is largely unused for the standard registration flow.

interface CreateUserFirestoreProfileData {
  email: string | null;
  displayName: string | null;
  profileType: ProfileType;
  selectedClubId: string;
  photoURL?: string | null;
}

export async function createUserFirestoreProfile(
  uid: string,
  data: CreateUserFirestoreProfileData
): Promise<{ success: boolean; error?: string }> {
  try {
    const userProfileRef = doc(db, 'user_profiles', uid);

    const profileToSave: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        uid: uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        profileTypeId: data.profileType,
        clubId: data.selectedClubId,
        status: 'pending_approval' as UserProfileStatus, // Default status
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    
    await setDoc(userProfileRef, profileToSave);
    console.log(`UserActions (Server Action): Successfully created Firestore profile for UID: ${uid} in 'user_profiles'.`);
    return { success: true };
  } catch (error: any) {
    console.error(`UserActions (Server Action): Error creating user profile in Firestore for UID ${uid} (collection 'user_profiles'):`, error.message, error.code, error.stack);
    let errorMessage = 'Failed to create user profile via server action.';
    if (error.message && error.message.toLowerCase().includes('permission denied')) {
        errorMessage = `Permission denied by Firestore (from server action). This action likely needs Admin SDK for proper auth context or different rules. Firestore error code: ${error.code || 'unknown'}`;
    } else if (error.message && error.message.toLowerCase().includes('invalid data') && error.message.toLowerCase().includes('undefined')) {
        errorMessage = `Failed to save profile (from server action): Invalid data sent to Firestore. A field likely had an 'undefined' value. Error: ${error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}


export async function getUserProfileById(uid: string): Promise<UserFirestoreProfile | null> {
  console.log(`UserActions: Attempting to fetch profile for UID: ${uid} from 'user_profiles'.`);
  try {
    const userProfileRef = doc(db, 'user_profiles', uid);
    const docSnap = await getDoc(userProfileRef);

    if (docSnap.exists()) {
      console.log(`UserActions: Profile found for UID: ${uid}.`);
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
