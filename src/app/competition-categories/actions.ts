
'use server';

import type { CompetitionCategory } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query } from 'firebase/firestore';

export async function getCompetitionCategories(): Promise<CompetitionCategory[]> {
  console.log("CompetitionCategoryActions: Attempting to fetch competition categories from Firestore.");
  try {
    const categoriesCollectionRef = collection(db, 'competitionCategories');
    // Removed orderBy('name') to avoid needing a Firestore index. Sorting is now done in JS.
    const q = query(categoriesCollectionRef);
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("CompetitionCategoryActions: No documents found in 'competitionCategories' collection. Check collection content and Firestore rules.");
      return [];
    }
    
    console.log(`CompetitionCategoryActions: Found ${querySnapshot.docs.length} documents in 'competitionCategories' collection.`);
    
    const allCategories = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Category (ID: ${doc.id})`,
        // Include other fields as needed from CompetitionCategory type if they are stored
        description: data.description,
        level: data.level,
        // ... add other fields
      } as CompetitionCategory; 
    });
    
    // Sort the results alphabetically by name here in the action
    allCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log("CompetitionCategoryActions: Successfully fetched and sorted categories:", JSON.stringify(allCategories, null, 2));
    return allCategories;
  } catch (error: any) {
    console.error('CompetitionCategoryActions: Error fetching competition categories:', error.message, error.stack);
     // The previous index-related error is now less likely, but we keep the generic error handling.
    return []; // Return empty array on error
  }
}
