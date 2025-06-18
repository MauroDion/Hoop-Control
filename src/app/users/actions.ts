
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
  uid: string, // This is the Firebase Auth UID of the newly created user
  data: CreateUserFirestoreProfileData
): Promise<{ success: boolean; error?: string }> {
  try {
    const userProfileRef = doc(db, 'user_profiles', uid); // Use 'user_profiles' collection
    
    const profileToSave: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        uid: uid, // Ensure the uid being saved in the document matches the document ID
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        profileTypeId: data.profileType, // Map from form data to 'profileTypeId'
        clubId: data.selectedClubId,   // Map from form data to 'clubId'
        status: 'pending_approval' as UserProfileStatus, // Hardcoded status
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    console.log(`UserActions: Attempting to create Firestore profile for UID: ${uid} in 'user_profiles' collection.`);
    console.log(`UserActions: Data to be saved (profileToSave):`, JSON.stringify(profileToSave, null, 2));
    
    // These console logs help you verify data against your Firestore rule conditions
    console.log(`UserActions: Checking conditions relevant to Firestore 'create' rule for /user_profiles/{uid}:`);
    console.log(`UserActions:   - Input UID for doc ID: ${uid}`);
    console.log(`UserActions:   - profileToSave.uid (request.resource.data.uid): ${profileToSave.uid}`);
    console.log(`UserActions:   - Does profileToSave.uid match input uid? ${profileToSave.uid === uid}`);
    console.log(`UserActions:   - profileToSave.status (request.resource.data.status): ${profileToSave.status}`);
    console.log(`UserActions:   - Is profileToSave.status === 'pending_approval'? ${profileToSave.status === 'pending_approval'}`);
    console.log(`UserActions:   - profileToSave.email (request.resource.data.email): ${profileToSave.email}`);
    // Note: To fully check against `request.auth.token.email`, you'd compare `profileToSave.email` 
    // with the email of the user who just signed up, which `data.email` should represent.

    await setDoc(userProfileRef, profileToSave);
    console.log(`UserActions: Successfully created Firestore profile for UID: ${uid} in 'user_profiles'.`);
    return { success: true };
  } catch (error: any) {
    console.error(`UserActions: Error creating user profile in Firestore for UID ${uid} (collection 'user_profiles'):`, error.message, error.code, error.stack);
    let errorMessage = 'Failed to create user profile.';
    if (error.message && error.message.toLowerCase().includes('permission-denied')) {
        errorMessage = `Permission denied by Firestore. Please check your Firestore security rules for the 'user_profiles' collection and ensure they allow profile creation (e.g., with 'pending_approval' status and matching UIDs). Also, review server logs for details on the data being sent. Firestore error code: ${error.code}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
