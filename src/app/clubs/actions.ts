'use server';

import type { Club } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export async function getApprovedClubs(): Promise<Club[]> {
  try {
    const clubsCollectionRef = collection(db, 'clubs');
    // Query for all clubs and order them by name
    // The filter "where('approved', '==', true)" has been removed to fetch all clubs.
    const q = query(clubsCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const allClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        // The 'approved' field for a club itself (if it exists in your Firestore model for clubs)
        // is distinct from user profile approval. We include it here if it's part of your Club type.
        approved: data.approved, 
        // Add other fields from Club type if they exist in Firestore
        // createdAt: data.createdAt, 
      } as Club;
    });
    
    return allClubs;
  } catch (error) {
    console.error('Error fetching clubs from Firestore:', error);
    return []; // Return empty array on error
  }
}
