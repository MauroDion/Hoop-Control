'use server';
import { adminDb } from '@/lib/firebase/admin';
import type { Season } from '@/types';

export async function getSeasons(): Promise<Season[]> {
    if (!adminDb) return [];
    try {
        const seasonsRef = adminDb.collection('seasons');
        const snapshot = await seasonsRef.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Season));
    } catch (error) {
        console.error("Error fetching seasons: ", error);
        return [];
    }
}
