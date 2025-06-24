
'use server';

import type { Club, ClubFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

// This function will be used by the registration form to populate the clubs dropdown.
// It fetches all clubs to ensure new users can register.
// NOTE: The filter for `approved == true` has been temporarily removed to facilitate development.
export async function getApprovedClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch all clubs from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("ClubActions (getApprovedClubs): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const clubsCollectionRef = adminDb.collection('clubs');
    // Query for all clubs and order them alphabetically by name
    // The `where('approved', '==', true)` has been removed for now.
    const q = clubsCollectionRef.orderBy('name', 'asc');
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("ClubActions: No clubs found in 'clubs' collection. An index on 'name' (asc) may be required.");
      return [];
    }
    
    console.log(`ClubActions: Found ${querySnapshot.docs.length} clubs.`);
    
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
    
    console.log("ClubActions: Successfully fetched and sorted all clubs using Admin SDK.");
    return allClubs;
  } catch (error: any) {
    console.error('ClubActions: Error fetching clubs with Admin SDK:', error.message, error.stack);
    if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("ClubActions: Firestore query failed. This is likely due to a missing Firestore index. Please create an index on the 'name' field (ascending) for the 'clubs' collection.");
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

// New action to update club approval status
export async function updateClubStatus(
  clubId: string,
  approved: boolean
): Promise<{ success: boolean; error?: string }> {
  console.log(`ClubActions: Attempting to update approved status for club ID: ${clubId} to '${approved}'.`);
  if (!clubId) {
    return { success: false, error: 'Club ID is required.' };
  }

  if (!adminDb) {
    console.error("ClubActions: Firebase Admin SDK is not initialized.");
    return { success: false, error: 'Server configuration error.' };
  }

  try {
    const clubRef = adminDb.collection('clubs').doc(clubId);
    await clubRef.update({
      approved: approved
    });
    console.log(`ClubActions: Successfully updated approved status for club ID: ${clubId} to '${approved}'.`);
    revalidatePath('/clubs'); // Revalidate the admin page
    return { success: true };
  } catch (error: any) {
    console.error(`ClubActions: Error updating status for club ID ${clubId}:`, error.message, error.stack);
    return { success: false, error: error.message || 'Failed to update club status.' };
  }
}
