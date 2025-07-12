
'use server';

import type { CompetitionCategory, CompetitionCategoryFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getCompetitionCategories(): Promise<CompetitionCategory[]> {
  console.log("CompetitionCategoryActions: Attempting to fetch competition categories from Firestore using Admin SDK.");
  if (!adminDb) {
    console.warn("CompetitionCategoryActions (getCompetitionCategories): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const categoriesCollectionRef = adminDb.collection('competitionCategories');
    const querySnapshot = await categoriesCollectionRef.get();

    if (querySnapshot.empty) {
      console.warn("CompetitionCategoryActions: No documents found in 'competitionCategories' collection.");
      return [];
    }
    
    console.log(`CompetitionCategoryActions: Found ${querySnapshot.docs.length} documents in 'competitionCategories' collection.`);
    
    const allCategories = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || `Unnamed Category (ID: ${doc.id})`,
        description: data.description,
        level: data.level,
        gameFormatId: data.gameFormatId,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
        updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : undefined,
      } as CompetitionCategory; 
    });
    
    allCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    console.log("CompetitionCategoryActions: Successfully fetched and sorted categories using Admin SDK.");
    return allCategories;
  } catch (error: any) {
    console.error('CompetitionCategoryActions: Error fetching competition categories with Admin SDK:', error.message, error.stack);
    return [];
  }
}

export async function createCompetitionCategory(
  formData: CompetitionCategoryFormData,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  try {
    const newCategoryData = {
      ...formData,
      level: Number(formData.level) || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('competitionCategories').add(newCategoryData);
    revalidatePath('/admin/competition-categories');
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating competition category:', error);
    return { success: false, error: error.message || 'Failed to create category.' };
  }
}

export async function updateCompetitionCategory(
    categoryId: string,
    formData: CompetitionCategoryFormData,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    if (!userId) return { success: false, error: 'User not authenticated.' };
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    
    try {
        const categoryRef = adminDb.collection('competitionCategories').doc(categoryId);
        const updateData = {
            ...formData,
            level: Number(formData.level) || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await categoryRef.update(updateData);
        revalidatePath('/admin/competition-categories');
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating category ${categoryId}:`, error);
        return { success: false, error: error.message || 'Failed to update category.' };
    }
}

export async function deleteCompetitionCategory(categoryId: string): Promise<{ success: boolean; error?: string }> {
    if (!adminDb) return { success: false, error: 'Database not initialized.' };
    try {
        await adminDb.collection('competitionCategories').doc(categoryId).delete();
        revalidatePath('/admin/competition-categories');
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting category ${categoryId}:`, error);
        return { success: false, error: error.message || 'Failed to delete category.' };
    }
}
