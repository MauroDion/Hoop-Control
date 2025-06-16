'use server';

import type { Club } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';

// In a real application, these clubs would be managed in Firestore by a super_admin.
const MOCK_CLUBS: Club[] = [
  { id: 'club_alpha', name: 'Club Alpha', approved: true },
  { id: 'club_beta', name: 'Club Beta', approved: true },
  { id: 'club_gamma', name: 'Club Gamma', approved: true },
  { id: 'club_delta', name: 'Club Delta (Pending)', approved: false }, // Example of a non-approved club
];

export async function getApprovedClubs(): Promise<Club[]> {
  // Simulate fetching from Firestore for now.
  // Replace with actual Firestore query when club management is implemented.
  try {
    // This is how you would fetch approved clubs from Firestore:
    // const clubsCollectionRef = collection(db, 'clubs');
    // const q = query(clubsCollectionRef, where('approved', '==', true));
    // const querySnapshot = await getDocs(q);
    // const approvedClubs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
    // return approvedClubs;

    // For now, return mock data:
    return MOCK_CLUBS.filter(club => club.approved);
  } catch (error) {
    console.error('Error fetching approved clubs:', error);
    return []; // Return empty array on error
  }
}
