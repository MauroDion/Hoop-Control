
'use server';

import { db } from '@/lib/firebase/client';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
    const userProfileRef = doc(db, 'user_profiles', uid);

    const profileToSave: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        uid: uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        profileTypeId: data.profileType, 
        clubId: data.selectedClubId,   
        status: 'pending_approval' as UserProfileStatus, // Hardcoded as per requirement
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    console.log(`UserActions: Attempting to create Firestore profile for UID: ${uid} in 'user_profiles' collection.`);
    console.log(`UserActions: Data to be saved (profileToSave):`, JSON.stringify(profileToSave, null, 2));
    
    console.log(`UserActions: Checking conditions relevant to Firestore 'create' rule for /user_profiles/{uid}:`);
    console.log(`UserActions:   - Input UID for doc ID: ${uid}`);
    console.log(`UserActions:   - profileToSave.uid (request.resource.data.uid): ${profileToSave.uid}`);
    console.log(`UserActions:   - Does profileToSave.uid match input uid? ${profileToSave.uid === uid}`);
    console.log(`UserActions:   - profileToSave.status (request.resource.data.status): ${profileToSave.status}`);
    console.log(`UserActions:   - Is profileToSave.status === 'pending_approval'? ${profileToSave.status === 'pending_approval'}`);
    console.log(`UserActions:   - profileToSave.email (request.resource.data.email): ${profileToSave.email}`);
    console.log(`UserActions:   - profileToSave.profileTypeId: ${profileToSave.profileTypeId}`); // Log this to ensure it's defined
    console.log(`UserActions:   - profileToSave.clubId: ${profileToSave.clubId}`); // Log this to ensure it's defined


    if (profileToSave.profileTypeId === undefined) {
      console.error("UserActions: profileTypeId is undefined before setDoc. This will cause a Firestore error if not caught by rules. Likely means profileType was not selected in the form or not passed correctly.");
      // This check is more for preventing Firestore 'undefined' value errors than permission errors, but good to have.
    }
    if (profileToSave.clubId === undefined) {
       console.error("UserActions: clubId is undefined before setDoc. This will cause a Firestore error if not caught by rules. Likely means selectedClubId was not selected in the form or not passed correctly.");
    }

    await setDoc(userProfileRef, profileToSave);
    console.log(`UserActions: Successfully created Firestore profile for UID: ${uid} in 'user_profiles'.`);
    return { success: true };
  } catch (error: any) {
    console.error(`UserActions: Error creating user profile in Firestore for UID ${uid} (collection 'user_profiles'):`, error.message, error.code, error.stack);
    let errorMessage = 'Failed to create user profile.';
    if (error.message && error.message.toLowerCase().includes('permission denied')) {
        errorMessage = `Permission denied by Firestore. Please check your Firestore security rules for the 'user_profiles' collection and ensure they allow profile creation (e.g., with 'pending_approval' status and matching UIDs). Also, review server logs for details on the data being sent. Firestore error code: ${error.code || 'unknown'}`;
    } else if (error.message && error.message.toLowerCase().includes('invalid data') && error.message.toLowerCase().includes('undefined')) {
        errorMessage = `Failed to save profile: Invalid data sent to Firestore. A field likely had an 'undefined' value. Common culprits are 'profileTypeId' or 'clubId' if not selected in the form. Error: ${error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
