
'use server';

import type { GameFormat, GameFormatFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getGameFormats(): Promise<GameFormat[]> {
  if (!adminDb) {
    console.warn("GameFormatActions (getGameFormats): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const gameFormatsCollectionRef = adminDb.collection('gameFormats');
    const querySnapshot = await gameFormatsCollectionRef.orderBy('name').get();

    if (querySnapshot.empty) {
      return [];
    }
    
    const allGameFormats = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Formato sin nombre`,
        description: data.description || null,
        numPeriods: data.numPeriods || null,
        periodDurationMinutes: data.periodDurationMinutes || null,
        defaultTotalTimeouts: data.defaultTotalTimeouts || null,
        minPeriodsPlayerMustPlay: data.minPeriodsPlayerMustPlay || null,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : null,
        createdBy: data.createdBy || null,
      } as GameFormat; 
    });
    
    return allGameFormats;
  } catch (error: any) {
    console.error('GameFormatActions: Error fetching game formats with Admin SDK:', error.message, error.stack);
    return [];
  }
}

export async function getGameFormatById(formatId: string): Promise<GameFormat | null> {
    if (!adminDb || !formatId) return null;
    try {
        const docRef = adminDb.collection('gameFormats').doc(formatId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            return null;
        }
        const data = docSnap.data() as Omit<GameFormat, 'id' | 'createdAt'> & { createdAt: admin.firestore.Timestamp };
        return { 
            id: docSnap.id,
            name: data.name || 'Formato sin nombre',
            description: data.description || null,
            numPeriods: data.numPeriods || null,
            periodDurationMinutes: data.periodDurationMinutes || null,
            defaultTotalTimeouts: data.defaultTotalTimeouts || null,
            minPeriodsPlayerMustPlay: data.minPeriodsPlayerMustPlay || null,
            createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : null,
            createdBy: data.createdBy || null,
        } as GameFormat;
    } catch (error) {
        console.error(`Error getting game format by id ${formatId}:`, error);
        return null;
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
        const categoriesUsingFormat = await adminDb.collection('competitionCategories').where('gameFormatId', '==', formatId).limit(1).get();
        if(!categoriesUsingFormat.empty){
            return { success: false, error: "No se puede eliminar el formato porque está siendo utilizado por al menos una categoría de competición." };
        }

        await adminDb.collection('gameFormats').doc(formatId).delete();
        revalidatePath('/admin/game-formats');
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting format ${formatId}:`, error);
        return { success: false, error: error.message || 'Failed to delete format.' };
    }
}
