
'use server';

import type { GameFormat } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export async function getGameFormats(): Promise<GameFormat[]> {
  console.log("GameFormatActions: Attempting to fetch game formats from Firestore, ordered by name.");
  try {
    const gameFormatsCollectionRef = collection(db, 'gameFormats');
    const q = query(gameFormatsCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("GameFormatActions: No documents found in 'gameFormats' collection. Check collection content, Firestore rules, and required index on 'name' (asc).");
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
    
    console.log("GameFormatActions: Successfully fetched game formats:", JSON.stringify(allGameFormats, null, 2));
    return allGameFormats;
  } catch (error: any) {
    console.error('GameFormatActions: Error fetching game formats:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("GameFormatActions: Firestore query failed. This is likely due to a missing Firestore index for ordering by 'name' on the 'gameFormats' collection. Please create this index in your Firebase console: Collection ID 'gameFormats', Field 'name', Order 'Ascending'.");
    }
    return []; // Return empty array on error
  }
}
