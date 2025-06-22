
'use server';

import type { Season, SeasonFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function createSeason(
  formData: SeasonFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  // Add role check for SUPER_ADMIN here if profile is available
  // For now, we assume the UI layer has performed this check.

  if (!adminDb) {
    return { success: false, error: 'Firebase Admin SDK not initialized.' };
  }

  try {
    const newSeasonData = {
      ...formData,
      startDate: admin.firestore.Timestamp.fromDate(new Date(formData.startDate)),
      endDate: admin.firestore.Timestamp.fromDate(new Date(formData.endDate)),
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('seasons').add(newSeasonData);
    revalidatePath('/seasons');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating season:', error);
    return { success: false, error: error.message || 'Failed to create season.' };
  }
}

export async function getSeasons(): Promise<Season[]> {
  if (!adminDb) {
    console.warn("SeasonsActions: Admin SDK not available.");
    return [];
  }
  try {
    const seasonsCollectionRef = adminDb.collection('seasons').orderBy('startDate', 'desc');
    const querySnapshot = await seasonsCollectionRef.get();
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const allSeasons = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        createdAt: data.createdAt?.toDate(),
      } as Season;
    });
    
    return allSeasons;
  } catch (error: any) {
    console.error('Error fetching seasons:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("Firestore query failed. This is likely due to a missing Firestore index. Please create an index on the 'startDate' field (descending) for the 'seasons' collection.");
    }
    return [];
  }
}

export async function getSeasonById(seasonId: string): Promise<Season | null> {
  if (!adminDb) {
    console.warn("SeasonsActions (getSeasonById): Admin SDK not available.");
    return null;
  }
  if (!seasonId) {
    console.warn("SeasonsActions (getSeasonById): seasonId is required.");
    return null;
  }
  try {
    const seasonDocRef = adminDb.collection('seasons').doc(seasonId);
    const docSnap = await seasonDocRef.get();

    if (!docSnap.exists) {
      console.warn(`SeasonsActions: No season found with ID: ${seasonId}`);
      return null;
    }
    
    const data = docSnap.data()!;
    return {
      id: docSnap.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt?.toDate(),
    } as Season;
  } catch (error: any) {
    console.error(`SeasonsActions: Error fetching season by ID ${seasonId}:`, error.message, error.stack);
    return null;
  }
}
