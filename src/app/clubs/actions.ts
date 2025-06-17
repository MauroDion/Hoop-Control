
'use server';

import type { Club } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export async function getApprovedClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch clubs from Firestore.");
  try {
    const clubsCollectionRef = collection(db, 'clubs');
    // Query for all clubs and order them by name
    // IMPORTANT: This query (orderBy('name')) requires a Firestore index on the 'name' field for the 'clubs' collection.
    // If the index is missing, this query may fail or return an empty list.
    // Check your Firestore console for index creation prompts if you see no clubs.
    const q = query(clubsCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("ClubActions: No documents found in 'clubs' collection or query returned empty (check indexes and Firestore rules).");
      return [];
    }
    
    console.log(`ClubActions: Found ${querySnapshot.docs.length} documents in 'clubs' collection.`);
    
    const allClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const clubName = data.name && typeof data.name === 'string' ? data.name : 'Unnamed Club (Data Error)';
      if (!(data.name && typeof data.name === 'string')) {
        console.warn(`ClubActions: Club with ID ${doc.id} has missing or invalid 'name' field. Data:`, data);
      }
      return {
        id: doc.id,
        name: clubName,
        // The 'approved' field might exist if you use it for other admin purposes,
        // but it's not used for filtering in this registration context.
        approved: data.approved === undefined ? undefined : Boolean(data.approved), 
      } as Club;
    });
    
    console.log("ClubActions: Successfully fetched and mapped clubs:", allClubs);
    return allClubs;
  } catch (error) {
    console.error('ClubActions: Error fetching clubs from Firestore:', error);
    // Consider if the error message itself should be propagated or if a generic error is better.
    // For instance, if it's a permissions error, it might be useful to know.
    // However, exposing raw error messages to the client should be done cautiously.
    // Since this is a server action, the console.error here is server-side.
    return []; // Return empty array on error to prevent client-side crashes.
  }
}
