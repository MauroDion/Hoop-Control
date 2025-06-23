
'use server';

import type { Club, ClubFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

// This function will be used by the registration form to populate the clubs dropdown.
// It only fetches clubs that have been marked as 'approved' by a super_admin.
export async function getApprovedClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch approved clubs from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("ClubActions (getApprovedClubs): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const clubsCollectionRef = adminDb.collection('clubs');
    // Query for approved clubs and order them alphabetically by name
    const q = clubsCollectionRef.where('approved', '==', true).orderBy('name', 'asc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("ClubActions: No 'approved' clubs found in 'clubs' collection. A composite index on 'approved' (asc) and 'name' (asc) is required for this query to work.");
      return [];
    }
    
    console.log(`ClubActions: Found ${querySnapshot.docs.length} approved clubs.`);
    
    const allClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Club (ID: ${doc.id})`,
        shortName: data.shortName,
        province_name: data.province_name,
        city_name: data.city_name,
        logoUrl: data.logoUrl,
        approved: data.approved,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
      } as Club; 
    });
    
    console.log("ClubActions: Successfully fetched and sorted approved clubs using Admin SDK.");
    return allClubs;
  } catch (error: any) {
    console.error('ClubActions: Error fetching approved clubs with Admin SDK:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("ClubActions: Firestore query failed. This is likely due to a missing Firestore index. Please create a composite index on the 'clubs' collection for fields 'approved' (Ascending) and 'name' (Ascending).");
    }
    return []; // Return empty array on error
  }
}

// Action to create a new club (likely for an admin)
export async function createClub(
  formData: ClubFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  // In a real app, you would also check if the user has permission (e.g., is a super_admin)
  if (!adminDb) {
    return { success: false, error: 'Firebase Admin SDK not initialized.' };
  }
  try {
    const newClubData = {
      ...formData,
      approved: false, // New clubs should require approval
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('clubs').add(newClubData);
    revalidatePath('/clubs'); // Revalidate admin clubs page if it exists
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating club:', error);
    return { success: false, error: error.message || 'Failed to create club.' };
  }
}
