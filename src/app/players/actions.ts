
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


export async function updatePlayer(
  playerId: string,
  formData: PlayerFormData,
  clubId: string,
  teamId: string,
): Promise<{ success: boolean; error?: string }> {
   if (!playerId) {
    return { success: false, error: "Player ID is required." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const playerRef = adminDb.collection("players").doc(playerId);
    
    const updateData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : null,
      position: formData.position || null,
    };
    
    await playerRef.update(updateData);

    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating player:", error);
    return { success: false, error: error.message || "Failed to update player." };
  }
}

export async function deletePlayer(playerId: string, clubId: string, teamId: string): Promise<{ success: boolean; error?: string }> {
  if (!playerId) {
    return { success: false, error: "Player ID is required." };
  }
  if (!adminDb) {
    return { success: false, error: "Database not initialized."};
  }
  try {
    const playerRef = adminDb.collection("players").doc(playerId);
    await playerRef.delete();
    revalidatePath(`/clubs/${clubId}/teams/${teamId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting player:", error);
    return { success: false, error: error.message || "Failed to delete player." };
  }
}

export async function getPlayersByTeamId(teamId: string): Promise<Player[]> {
  if (!adminDb) {
    return [];
  }
  if (!teamId) {
    return [];
  }

  try {
    const playersCollectionRef = adminDb.collection('players');
    const q = playersCollectionRef.where('teamId', '==', teamId);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return [];
    }
    
    const players = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        jerseyNumber: data.jerseyNumber || null,
        position: data.position || null,
        teamId: data.teamId || null,
        createdBy: data.createdBy || null,
        createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : null,
      } as Player;
    });

    players.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || ''));
    
    return players;
  } catch (error: any) {
    console.error(`PlayerActions: Error fetching players for team ${teamId}:`, error.message, error.stack);
    return [];
  }
}

export async function getPlayersByClub(clubId: string): Promise<Player[]> {
    if (!adminDb) return [];
    if (!clubId) return [];

    const teamsRef = adminDb.collection('teams');
    const teamsQuery = teamsRef.where('clubId', '==', clubId);
    const teamsSnap = await teamsQuery.get();
    if (teamsSnap.empty) return [];

    const teamIds = teamsSnap.docs.map(doc => doc.id);
    if (teamIds.length === 0) return [];

    const playerChunks: Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>>[] = [];
    for (let i = 0; i < teamIds.length; i += 30) {
        const chunk = teamIds.slice(i, i + 30);
        const playersRef = adminDb.collection('players');
        const playersQuery = playersRef.where('teamId', 'in', chunk);
        playerChunks.push(playersQuery.get());
    }
    
    const allPlayersSnapshots = await Promise.all(playerChunks);
    const players: Player[] = [];
    
    allPlayersSnapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            players.push({
                id: doc.id,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                jerseyNumber: data.jerseyNumber || null,
                position: data.position || null,
                teamId: data.teamId || null,
                createdBy: data.createdBy || null,
                createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : null,
            } as Player);
        });
    });

    players.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '') || (a.firstName || '').localeCompare(b.firstName || ''));
    
    return players;
}

export async function getPlayersFromIds(playerIds: string[]): Promise<Player[]> {
    if (!adminDb || playerIds.length === 0) return [];

    try {
        const playerChunks: Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>>[] = [];
        for (let i = 0; i < playerIds.length; i += 30) {
            const chunk = playerIds.slice(i, i + 30);
            const playersRef = adminDb.collection('players');
            const playersQuery = playersRef.where(admin.firestore.FieldPath.documentId(), 'in', chunk);
            playerChunks.push(playersQuery.get());
        }

        const allPlayersSnapshots = await Promise.all(playerChunks);
        const players: Player[] = [];
        
        allPlayersSnapshots.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                players.push({
                    id: doc.id,
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    jerseyNumber: data.jerseyNumber || null,
                    position: data.position || null,
                    teamId: data.teamId || null,
                    createdBy: data.createdBy || null,
                    createdAt: data.createdAt ? (data.createdAt as admin.firestore.Timestamp).toDate().toISOString() : null,
                } as Player);
            });
        });

        return players;
    } catch (error: any) {
        console.error("Error fetching players by IDs:", error);
        return [];
    }
}
