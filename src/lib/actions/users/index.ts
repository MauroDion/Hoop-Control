'use server';

import { adminAuth, adminDb, adminInitError } from '@/lib/firebase/admin';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus, Child } from '@/types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

// Creates the initial user profile document right after Firebase Auth user creation
export async function createFirestoreUserProfile(
  uid: string,
  data: { email: string; displayName: string; photoURL: string | null; }
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: `Server configuration error: ${adminInitError || 'Unknown admin SDK error.'}` };
  }
  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const doc = await userProfileRef.get();
    if (doc.exists) {
        console.log(`Profile for UID ${uid} already exists. Skipping creation.`);
        return { success: true };
    }

    const profileToSave: Omit<UserFirestoreProfile, 'createdAt' | 'updatedAt' | 'id'> = {
      uid: uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      profileTypeId: null,
      clubId: null,
      status: 'pending_approval' as UserProfileStatus,
      isSeeded: false,
      onboardingCompleted: false,
    };

    await userProfileRef.set({
      ...profileToSave,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error(`Error creating Firestore user profile for UID ${uid}:`, error);
    return { success: false, error: error.message };
  }
}

// Updates an existing user profile with onboarding info (role, club)
export async function completeOnboardingProfile(
  idToken: string,
  data: { profileType: ProfileType; selectedClubId: string | null; }
): Promise<{ success: boolean; error?: string }> {
  if (!adminAuth || !adminDb) {
    return { success: false, error: `Server configuration error: ${adminInitError || 'Unknown admin SDK error.'}` };
  }
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    
    const isSuperAdmin = data.profileType === 'super_admin';

    const updateData: { [key: string]: any } = {
        profileTypeId: data.profileType,
        // Super admins do not belong to a club, so explicitly set to null.
        clubId: isSuperAdmin ? null : data.selectedClubId,
        // Mark onboarding as complete for roles that don't have further steps.
        // parent_guardian will have this set to false until they add a child.
        onboardingCompleted: data.profileType !== 'parent_guardian',
        // Super Admins are auto-approved upon completing this step.
        status: isSuperAdmin ? 'approved' : 'pending_approval',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await userProfileRef.update(updateData);
    return { success: true };
  } catch (error: any) {
    console.error(`Error completing onboarding for user:`, error);
    return { success: false, error: error.message };
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
