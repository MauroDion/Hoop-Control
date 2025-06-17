
'use server';

import type { ProfileTypeOption, ProfileType } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// Helper function to check if a string is a valid ProfileType defined in src/types/index.ts
// This function MUST be updated if the ProfileType enum in src/types/index.ts changes.
function isValidProfileType(id: string): id is ProfileType {
  const validTypes: ProfileType[] = [
    'club_admin', 
    'coach', 
    'coordinator', 
    'parent_guardian', 
    'player', 
    'scorer', 
    'super_admin', 
    'user'
  ];
  return validTypes.includes(id as ProfileType);
}

export async function getProfileTypeOptions(): Promise<ProfileTypeOption[]> {
  console.log("ProfileTypeActions: Attempting to fetch profile types from Firestore collection 'profileTypes'. Ordering by 'label' asc.");
  try {
    const profileTypesCollectionRef = collection(db, 'profileTypes');
    // Order by label for consistent dropdown order
    const q = query(profileTypesCollectionRef, orderBy('label', 'asc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("ProfileTypeActions: No documents found in 'profileTypes' collection. Ensure this collection exists, contains documents with a 'label' field, and that Firestore rules allow reading. An index on 'label' (asc) for 'profileTypes' collection is also required for ordering.");
      return [];
    }
    
    console.log(`ProfileTypeActions: Found ${querySnapshot.docs.length} documents in 'profileTypes' collection.`);
    
    const allProfileTypes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Use the Firestore document ID as the 'id' for the profile type
      const typeId = doc.id; 
      const typeLabel = data.label;
      
      if (!isValidProfileType(typeId)) {
        console.warn(`ProfileTypeActions: Document ID "${typeId}" is not a valid ProfileType as defined in src/types. Skipping. Data:`, data);
        return null; // Skip this invalid entry
      }

      if (typeof typeLabel !== 'string' || !typeLabel.trim()) {
         console.warn(`ProfileTypeActions: Document with ID "${typeId}" has missing or empty 'label' field. Using fallback. Data:`, data);
         // Provide a fallback label or skip, depending on desired behavior. Here, using a fallback.
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
    if (error.message && error.message.includes("indexes?")) {
        console.error("ProfileTypeActions: Firestore query failed. This is likely due to a missing index for ordering by 'label' on the 'profileTypes' collection. Please create this index in your Firestore settings: Collection ID 'profileTypes', Field 'label', Order 'Ascending'.");
    }
    return []; // Return empty array on error
  }
}
