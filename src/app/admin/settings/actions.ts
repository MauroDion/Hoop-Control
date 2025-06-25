'use server';

import { adminDb } from '@/lib/firebase/admin';
import type { BrandingSettings } from '@/types';
import { revalidatePath } from 'next/cache';

const SETTINGS_COLLECTION = 'settings';
const BRANDING_DOC = 'branding';

export async function saveBrandingSettings(settings: BrandingSettings): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized.' };
  }
  
  if (settings.logoDataUrl && settings.logoDataUrl.length > 1000 * 1000) {
      return { success: false, error: 'La imagen es demasiado grande. El límite es aproximadamente 1MB.' };
  }

  try {
    const brandingRef = adminDb.collection(SETTINGS_COLLECTION).doc(BRANDING_DOC);
    await brandingRef.set(settings, { merge: true });

    revalidatePath('/', 'layout');
    
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
