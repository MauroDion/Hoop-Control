
'use server';

import { db } from '@/lib/firebase/client';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus } from '@/types';

// Note: The primary user profile creation flow upon registration
// has been moved to client-side in RegisterForm.tsx for simpler auth context handling with Firestore rules.
// This server action (createUserFirestoreProfile) might still be useful for admin-initiated profile creations
// or other backend processes in the future, but would likely need to use Firebase Admin SDK
// for proper authentication and authorization if called from a secure backend environment.

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

    console.log(`UserActions (Server Action): Attempting to create Firestore profile for UID: ${uid} in 'user_profiles' collection.`);
    console.log(`UserActions (Server Action): Data to be saved (profileToSave):`, JSON.stringify(profileToSave, null, 2));
    
    console.log(`UserActions (Server Action): Checking conditions relevant to Firestore 'create' rule for /user_profiles/{uid}:`);
    console.log(`UserActions (Server Action):   - Input UID for doc ID: ${uid}`);
    console.log(`UserActions (Server Action):   - profileToSave.uid (request.resource.data.uid): ${profileToSave.uid}`);
    console.log(`UserActions (Server Action):   - Does profileToSave.uid match input uid? ${profileToSave.uid === uid}`);
    console.log(`UserActions (Server Action):   - profileToSave.status (request.resource.data.status): ${profileToSave.status}`);
    console.log(`UserActions (Server Action):   - Is profileToSave.status === 'pending_approval'? ${profileToSave.status === 'pending_approval'}`);
    console.log(`UserActions (Server Action):   - profileToSave.email (request.resource.data.email): ${profileToSave.email}`);
    console.log(`UserActions (Server Action):   - profileToSave.profileTypeId: ${profileToSave.profileTypeId}`); 
    console.log(`UserActions (Server Action):   - profileToSave.clubId: ${profileToSave.clubId}`);

    // Important consideration: If this server action is called, the `db` instance (from client SDK)
    // will likely not have the end-user's auth context. Firestore rules relying on `request.auth`
    // (like `request.auth.uid == uid` or `request.auth.token.email`) would probably fail
    // unless this action is called in a context where `request.auth` is populated by other means
    // or Admin SDK is used.

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

    