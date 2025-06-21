
'use server';

import type { Club, ClubFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function createClub(
  formData: ClubFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  if (!adminDb) {
    const errorMessage = "Firebase Admin SDK is not initialized. Club creation cannot proceed.";
    console.error("ClubActions (createClub):", errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newClubData = {
      ...formData,
      approved: true, // Clubs created by super_admin are auto-approved
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('clubs').add(newClubData);
    revalidatePath('/clubs'); // Revalidate the clubs list page
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating club:', error);
    return { success: false, error: error.message || 'Failed to create club.' };
  }
}

export async function getClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch all clubs from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("ClubActions (getClubs): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const clubsCollectionRef = adminDb.collection('clubs');
    const querySnapshot = await clubsCollectionRef.get();

    if (querySnapshot.empty) {
      console.warn("ClubActions: No documents found in 'clubs' collection.");
      return [];
    }
    
    console.log(`ClubActions: Found ${querySnapshot.docs.length} documents in 'clubs' collection.`);
    
    const allClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const clubName = typeof data.name === 'string' && data.name.trim() !== '' ? data.name : `Unnamed Club (ID: ${doc.id})`;
      if (!(typeof data.name === 'string' && data.name.trim() !== '')) {
        console.warn(`ClubActions: Club with ID ${doc.id} has missing, empty, or invalid 'name' field. Data:`, data);
      }
      return {
        id: doc.id,
        name: clubName,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
      } as Club;
    });
    
    console.log("ClubActions: Successfully fetched and mapped all clubs using Admin SDK.");
    return allClubs;
  } catch (error: any) {
    console.error('ClubActions: Error fetching all clubs from Firestore with Admin SDK:', error.message, error.stack);
    return [];
  }
}

export async function getApprovedClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch only approved clubs from Firestore using Admin SDK.");
   if (!adminDb) {
    console.warn("ClubActions (getApprovedClubs): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const clubsCollectionRef = adminDb.collection('clubs');
    // This query may require a Firestore index on the 'approved' field.
    const q = clubsCollectionRef.where("approved", "==", true); 
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.warn("ClubActions: No approved clubs found in 'clubs' collection.");
      return [];
    }
    
    console.log(`ClubActions: Found ${querySnapshot.docs.length} approved clubs.`);
    
    const approvedClubs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const clubName = typeof data.name === 'string' && data.name.trim() !== '' ? data.name : `Unnamed Club (ID: ${doc.id})`;
      if (!(typeof data.name === 'string' && data.name.trim() !== '')) {
        console.warn(`ClubActions: Club with ID ${doc.id} has missing, empty, or invalid 'name' field. Data:`, data);
      }
      return {
        id: doc.id,
        name: clubName,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
      } as Club;
    });
    
    console.log("ClubActions: Successfully fetched and mapped approved clubs using Admin SDK.");
    return approvedClubs;
  } catch (error: any) {
    console.error('ClubActions: Error fetching approved clubs from Firestore with Admin SDK:', error.message, error.stack);
     if (error.code === 'failed-precondition') {
        console.error("ClubActions: Firestore query for approved clubs failed. This is likely due to a missing Firestore index. Please create an index on the 'approved' field for the 'clubs' collection in your Firebase console.");
    }
    return [];
  }
}
