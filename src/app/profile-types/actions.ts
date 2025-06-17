
'use server';

import type { ProfileTypeOption, ProfileType } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// Helper function to check if a string is a valid ProfileType
function isValidProfileType(id: string): id is ProfileType {
  const validTypes: ProfileType[] = ['club_admin', 'coach', 'player', 'parent_guardian', 'other'];
  return validTypes.includes(id as ProfileType);
}

export async function getProfileTypeOptions(): Promise<ProfileTypeOption[]> {
  console.log("ProfileTypeActions: Attempting to fetch profile types from Firestore collection 'profileTypes'.");
  try {
    const profileTypesCollectionRef = collection(db, 'profileTypes');
    // Order by label for consistent dropdown order, assuming 'label' field exists
    const q = query(profileTypesCollectionRef, orderBy('label', 'asc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("ProfileTypeActions: No documents found in 'profileTypes' collection. Check collection content and Firestore rules. Ensure documents have 'id' and 'label' fields.");
      return [];
    }
    
    console.log(`ProfileTypeActions: Found ${querySnapshot.docs.length} documents in 'profileTypes' collection.`);
    
    const allProfileTypes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure 'id' and 'label' fields exist and 'id' is a valid ProfileType
      const typeId = typeof data.id === 'string' ? data.id : null;
      const typeLabel = typeof data.label === 'string' && data.label.trim() !== '' ? data.label : `Unnamed Type (Doc ID: ${doc.id})`;
      
      if (!typeId || !isValidProfileType(typeId)) {
        console.warn(`ProfileTypeActions: Document with ID ${doc.id} has missing, invalid, or non-ProfileType 'id' field. Data:`, data);
        return null; // Skip this invalid entry
      }
      if (!(typeof data.label === 'string' && data.label.trim() !== '')) {
         console.warn(`ProfileTypeActions: Document with ID ${doc.id} (Type ID: ${typeId}) has missing or empty 'label' field. Data:`, data);
      }

      return {
        id: typeId as ProfileType,
        label: typeLabel,
      };
    }).filter(Boolean) as ProfileTypeOption[]; // Filter out nulls and cast
    
    console.log("ProfileTypeActions: Successfully fetched and mapped profile types:", JSON.stringify(allProfileTypes, null, 2));
    return allProfileTypes;
  } catch (error: any) {
    console.error('ProfileTypeActions: Error fetching profile types from Firestore:', error.message, error.stack);
    // Check if the error message suggests a missing index for orderBy('label')
    if (error.message && error.message.includes("indexes?")) {
        console.error("ProfileTypeActions: Firestore query failed. This might be due to a missing index for ordering by 'label' on the 'profileTypes' collection. Please create this index in your Firestore settings.");
    }
    return []; // Return empty array on error
  }
}
