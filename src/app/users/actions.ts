'use server';

import admin, { adminAuth, adminDb, adminInitError } from '@/lib/firebase/admin';
import type { UserFirestoreProfile, ProfileType, UserProfileStatus } from '@/types';
import { revalidatePath } from 'next/cache';

export async function finalizeNewUserProfile(
  idToken: string,
  data: { profileType: ProfileType; selectedClubId: string; displayName: string; }
): Promise<{ success: boolean; error?: string }> {
  if (!adminAuth || !adminDb) {
    console.error("UserActions (finalize): Firebase Admin SDK not initialized. Error:", adminInitError);
    return { success: false, error: `Server configuration error: ${adminInitError || 'Unknown admin SDK error.'}` };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    await adminAuth.updateUser(uid, { displayName: data.displayName });
    
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const profileToSave: any = {
        uid: uid,
        email: decodedToken.email,
        displayName: data.displayName,
        photoURL: decodedToken.picture || null,
        profileTypeId: data.profileType,
        clubId: data.selectedClubId,
        status: 'pending_approval' as UserProfileStatus,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await userProfileRef.set(profileToSave);
    
    return { success: true };

  } catch (error: any) {
    console.error(`UserActions (finalize): Error finalizing user profile. Error code: ${error.code}. Message: ${error.message}`);
    return { success: false, error: `Failed to finalize profile on server: ${error.message}` };
  }
}


export async function getUserProfileById(uid: string): Promise<UserFirestoreProfile | null> {
  if (!adminDb) {
    console.error("UserActions (getProfile): Firebase Admin SDK not initialized. Error:", adminInitError);
    return null;
  }
  
  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    const docSnap = await userProfileRef.get();

    if (docSnap.exists) {
      const data = docSnap.data()!;
      return { 
        uid: docSnap.id, 
        ...data,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
       } as UserFirestoreProfile;
    } else {
      console.warn(`UserActions: No profile found for UID: ${uid} using Admin SDK.`);
      return null;
    }
  } catch (error: any) {
    console.error(`UserActions: Error fetching user profile for UID ${uid} with Admin SDK:`, error.message, error.stack);
    return null;
  }
}

export async function getAllUserProfiles(): Promise<UserFirestoreProfile[]> {
  if (!adminDb) return [];
  try {
    const usersCollectionRef = adminDb.collection('user_profiles');
    const q = usersCollectionRef.orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) return [];
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
      } as UserFirestoreProfile;
    });
  } catch (error: any) {
    console.error('AdminUserManagementActions: Error fetching all user profiles with Admin SDK:', error.message, error.stack);
    return [];
  }
}

export async function updateUserProfileStatus(
  uid: string,
  status: UserProfileStatus
): Promise<{ success: boolean; error?: string }> {
  if (!uid || !status) return { success: false, error: 'UID and new status are required.' };
  if (!adminDb) return { success: false, error: 'Server configuration error.' };

  try {
    const userProfileRef = adminDb.collection('user_profiles').doc(uid);
    await userProfileRef.update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    revalidatePath('/admin/user-management');
    return { success: true };
  } catch (error: any) {
    console.error(`AdminUserManagementActions: Error updating status for UID ${uid}:`, error.message, error.stack);
    return { success: false, error: error.message || 'Failed to update user status.' };
  }
}


export async function getUsersByProfileTypeAndClub(
  profileType: ProfileType,
  clubId: string
): Promise<UserFirestoreProfile[]> {
  if (!adminDb) return [];
  try {
    const usersRef = adminDb.collection('user_profiles');
    const q = usersRef.where('clubId', '==', clubId).where('profileTypeId', '==', profileType).where('status', '==', 'approved');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) return [];
    
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
      } as UserFirestoreProfile;
    });

    users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    return users;

  } catch (error: any) {
    console.error(`Error fetching users by profile type '${profileType}' for club '${clubId}':`, error.message);
    return [];
  }
}
