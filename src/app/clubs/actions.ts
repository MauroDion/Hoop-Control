
'use server';

import type { Club, ClubFormData } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function createClub(
  formData: ClubFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  // In a real app, you'd verify here if the user is a SUPER_ADMIN using Admin SDK
  // For now, we rely on the UI to only show the form to the right users.

  try {
    const newClubData = {
      ...formData,
      approved: true, // Clubs created by super_admin are auto-approved
      createdBy: userId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'clubs'), newClubData);
    revalidatePath('/clubs'); // Revalidate the clubs list page
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating club:', error);
    return { success: false, error: error.message || 'Failed to create club.' };
  }
}

export async function getClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch all clubs from Firestore.");
  try {
    const clubsCollectionRef = collection(db, 'clubs');
    const q = query(clubsCollectionRef);
    const querySnapshot = await getDocs(q);

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
      } as Club;
    });
    
    console.log("ClubActions: Successfully fetched and mapped all clubs.");
    return allClubs;
  } catch (error: any) {
    console.error('ClubActions: Error fetching all clubs from Firestore:', error.message, error.stack);
    return [];
  }
}

export async function getApprovedClubs(): Promise<Club[]> {
  console.log("ClubActions: Attempting to fetch only approved clubs from Firestore.");
  try {
    const clubsCollectionRef = collection(db, 'clubs');
    // This query may require a Firestore index on the 'approved' field.
    const q = query(clubsCollectionRef, where("approved", "==", true)); 
    const querySnapshot = await getDocs(q);

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
      } as Club;
    });
    
    console.log("ClubActions: Successfully fetched and mapped approved clubs.");
    return approvedClubs;
  } catch (error: any) {
    console.error('ClubActions: Error fetching approved clubs from Firestore:', error.message, error.stack);
     if (error.code === 'failed-precondition') {
        console.error("ClubActions: Firestore query for approved clubs failed. This is likely due to a missing Firestore index. Please create an index on the 'approved' field for the 'clubs' collection in your Firebase console.");
    }
    return [];
  }
}
