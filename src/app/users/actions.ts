
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
    
    const profileToSave = {
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || null,
        profileType: data.profileType,
        selectedClubId: data.selectedClubId,
        status: 'pending_approval' as UserProfileStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    console.log(`UserActions: Attempting to create Firestore profile for UID: ${uid} with data:`, JSON.stringify(profileToSave, null, 2));

    await setDoc(userProfileRef, profileToSave);
    console.log(`UserActions: Successfully created Firestore profile for UID: ${uid}`);
    return { success: true };
  } catch (error: any) {
    console.error(`UserActions: Error creating user profile in Firestore for UID ${uid}:`, error.message, error.code, error.stack);
    // Extract a more specific error message if available, otherwise default
    let errorMessage = 'Failed to create user profile.';
    if (error.message) {
        errorMessage = error.message;
    }
    if (error.code) {
        errorMessage = `${error.code}: ${errorMessage}`;
    }
    return { success: false, error: errorMessage };
  }
}

