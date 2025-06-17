
'use server';

import { db } from '@/lib/firebase/client';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus } from '@/types';

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
    const userProfileRef = doc(db, 'users', uid);
    
    const profileToSave: Omit<UserFirestoreProfile, 'uid' | 'createdAt' | 'updatedAt'> & { uid: string; createdAt: any; updatedAt: any } = {
        uid: uid, // Explicitly including uid in the data to be saved
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        profileType: data.profileType,
        selectedClubId: data.selectedClubId,
        status: 'pending_approval' as UserProfileStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    console.log(`UserActions: Attempting to create Firestore profile for UID: ${uid}.`);
    console.log(`UserActions: Data to be saved (profileToSave):`, JSON.stringify(profileToSave, null, 2));
    console.log(`UserActions: Checking conditions relevant to Firestore 'create' rule for /users/{userId}:`);
    console.log(`UserActions:   - Does profileToSave.uid match input uid? ${profileToSave.uid === uid}`);
    console.log(`UserActions:   - Is profileToSave.status === 'pending_approval'? ${profileToSave.status === 'pending_approval'}`);
    console.log(`UserActions:   - Is profileToSave.email (for rule check if request.auth.token.email)? ${profileToSave.email}`);


    await setDoc(userProfileRef, profileToSave);
    console.log(`UserActions: Successfully created Firestore profile for UID: ${uid}`);
    return { success: true };
  } catch (error: any) {
    console.error(`UserActions: Error creating user profile in Firestore for UID ${uid}:`, error.message, error.code, error.stack);
    let errorMessage = 'Failed to create user profile.';
    if (error.message) {
        errorMessage = error.message;
    }
    // Specific check for permission denied to give a more targeted hint
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission-denied'))) {
        errorMessage = 'Permission denied. Please check Firestore security rules for creating documents in the "users" collection. Ensure the user has rights and the data meets rule conditions (e.g., status is "pending_approval" and UID matches).';
         console.error("UserActions: Firestore permission denied. This usually means the security rules for the 'users' collection are not allowing this write operation, or the data being sent does not meet the rule conditions (e.g. 'status' field, UID match).");
    }
    return { success: false, error: errorMessage };
  }
}
