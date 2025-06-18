
'use server';

import { db } from '@/lib/firebase/client';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus } from '@/types';

interface CreateUserFirestoreProfileData {
  email: string | null;
  displayName: string | null;
  profileType: ProfileType; // This comes from the form, maps to profileTypeId
  selectedClubId: string; // This comes from the form, maps to clubId
  photoURL?: string | null;
}

export async function createUserFirestoreProfile(
  uid: string,
  data: CreateUserFirestoreProfileData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use 'user_profiles' collection and map fields correctly
    const userProfileRef = doc(db, 'user_profiles', uid);
    
    // Construct the object to save with Firestore field names
    const profileToSave = {
        uid: uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        profileTypeId: data.profileType, // Map from form data
        clubId: data.selectedClubId, // Map from form data
        status: 'pending_approval' as UserProfileStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    console.log(`UserActions: Attempting to create Firestore profile for UID: ${uid} in 'user_profiles' collection.`);
    console.log(`UserActions: Data to be saved (profileToSave):`, JSON.stringify(profileToSave, null, 2));
    console.log(`UserActions: Checking conditions relevant to Firestore 'create' rule for /user_profiles/{userId}:`);
    console.log(`UserActions:   - Input UID for doc ID: ${uid}`);
    console.log(`UserActions:   - profileToSave.uid: ${profileToSave.uid}`);
    console.log(`UserActions:   - profileToSave.status: ${profileToSave.status}`);
    console.log(`UserActions:   - profileToSave.email: ${profileToSave.email}`);


    await setDoc(userProfileRef, profileToSave);
    console.log(`UserActions: Successfully created Firestore profile for UID: ${uid} in 'user_profiles'.`);
    return { success: true };
  } catch (error: any) {
    console.error(`UserActions: Error creating user profile in Firestore for UID ${uid} (collection 'user_profiles'):`, error.message, error.code, error.stack);
    let errorMessage = 'Failed to create user profile.';
    if (error.message) {
        errorMessage = error.message;
    }
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission-denied'))) {
        errorMessage = 'Permission denied. Please check Firestore security rules for creating documents in the "user_profiles" collection. Ensure the user has rights and the data meets rule conditions (e.g., status is "pending_approval" and UID matches).';
         console.error("UserActions: Firestore permission denied. This usually means the security rules for the 'user_profiles' collection are not allowing this write operation, or the data being sent does not meet the rule conditions (e.g. 'status' field, UID match, correct collection path in rules).");
    }
    return { success: false, error: errorMessage };
  }
}

