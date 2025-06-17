
'use server';

import type { ProfileTypeOption, ProfileType } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// Helper function to check if a string is a valid ProfileType defined in src/types/index.ts
function isValidProfileType(id: string): id is ProfileType {
  const validTypes: ProfileType[] = ['club_admin', 'coach', 'player', 'parent_guardian', 'other'];
  return validTypes.includes(id as ProfileType);
}

export async function getProfileTypeOptions(): Promise<ProfileTypeOption[]> {
  console.log("ProfileTypeActions: Attempting to fetch profile types from Firestore collection 'profileTypes'.");
  try {
    const profileTypesCollectionRef = collection(db, 'profileTypes');
    // Order by label for consistent dropdown order
    const q = query(profileTypesCollectionRef, orderBy('label', 'asc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("ProfileTypeActions: No documents found in 'profileTypes' collection. Ensure this collection exists and contains documents with 'id' (e.g., 'club_admin') and 'label' (e.g., 'Club Admin') fields. Check Firestore rules for read access.");
      return [];
    }
    
    console.log(`ProfileTypeActions: Found ${querySnapshot.docs.length} documents in 'profileTypes' collection.`);
    
    const allProfileTypes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure 'id' and 'label' fields exist
      const typeId = data.id;
      const typeLabel = data.label;
      
      if (typeof typeId !== 'string' || !typeId.trim()) {
        console.warn(`ProfileTypeActions: Document with Firestore ID ${doc.id} has missing or invalid 'id' field. Data:`, data);
        return null; // Skip this invalid entry
      }
      if (!isValidProfileType(typeId)) {
        console.warn(`ProfileTypeActions: Document with Firestore ID ${doc.id} has an 'id' ("${typeId}") that is not a valid ProfileType as defined in src/types. Data:`, data);
        return null; // Skip this invalid entry
      }
      if (typeof typeLabel !== 'string' || !typeLabel.trim()) {
         console.warn(`ProfileTypeActions: Document with Firestore ID ${doc.id} (Type ID: ${typeId}) has missing or empty 'label' field. Data:`, data);
         // We can provide a fallback label if needed, or skip
         return { id: typeId as ProfileType, label: `Unnamed Type (ID: ${typeId})` };
      }

      return {
        id: typeId as ProfileType, // Cast to ProfileType after validation
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
