'use server';

import { adminDb, adminInitError } from '@/lib/firebase/admin';
import type { UserFirestoreProfile } from '@/types';

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
