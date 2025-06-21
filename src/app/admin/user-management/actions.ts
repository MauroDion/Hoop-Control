
'use server';

import { db } from '@/lib/firebase/client';
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { UserFirestoreProfile, UserProfileStatus } from '@/types';
import { revalidatePath } from 'next/cache';

// IMPORTANT: These actions assume that Firestore security rules are in place
// to ensure only authorized users (e.g., SUPER_ADMIN) can execute them.

export async function getAllUserProfiles(): Promise<UserFirestoreProfile[]> {
  console.log("AdminUserManagementActions: Attempting to fetch all user profiles from 'user_profiles', ordered by createdAt desc.");
  try {
    const usersCollectionRef = collection(db, 'user_profiles');
    // Order by creation date, newest first, as an example.
    // Firestore rules must allow this list operation by an admin.
    const q = query(usersCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("AdminUserManagementActions: No documents found in 'user_profiles' collection.");
      return [];
    }
    
    console.log(`AdminUserManagementActions: Found ${querySnapshot.docs.length} user profiles.`);
    
    const allProfiles = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Timestamps to serializable JS Date objects
      const serializableData = {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      };
      return {
        uid: doc.id,
        ...serializableData,
      } as UserFirestoreProfile;
    });
    
    console.log("AdminUserManagementActions: Successfully fetched all user profiles.");
    return allProfiles;
  } catch (error: any) {
    console.error('AdminUserManagementActions: Error fetching all user profiles:', error.message, error.stack);
    // In a real app, you might want to check error.code for 'permission-denied'
    // and log more specific advice if Firestore rules are the issue.
    if (error.code === 'permission-denied') {
        console.error("AdminUserManagementActions: PERMISSION DENIED. Ensure Firestore rules allow admin to list 'user_profiles'.");
    } else if (error.message && error.message.includes("index")) {
        console.error("AdminUserManagementActions: Firestore query failed. This is likely due to a missing Firestore index for ordering by 'createdAt' (desc) on the 'user_profiles' collection. Please create this index in your Firebase console.");
    }
    return []; // Return empty array on error, or throw the error
  }
}

export async function updateUserProfileStatus(
  uid: string,
  status: UserProfileStatus
): Promise<{ success: boolean; error?: string }> {
  console.log(`AdminUserManagementActions: Attempting to update status for UID: ${uid} to '${status}'.`);
  if (!uid || !status) {
    return { success: false, error: 'UID and new status are required.' };
  }

  try {
    const userProfileRef = doc(db, 'user_profiles', uid);
    await updateDoc(userProfileRef, {
      status: status,
      updatedAt: serverTimestamp(),
    });
    console.log(`AdminUserManagementActions: Successfully updated status for UID: ${uid} to '${status}'.`);
    revalidatePath('/admin/user-management'); // Revalidate the admin page to show updated data
    return { success: true };
  } catch (error: any) {
    console.error(`AdminUserManagementActions: Error updating status for UID ${uid}:`, error.message, error.stack);
     if (error.code === 'permission-denied') {
        console.error("AdminUserManagementActions: PERMISSION DENIED. Ensure Firestore rules allow admin to update 'status' field in 'user_profiles'.");
        return { success: false, error: 'Permission denied by Firestore rules.' };
    }
    return { success: false, error: error.message || 'Failed to update user status.' };
  }
}
