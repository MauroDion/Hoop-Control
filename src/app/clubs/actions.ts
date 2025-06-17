
'use server';

import type { Club } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; // orderBy still imported but not used in the simplified query

export async function getApprovedClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch clubs from Firestore (simplified query - no ordering).");
  try {
    const clubsCollectionRef = collection(db, 'clubs');
    // TEMPORARILY REMOVED orderBy for diagnostics.
    // Original query: const q = query(clubsCollectionRef, orderBy('name', 'asc'));
    const q = query(clubsCollectionRef); // Simplified query
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("ClubActions: No documents found in 'clubs' collection (simplified query). Check collection content and Firestore rules.");
      return [];
    }
    
    console.log(`ClubActions: Found ${querySnapshot.docs.length} documents in 'clubs' collection (simplified query).`);
    
    const allClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure 'name' field exists and is a string, otherwise provide a fallback.
      const clubName = data.name && typeof data.name === 'string' ? data.name : 'Unnamed Club (Data Error)';
      if (!(data.name && typeof data.name === 'string')) {
        console.warn(`ClubActions: Club with ID ${doc.id} has missing or invalid 'name' field. Data:`, data);
      }
      return {
        id: doc.id,
        name: clubName,
        // The 'approved' field is not used for filtering in this registration context.
        approved: data.approved === undefined ? undefined : Boolean(data.approved), 
      } as Club;
    });
    
    console.log("ClubActions: Successfully fetched and mapped clubs (simplified query):", allClubs);
    return allClubs;
  } catch (error) {
    console.error('ClubActions: Error fetching clubs from Firestore (simplified query):', error);
    return []; // Return empty array on error
  }
}

