'use server';

import type { GameFormat, GameFormatFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

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
    
    allGameFormats.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    console.log("GameFormatActions: Successfully fetched and sorted game formats using Admin SDK.");
    return allGameFormats;
  } catch (error: any) {
    console.error('GameFormatActions: Error fetching game formats with Admin SDK:', error.message, error.stack);
    return [];
  }
}

export async function createGameFormat(
  formData: GameFormatFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  try {
    const newFormatData = {
      ...formData,
      numPeriods: Number(formData.numPeriods) || null,
      periodDurationMinutes: Number(formData.periodDurationMinutes) || null,
      defaultTotalTimeouts: Number(formData.defaultTotalTimeouts) || null,
      minPeriodsPlayerMustPlay: Number(formData.minPeriodsPlayerMustPlay) || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('gameFormats').add(newFormatData);
    revalidatePath('/admin/game-formats');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating game format:', error);
    return { success: false, error: error.message || 'Failed to create format.' };
  }
}

export async function updateGameFormat(
    formatId: string,
    formData: GameFormatFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    
    try {
        const formatRef = adminDb.collection('gameFormats').doc(formatId);
        const updateData = {
            ...formData,
            numPeriods: Number(formData.numPeriods) || null,
            periodDurationMinutes: Number(formData.periodDurationMinutes) || null,
            defaultTotalTimeouts: Number(formData.defaultTotalTimeouts) || null,
            minPeriodsPlayerMustPlay: Number(formData.minPeriodsPlayerMustPlay) || null,
        };
        await formatRef.update(updateData);
        revalidatePath('/admin/game-formats');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating format ${formatId}:`, error);
        return { success: false, error: error.message || 'Failed to update format.' };
    }
}

export async function deleteGameFormat(formatId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    try {
        await adminDb.collection('gameFormats').doc(formatId).delete();
        revalidatePath('/admin/game-formats');
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting format ${formatId}:`, error);
        return { success: false, error: error.message || 'Failed to delete format.' };
    }
}
