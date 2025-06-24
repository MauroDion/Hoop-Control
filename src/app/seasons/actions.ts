'use server';
import { adminDb } from '@/lib/firebase/admin';
import type { Season, SeasonFormData } from '@/types';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';

export async function getSeasons(): Promise<Season[]> {
    if (!adminDb) return [];
    try {
        const seasonsRef = adminDb.collection('seasons');
        const snapshot = await seasonsRef.orderBy('name', 'desc').get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
                updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
            } as Season;
        });
    } catch (error) {
        console.error("Error fetching seasons: ", error);
        return [];
    }
}

export async function getSeasonById(seasonId: string): Promise<Season | null> {
    if (!adminDb) return null;
    try {
        const seasonRef = adminDb.collection('seasons').doc(seasonId);
        const docSnap = await seasonRef.get();
        if (!docSnap.exists) {
            console.warn(`Could not find season with ID: ${seasonId}`);
            return null;
        }
        const data = docSnap.data()!;
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
            updatedAt: data.updatedAt ? data.updatedAt.toDate() : undefined,
        } as Season;
    } catch (error: any) {
        console.error(`Error fetching season by ID ${seasonId}:`, error);
        return null;
    }
}

export async function createSeason(formData: SeasonFormData, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
        const newSeason = {
            ...formData,
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await adminDb.collection('seasons').add(newSeason);
        revalidatePath('/seasons');
        return { success: true };
    } catch (error: any) {
        console.error("Error creating season:", error);
        return { success: false, error: error.message };
    }
}

export async function updateSeason(
    seasonId: string,
    formData: SeasonFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
        const seasonRef = adminDb.collection('seasons').doc(seasonId);
        const updateData = {
            ...formData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: userId,
        };
        await seasonRef.update(updateData);
        
        revalidatePath('/seasons');
        revalidatePath(`/seasons/${seasonId}/edit`);

        return { success: true };
    } catch (error: any) {
        console.error("Error updating season:", error);
        return { success: false, error: error.message };
    }
}
