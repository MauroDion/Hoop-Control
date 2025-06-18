
'use server';

import type { CompetitionCategory } from '@/types';
import { db } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export async function getCompetitionCategories(): Promise<CompetitionCategory[]> {
  console.log("CompetitionCategoryActions: Attempting to fetch competition categories from Firestore, ordered by name.");
  try {
    const categoriesCollectionRef = collection(db, 'competitionCategories');
    const q = query(categoriesCollectionRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("CompetitionCategoryActions: No documents found in 'competitionCategories' collection. Check collection content, Firestore rules, and required index on 'name' (asc).");
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
    
    console.log("CompetitionCategoryActions: Successfully fetched categories:", JSON.stringify(allCategories, null, 2));
    return allCategories;
  } catch (error: any) {
    console.error('CompetitionCategoryActions: Error fetching competition categories:', error.message, error.stack);
     if (error.code === 'failed-precondition' && error.message.includes("index")) {
        console.error("CompetitionCategoryActions: Firestore query failed. This is likely due to a missing Firestore index for ordering by 'name' on the 'competitionCategories' collection. Please create this index in your Firebase console: Collection ID 'competitionCategories', Field 'name', Order 'Ascending'.");
    }
    return []; // Return empty array on error
  }
}
