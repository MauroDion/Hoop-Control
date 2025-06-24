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
            } as Season;
        });
    } catch (error) {
        console.error("Error fetching seasons: ", error);
        return [];
    }
}

export async function createSeason(formData: SeasonFormData, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized' };
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
        const newSeason = {
            ...formData,
            createdBy: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await adminDb.collection('seasons').add(newSeason);
        revalidatePath('/seasons');
        return { success: true };
    } catch (error: any) {
        console.error("Error creating season:", error);
        return { success: false, error: error.message };
    }
}
