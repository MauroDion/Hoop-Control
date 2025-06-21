
'use server';

import type { GameFormat } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query } from 'firebase/firestore';

export async function getGameFormats(): Promise<GameFormat[]> {
  console.log("GameFormatActions: Attempting to fetch game formats from Firestore.");
  try {
    const gameFormatsCollectionRef = collection(db, 'gameFormats');
    // Removed orderBy('name') to avoid needing a Firestore index. Sorting is now done in JS.
    const q = query(gameFormatsCollectionRef);
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("GameFormatActions: No documents found in 'gameFormats' collection. Check collection content and Firestore rules.");
      return [];
    }
    
    console.log(`GameFormatActions: Found ${querySnapshot.docs.length} documents in 'gameFormats' collection.`);
    
    const allGameFormats = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Format (ID: ${doc.id})`,
        // Include other fields as needed from GameFormat type if they are stored
        description: data.description,
        numPeriods: data.numPeriods,
        periodDurationMinutes: data.periodDurationMinutes,
        // ... add other fields
      } as GameFormat; 
    });
    
    // Sort the results alphabetically by name here in the action
    allGameFormats.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    console.log("GameFormatActions: Successfully fetched and sorted game formats:", JSON.stringify(allGameFormats, null, 2));
    return allGameFormats;
  } catch (error: any) {
    console.error('GameFormatActions: Error fetching game formats:', error.message, error.stack);
    // The previous index-related error is now less likely, but we keep the generic error handling.
    return []; // Return empty array on error
  }
}
