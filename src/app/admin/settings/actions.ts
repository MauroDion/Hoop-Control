'use server';

import { adminDb } from '@/lib/firebase/admin';
import type { BrandingSettings } from '@/types';
import { revalidatePath } from 'next/cache';

const SETTINGS_COLLECTION = 'settings';
const BRANDING_DOC = 'branding';
const MAX_IMAGE_SIZE_BYTES = 1024 * 1024; // 1MB

export async function saveBrandingSettings(settings: BrandingSettings): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  
  if (settings.logoDataUrl && settings.logoDataUrl.length > MAX_IMAGE_SIZE_BYTES) {
      return { success: false, error: 'La imagen del logo es demasiado grande. El límite es 1MB.' };
  }
  if (settings.homePageImageUrl && settings.homePageImageUrl.length > MAX_IMAGE_SIZE_BYTES) {
      return { success: false, error: 'La imagen de la página de inicio es demasiado grande. El límite es 1MB.' };
  }
   if (settings.dashboardAvatarUrl && settings.dashboardAvatarUrl.length > MAX_IMAGE_SIZE_BYTES) {
      return { success: false, error: 'La imagen del avatar del panel es demasiado grande. El límite es 1MB.' };
  }

  try {
    const brandingRef = adminDb.collection(SETTINGS_COLLECTION).doc(BRANDING_DOC);
    await brandingRef.set(settings, { merge: true });

    revalidatePath('/', 'layout');
    revalidatePath('/page', 'layout');
    revalidatePath('/dashboard', 'layout');
    
    return { success: true };
  } catch (error: any) {
    console.error("Error saving branding settings:", error);
    return { success: false, error: error.message || 'Failed to save settings.' };
  }
}

export async function getBrandingSettings(): Promise<BrandingSettings> {
  if (!adminDb) {
    console.warn("getBrandingSettings: Database not initialized.");
    return {};
  }
  try {
    const brandingRef = adminDb.collection(SETTINGS_COLLECTION).doc(BRANDING_DOC);
    const docSnap = await brandingRef.get();

    if (docSnap.exists) {
      return docSnap.data() as BrandingSettings;
    }

    return {};
  } catch (error: any) {
    console.error("Error getting branding settings:", error);
    return {};
  }
}
