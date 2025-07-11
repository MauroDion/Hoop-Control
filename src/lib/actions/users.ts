
'use server';

import { v4 as uuidv4 } from 'uuid';
import { adminAuth, adminDb, adminInitError } from '@/lib/firebase/admin';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus, Child } from '@/types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

// This new server action uses the Admin SDK to securely create the user profile,
// bypassing client-side security rules which are a common point of failure.
export async function finalizeNewUserProfile(
  idToken: string,
  data: { profileType: ProfileType; selectedClubId: string | null; displayName: string; }
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
    const profileToSave: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        uid: uid,
        email: decodedToken.email,
        displayName: data.displayName,
        photoURL: decodedToken.picture || null,
        profileTypeId: data.profileType,
        clubId: data.selectedClubId,
        status: 'pending_approval' as UserProfileStatus,
        isSeeded: false,
        onboardingCompleted: true, // Mark as completed since they filled the main form
    };
    
    await userProfileRef.set({...profileToSave, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log(`UserActions (finalize): Successfully created Firestore profile for UID: ${uid}`);
    
    return { success: true };

  } catch (error: any) {
    console.error(`UserActions (finalize): Error finalizing user profile. Error code: ${error.code}. Message: ${error.message}`);
    return { success: false, error: `Failed to finalize profile on server: ${error.message}` };
  }
}

export async function updateUserChildren(userId: string, children: Child[]): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) {
        return { success: false, error: 'La base de datos no está inicializada.' };
    }
    try {
        const profileRef = adminDb.collection('user_profiles').doc(userId);
        await profileRef.update({
            children: children,
            onboardingCompleted: true, // Mark onboarding as complete once children are added/updated
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        revalidatePath('/profile/my-children');
        return { success: true };
    } catch(err: any) {
        return { success: false, error: "No se pudo actualizar la información."};
    }
}


export async function getUserProfileById(uid: string): Promise<UserFirestoreProfile | null> {
  if (!adminDb) {
    console.error("UserActions (getProfile): Firebase Admin SDK not initialized. Error:", adminInitError);
    return null;
  }
  
  if (!uid) return null;

  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const docSnap = await userProfileRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() as any;
      
      const serializableProfile = {
        ...data,
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString(),
      };

      return { uid: docSnap.id, ...serializableProfile } as UserFirestoreProfile;
    } else {
      console.warn(`UserActions: No profile found for UID: ${uid} using Admin SDK.`);
      return null;
    }
  } catch (error: any) {
    console.error(`UserActions: Error fetching user profile for UID ${uid} with Admin SDK:`, error.message, error.stack);
    return null;
  }
}

export async function getUsersByProfileTypeAndClub(
  profileType: ProfileType,
  clubId: string
): Promise<UserFirestoreProfile[]> {
  if (!adminDb) {
    console.error("UserActions (getUsersByProfileTypeAndClub): Admin SDK not initialized.");
    return [];
  }
  try {
    const usersRef = adminDb.collection('user_profiles');
    const q = usersRef.where('clubId', '==', clubId).where('profileTypeId', '==', profileType).where('status', '==', 'approved');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: (data.createdAt as admin.firestore.Timestamp).toDate().toISOString(),
        updatedAt: (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString(),
      } as UserFirestoreProfile;
    });

    users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    return users;

  } catch (error: any) {
    console.error(`Error fetching users by profile type '${profileType}' for club '${clubId}':`, error.message);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("Firestore query failed. This is likely due to a missing composite index. Please create an index on 'clubId', 'profileTypeId', and 'status' for the 'user_profiles' collection.");
    }
    return [];
  }
}
