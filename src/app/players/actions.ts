
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import type { PlayerFormData, Player } from '@/types';

export async function createPlayer(
  formData: PlayerFormData,
  teamId: string,
  clubId: string,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  if (!teamId || !clubId) {
    return { success: false, error: 'Team ID or Club ID is missing.' };
  }
  if (!formData.firstName || !formData.lastName) {
    return { success: false, error: 'First name and last name are required.' };
  }

  if (!adminDb) {
    const errorMessage = 'Firebase Admin SDK is not initialized. Player creation cannot proceed.';
    console.error('PlayerActions (createPlayer):', errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const newPlayerData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      teamId: teamId,
      jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null,
      position: formData.position || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: userId,
    };

    const docRef = await adminDb.collection('players').add(newPlayerData);
    
    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error('Error creating player:', error);
    return { success: false, error: error.message || 'Failed to create player.' };
  }
}

export async function getPlayersByTeamId(teamId: string): Promise<Player[]> {
  console.log(`PlayerActions: Attempting to fetch players for teamId: ${teamId}`);
  if (!adminDb) {
    console.warn('PlayerActions (getPlayersByTeamId): Admin SDK not available. Returning empty array.');
    return [];
  }
  if (!teamId) {
    console.warn('PlayerActions (getPlayersByTeamId): teamId is required.');
    return [];
  }

  try {
    const playersCollectionRef = adminDb.collection('players');
    const q = playersCollectionRef.where('teamId', '==', teamId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`PlayerActions: No players found for teamId: ${teamId}`);
      return [];
    }
    
    console.log(`PlayerActions: Found ${querySnapshot.docs.length} players for teamId: ${teamId}.`);
    
    const players = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      } as Player;
    });

    // Sort by last name, then first name
    players.sort((a, b) => {
        const lastNameComp = a.lastName.localeCompare(b.lastName);
        if (lastNameComp !== 0) return lastNameComp;
        return a.firstName.localeCompare(b.firstName);
    });
    
    return players;
  } catch (error: any) {
    console.error(`PlayerActions: Error fetching players for team ${teamId}:`, error.message, error.stack);
    return [];
  }
}
