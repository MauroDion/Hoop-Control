
'use server';

import type { CompetitionCategory, CompetitionCategoryFormData } from '@/types';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import { revalidatePath } from 'next/cache';

export async function getCompetitionCategories(): Promise<CompetitionCategory[]> {
  if (!adminDb) {
    console.warn("CompetitionCategoryActions (getCompetitionCategories): Admin SDK not available. Returning empty array.");
    return [];
  }
  try {
    const categoriesCollectionRef = adminDb.collection('competitionCategories');
    const querySnapshot = await categoriesCollectionRef.orderBy('name').get();

    if (querySnapshot.empty) {
      return [];
    }
    
    const allCategories = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Categoría sin nombre',
        description: data.description || null,
        level: data.level || null,
        isFeminine: data.isFeminine || false,
        gameFormatId: data.gameFormatId || null,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : null,
        updatedAt: data.updatedAt ? (data.updatedAt as admin.firestore.Timestamp).toDate().toISOString() : null,
        createdBy: data.createdBy || null,
      } as CompetitionCategory; 
    });
    
    allCategories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

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
        const teamsUsingCategory = await adminDb.collection('teams').where('competitionCategoryId', '==', categoryId).limit(1).get();
        if(!teamsUsingCategory.empty){
            return { success: false, error: "No se puede eliminar la categoría porque está siendo utilizada por al menos un equipo." };
        }

        await adminDb.collection('competitionCategories').doc(categoryId).delete();
        revalidatePath('/admin/competition-categories');
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting category ${categoryId}:`, error);
        return { success: false, error: error.message || 'Failed to delete category.' };
    }
}
