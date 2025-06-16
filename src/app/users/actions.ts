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
    const newUserProfile: Omit<UserFirestoreProfile, 'uid'> & { status: UserProfileStatus; createdAt: Timestamp; updatedAt: Timestamp } = {
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL || null,
      profileType: data.profileType,
      selectedClubId: data.selectedClubId,
      status: 'pending_approval', // Default status
      createdAt: serverTimestamp() as Timestamp, // Will be set by Firestore
      updatedAt: serverTimestamp() as Timestamp, // Will be set by Firestore
    };

    // Firestore `setDoc` will set the timestamps on the server.
    // To avoid type errors with `serverTimestamp()` client-side, we cast to Timestamp for the type,
    // but the actual value passed to Firestore is the serverTimestamp() function.
    // However, for direct object creation where type checking is strict before sending to Firestore,
    // it's often easier to let Firestore handle createdAt/updatedAt entirely via rules or server-side triggers if possible,
    // or omit them from the strict client-side type if they are truly server-generated.
    // For this action, we'll prepare the object and rely on setDoc with serverTimestamp.

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

    await setDoc(userProfileRef, profileToSave);
    return { success: true };
  } catch (error: any) {
    console.error('Error creating user profile in Firestore:', error);
    return { success: false, error: error.message || 'Failed to create user profile.' };
  }
}
