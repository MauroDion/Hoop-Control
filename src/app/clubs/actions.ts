'use server';

import type { Club } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

// No longer using MOCK_CLUBS
// const MOCK_CLUBS: Club[] = [
//   { id: 'club_alpha', name: 'Club Alpha', approved: true },
//   { id: 'club_beta', name: 'Club Beta', approved: true },
//   { id: 'club_gamma', name: 'Club Gamma', approved: true },
//   { id: 'club_delta', name: 'Club Delta (Pending)', approved: false },
// ];

export async function getApprovedClubs(): Promise<Club[]> {
  try {
    const clubsCollectionRef = collection(db, 'clubs');
    // Query for clubs that are approved and order them by name
    const q = query(clubsCollectionRef, where('approved', '==', true), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const approvedClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        approved: data.approved,
        // Add other fields from Club type if they exist in Firestore
        // createdAt: data.createdAt, 
      } as Club;
    });
    
    return approvedClubs;
  } catch (error) {
    console.error('Error fetching approved clubs from Firestore:', error);
    return []; // Return empty array on error
  }
}
