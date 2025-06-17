
'use server';

import type { Club } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query } from 'firebase/firestore';

export async function getApprovedClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch clubs from Firestore (simplified query - no ordering).");
  try {
    const clubsCollectionRef = collection(db, 'clubs');
    // Simplified query without orderBy for diagnostics
    const q = query(clubsCollectionRef);
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("ClubActions: No documents found in 'clubs' collection (simplified query). Check collection content and Firestore rules.");
      return [];
    }
    
    console.log(`ClubActions: Found ${querySnapshot.docs.length} documents in 'clubs' collection (simplified query).`);
    
    const allClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure 'name' field exists and is a string, otherwise provide a fallback and log.
      const clubName = typeof data.name === 'string' && data.name.trim() !== '' ? data.name : `Unnamed Club (ID: ${doc.id})`;
      if (!(typeof data.name === 'string' && data.name.trim() !== '')) {
        console.warn(`ClubActions: Club with ID ${doc.id} has missing, empty, or invalid 'name' field. Data:`, data);
      }
      return {
        id: doc.id,
        name: clubName,
        // The 'approved' field is not used for filtering here.
        // It might be part of the Club type for other uses, so keep it if defined.
        approved: data.approved === undefined ? undefined : Boolean(data.approved), 
      } as Club; // Cast to Club, ensure your Club type matches what you expect
    });
    
    console.log("ClubActions: Successfully fetched and mapped clubs (simplified query):", JSON.stringify(allClubs, null, 2));
    return allClubs;
  } catch (error: any) {
    console.error('ClubActions: Error fetching clubs from Firestore (simplified query):', error.message, error.stack);
    return []; // Return empty array on error
  }
}
