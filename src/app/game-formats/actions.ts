
'use server';

import type { GameFormat, GameFormatFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function createGameFormat(
  formData: GameFormatFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!adminDb) {
    return { success: false, error: 'Firebase Admin SDK not initialized.' };
  }

  try {
    const newFormatData = {
      ...formData,
      numPeriods: formData.numPeriods ? Number(formData.numPeriods) : null,
      periodDurationMinutes: formData.periodDurationMinutes ? Number(formData.periodDurationMinutes) : null,
      defaultTotalTimeouts: formData.defaultTotalTimeouts ? Number(formData.defaultTotalTimeouts) : null,
      minPeriodsPlayerMustPlay: formData.minPeriodsPlayerMustPlay ? Number(formData.minPeriodsPlayerMustPlay) : null,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('gameFormats').add(newFormatData);
    revalidatePath('/admin/game-formats');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating game format:', error);
    return { success: false, error: error.message || 'Failed to create game format.' };
  }
}


export async function getGameFormats(): Promise<GameFormat[]> {
  console.log("GameFormatActions: Attempting to fetch game formats from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("GameFormatActions (getGameFormats): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const gameFormatsCollectionRef = adminDb.collection('gameFormats');
    const querySnapshot = await gameFormatsCollectionRef.get();

    if (querySnapshot.empty) {
      console.warn("GameFormatActions: No documents found in 'gameFormats' collection.");
      return [];
    }
    
    console.log(`GameFormatActions: Found ${querySnapshot.docs.length} documents in 'gameFormats' collection.`);
    
    const allGameFormats = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Format (ID: ${doc.id})`,
        description: data.description,
        numPeriods: data.numPeriods,
        periodDurationMinutes: data.periodDurationMinutes,
        defaultTotalTimeouts: data.defaultTotalTimeouts,
        minPeriodsPlayerMustPlay: data.minPeriodsPlayerMustPlay,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
      } as GameFormat; 
    });
    
    // Sort the results alphabetically by name here in the action
    allGameFormats.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    console.log("GameFormatActions: Successfully fetched and sorted game formats using Admin SDK.");
    return allGameFormats;
  } catch (error: any) {
    console.error('GameFormatActions: Error fetching game formats with Admin SDK:', error.message, error.stack);
    return []; // Return empty array on error
  }
}
